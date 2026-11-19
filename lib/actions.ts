/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosError } from "axios"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

const DEFAULT_API_BASE_URL = "https://pharmacy-backend-ebon-delta.vercel.app/api";

type MaybePaginated<T> =
  | T[]
  | {
      results?: T[];
    }
  | null
  | undefined;

function unwrapResults<T>(data: MaybePaginated<T>): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).results)) return (data as any).results;
  return [];
}

function getApiBaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!rawUrl) return DEFAULT_API_BASE_URL;
  const trimmed = rawUrl.replace(/\/+$|\s+/g, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const api = axios.create({
    baseURL: getApiBaseUrl(),
})

const AUTH_TOKEN_KEY = "authToken"
const API_DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_API === "true";

type FieldErrors = Record<string, string | string[]>;

/**
 * Django REST returns validation failures as field-keyed maps, e.g.
 * `{ "payment_transaction_ref": ["Transfer ID must be at least 4 characters."] }`.
 * Without this, those responses fell back to a generic "Failed…" message.
 */
function extractFieldErrors(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];

  return Object.entries(data as FieldErrors).flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    return messages
      .filter((message): message is string => typeof message === "string")
      .map((message) =>
        field === "non_field_errors" || field === "detail"
          ? message
          : `${field.replace(/_/g, " ")}: ${message}`,
      );
  });
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const axiosError = error as AxiosError<any>;
  const data = axiosError.response?.data;

  const detail =
    typeof data?.detail === "string"
      ? data.detail
      : typeof data?.message === "string"
        ? data.message
        : undefined;

  if (detail) return detail;

  const fieldErrors = extractFieldErrors(data);
  if (fieldErrors.length) return fieldErrors.join("\n");

  if (typeof axiosError.message === "string" && axiosError.message) return axiosError.message;
  return fallback;
}

function setAuthCookie(token: string) {
  document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem("refresh");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(
      `${getApiBaseUrl()}/auth/token/refresh/`,
      { refresh: refreshToken }
    );

    const { access } = response.data;
    localStorage.setItem("token", access);
    setAuthCookie(access);
    api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
    return access;
  } catch (error) {
    console.error("[token refresh failed]", error);
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    clearAuthCookie();
    delete api.defaults.headers.common["Authorization"];
    throw error;
  }
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    const url = config.url ?? "";
    const method = config.method?.toLowerCase();
    const isAuthLogin = url.includes("/auth/login");
    const isUserCreation = url.endsWith("/user/") && method === "post";
    const isPublicBilling =
      url.includes("/billing/signup-status") || url.includes("/billing/resubmit-setup");

    if (isAuthLogin || isUserCreation || isPublicBilling) {
      if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
      }
    } else if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (API_DEBUG_ENABLED) {
      console.log("[api response]", {
        status: response.status,
        url: `${response.config.baseURL}${response.config.url}`,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const errorCode = error.response?.data?.code;

    if (typeof window !== "undefined" && errorCode === "token_not_valid" && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        clearAuthCookie();
        delete api.defaults.headers.common["Authorization"];
        if (typeof window !== "undefined") {
          window.location.href = "/Login";
        }
        return Promise.reject(error);
      }

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/Login";
        }
        return Promise.reject(refreshError);
      }
    }

    if (API_DEBUG_ENABLED) {
      console.error("[api error]", {
        message: error?.message,
        status: error.response?.status,
        url: `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
        data: error.response?.data,
      });
    }
    return Promise.reject(error);
  },
);

export interface UserData {
    id: string;
    username: string;
    full_name?: string;
    password: string;
    pharmacy_name: string;
    role: string;
    logoUrl: string;
    pharmacy_tin: string;
}

export interface createUser {
    username: string;
    password: string;
    pharmacy_name: string;
    role: string;
    logoUrl: string;
    pharmacy_tin: string;
    payment_channel?: string;
    payment_transaction_ref?: string;
    sales_agent_id?: number | null;
}

export interface updateUser extends createUser {
    id: string;
}

export interface MedicineData {
    id: string;
    selected_supplier_id?: number | null;
    name: string;
    category?: string;
    price: number;
    cost: number;
    quantity: number;
    batch_number: string;
    expiry_date?: string | null;
    description: string;
    image_url?: string | null;
    supplier_phone?: string;
    supplier_email?: string;
    supplier_name: string;
    received_quantity?: number;
    paid_amount?: number | string;
    total_cost?: number | string;
    credit_amount?: number | string;
    payment_status?: "paid" | "credit";
    created_at?: string;
}

export interface addMedicine {
    supplier_id: string;
    name: string;
    category: string;
    price: number;
    cost: number;
    quantity: number;
    expiry_date?: string | Date | null;
    description: string;
    batch_number: string;
    image_url?: string;
    paid_amount?: number;
}

export interface updateMedicine extends addMedicine {
    id: string;
}

export interface PurchaseData {
    id: string;
    medicine_id?: number | null;
    medicine_name: string;
    quantity: number;
    sold_by_id?: number | null;
    sold_by_name?: string;
    customer_name?: string;
    discount_percent?: number | string | null;
    list_price?: number | string | null;
    rule_trigger?: string;
    price: number;
    cost_price: number;
    total_price: number;
    profit: number;
    created_at: string;
    updated_at: string;
}

export interface purchaseMedicine {
    medicine_id?: number;
    medicine_name: string;
    quantity: number;
    price: number;
    total_price: number;
}

export interface updatePurchase extends purchaseMedicine {
    id: string;
}

export interface saleCartPayload {
  items: purchaseMedicine[];
  customer_name?: string;
}

export interface SupplierData {
  id: string;
  supplier_name: string;
  supplier_phone: string;
  supplier_email: string;
  created_at: string;
  updated_at: string;
}

export interface createSupplier {
  supplier_name: string;
  supplier_phone: string;
  supplier_email?: string;
}

export interface updateSupplier extends createSupplier {
  id: string;
}

export interface InvoiceData {
  id: string;
  selected_supplier_id?: number | null;
  supplier_name?: string;
  invoice_number: string;
  invoice_date: string;
  invoice_amount: number;
  invoice_status: "paid" | "unpaid";
  invoice_type: "purchase" | "sale";
  invoice_payment_method: "Cash" | "Bank" | "Credit" | "Telebirr";
  invoice_image?: string;
  created_at: string;
  updated_at: string;
}

export interface CashoutData {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface createInvoice {
  supplier_id: string;
  invoice_number: string;
  invoice_date: string | Date;
  invoice_amount: number;
  invoice_status: "paid" | "unpaid";
  invoice_type: "purchase" | "sale";
  invoice_payment_method: "Cash" | "Bank" | "Credit" | "Telebirr";
  invoice_image?: string;
}

export interface updateInvoice extends createInvoice {
  id: string;
}

export interface createCashout {
  amount: number;
  reason: string;
}

export interface updateCashout extends createCashout {
  id: string;
}

export async function UserCreation(
  data: createUser,
  setLoading: (loading: boolean) => void,
  onError?: (messages: string[]) => void,
) {
  try {
    setLoading(true);
    const response = await api.post("/user/", data);
    toast.success("Registration submitted. Waiting for Apex payment approval.");
    return response.data;
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, "Failed to create user");
    onError?.(message.split("\n").filter(Boolean));
    toast.error(message);
    return null;
  } finally {
    setLoading(false);
  }
}

export async function CreateUser(data: createUser, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.post("/user/", data);
    toast.success("User created successfully");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to create user"));
  } finally {
    setLoading(false);
  }
}

export async function fetchUser() {
  try {
    const response = await api.get("/user/", {
      params: { page_size: 500 },
    });
    return unwrapResults<UserData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to fetch user"));
  }
}

export async function EditUser(data: updateUser, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.put(`/user/${data.id}/`, data);
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to edit user"));
  }finally {
    setLoading(false);
  }
}

export type SalesAgentInput = { full_name: string; password: string };

export async function createSalesAgents(
  username: string,
  items: SalesAgentInput[],
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const response = await api.post("/user/bulk_create/", { username, items });
    toast.success(`${items.length} sales agent${items.length === 1 ? "" : "s"} created`);
    return response.data as UserData[];
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to create sales agents"));
  } finally {
    setLoading(false);
  }
}

export async function updateSalesAgent(
  id: number | string,
  data: { full_name: string; username?: string; password?: string },
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const payload: { full_name: string; username?: string; password?: string } = { full_name: data.full_name };
    if (data.username) payload.username = data.username;
    if (data.password) payload.password = data.password;
    const response = await api.patch(`/user/${id}/`, payload);
    toast.success("Sales agent updated");
    return response.data as UserData;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to update sales agent"));
  } finally {
    setLoading(false);
  }
}

export async function deleteUser(id: number, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.delete(`/user/${id}/`);
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to delete user"));
  }finally {
    setLoading(false);
  }
}

export async function Login(
  data: { username: string; password: string },
  setLoading: (loading: boolean) => void,
  router: AppRouterInstance,
  onError?: (message: string) => void,
) {
  try {
    setLoading(true);
    const response = await api.post("/auth/login/", data);
    const { access, refresh, user, access_mode, payment_kind, period_status, billing } = response.data;
    localStorage.setItem("token", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("Role", user.role);
    localStorage.setItem("FullName", user.full_name ?? "");
    localStorage.setItem("UserId", String(user.id ?? ""));
    localStorage.setItem("Username", user.username ?? "");
    localStorage.setItem("Pharmacy", user.pharmacy_name);
    localStorage.setItem("Logo", user.logoUrl);
    localStorage.setItem("PharmacyTin", user.pharmacy_tin);
    localStorage.setItem("access_mode", access_mode || "full");
    if (payment_kind) localStorage.setItem("payment_kind", payment_kind);
    else localStorage.removeItem("payment_kind");
    if (period_status) localStorage.setItem("period_status", period_status);
    if (billing) localStorage.setItem("billing", JSON.stringify(billing));
    setAuthCookie(access);
    api.defaults.headers.common["Authorization"] = `Bearer ${access}`
    toast.success(`welcome back, ${data.username}!`);

    if (access_mode === "payment_portal") {
      router.push("/PaymentVerification");
      toast.message("Complete payment verification to unlock Medicare.");
      return response.data;
    }

    if (user.role.toLowerCase() === "manager") {
      router.push("/Manager");
      toast.success("Logged in as manager");
    } else if (user.role.toLowerCase() === "pharmacist") {
      router.push("/Pharmacist");
      toast.success("Logged in as pharmacist");
    } else {
      router.push("/");
      toast.error("Unknown user role");
    }

    return response.data;
  } catch (error: unknown) {
    const message = getApiErrorMessage(error, "Login failed");
    onError?.(message);
    toast.error(message);
  } finally {
    setLoading(false);
  }
}

export async function Logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh");
  clearAuthCookie();
  delete api.defaults.headers.common["Authorization"];
  toast.success("Logged out successfully");
  window.location.href = "/";
}

export type StockLossKind = "damaged_wasted";

export type StockLossData = {
  id: number;
  medicine_id: number | null;
  medicine_name: string;
  batch_number: string;
  kind: StockLossKind;
  quantity: number;
  cost_price: number | string;
  value: number | string;
  expiry_date: string | null;
  recorded_by: string;
  note: string;
  created_at: string;
};

export async function fetchStockLosses() {
  try {
    const response = await api.get("/medicines/losses/");
    return unwrapResults<StockLossData>(response.data);
  } catch {
    // Optional data: if the endpoint is not available yet, the report simply shows no write-offs.
    return [] as StockLossData[];
  }
}

export async function registerStockLoss(
  data: { kind?: StockLossKind; items: { medicine_id: number; quantity: number }[]; note?: string },
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const response = await api.post("/medicines/register_loss/", data);
    toast.success(response.data?.detail ?? "Stock updated");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to register stock loss"));
  } finally {
    setLoading(false);
  }
}

export async function createMedicine(data: addMedicine, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const payload = {
      ...data,
      supplier_id: Number(data.supplier_id),
      expiry_date:
        data.expiry_date instanceof Date
          ? data.expiry_date.toISOString().slice(0, 10)
          : (data.expiry_date ?? null),
    };
    const response = await api.post("/medicines/", payload);
    toast.success("Medicine added");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to create medicine"));
  } finally {
    setLoading(false);
  }
}

export async function createBatchMedicines(
  items: addMedicine[],
  setLoading: (loading: boolean) => void,
) {
  if (!items.length) return [];
  try {
    setLoading(true);
    const created: any[] = [];
    for (const item of items) {
      const payload = {
        ...item,
        supplier_id: Number(item.supplier_id),
        expiry_date:
          item.expiry_date instanceof Date
            ? item.expiry_date.toISOString().slice(0, 10)
            : (item.expiry_date ?? null),
      };
      const res = await api.post("/medicines/", payload);
      created.push(res.data);
    }
    toast.success(`${created.length} medicine${created.length === 1 ? "" : "s"} added to inventory`);
    return created;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to complete batch medicine creation"));
    throw error;
  } finally {
    setLoading(false);
  }
}

export async function fetchMedicine() {
  try {
    const response = await api.get("/medicines/", {
      params: { page_size: 500, ordering: "-created_at" },
    });
    return unwrapResults<MedicineData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to fetch medicines"));
  }
}

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  /** Set when the requested page no longer existed and the first page was returned instead. */
  adjusted_page?: number;
};

export async function fetchMedicinePage(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  createdDate?: string; // YYYY-MM-DD
  ordering?: string;
}): Promise<PaginatedResponse<MedicineData> | undefined> {
  try {
    const response = await api.get("/medicines/", {
      params: {
        page: params?.page,
        page_size: params?.pageSize,
        search: params?.search,
        created_date: params?.createdDate,
        ordering: params?.ordering,
      },
    });
    return response.data;
  } catch (error: any) {
    // A page that no longer exists (e.g. after deleting the last row on it) is not an error:
    // quietly fall back to the first page instead of toasting "Not found" again and again.
    if (error?.response?.status === 404 && (params?.page ?? 1) > 1) {
      const first = await fetchMedicinePage({ ...params, page: 1 });
      return first ? { ...first, adjusted_page: 1 } : first;
    }
    toast.error(getApiErrorMessage(error, "Failed to fetch medicines"), { id: "fetch-medicines" });
  }
}

export async function EditMedicine(data: updateMedicine, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const payload = {
      ...data,
      supplier_id: Number(data.supplier_id),
      expiry_date:
        data.expiry_date instanceof Date
          ? data.expiry_date.toISOString().slice(0, 10)
          : (data.expiry_date ?? null),
    };
    const response = await api.put(`/medicines/${data.id}/`, payload);
    toast.success("Medicine updated");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to edit medicine"));
  }finally {
    setLoading(false);
  }
}

export async function importMedicinesExcel(
  file: File,
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    const response = await api.post("/medicines/import_excel/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success(response.data?.detail ?? "Medicines imported");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to import medicines"));
  } finally {
    setLoading(false);
  }
}

export async function deleteMedicine(id: number, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.delete(`/medicines/${id}/`);
    toast.success("Medicine deleted");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to delete medicine"));
  }finally {
    setLoading(false);
  }
}

export async function CreatePurchase(data: purchaseMedicine, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.post("/purchases/", data);
    toast.success("Sale recorded");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to create purchase"));
  } finally {
    setLoading(false);
  }
}

export async function fetchPurchase() {
  try {
    const response = await api.get("/purchases/", {
      params: { page_size: 500 },
    });
    return unwrapResults<PurchaseData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to fetch purchases"));
  }
}

export async function EditPurchase(data: updatePurchase, setLoading: (loading: boolean) => void) {
  try {    
    setLoading(true);
    const response = await api.put(`/purchases/${data.id}/`, data);
    toast.success("Sale updated");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to edit purchase"));
  }finally {   
    setLoading(false);
  }
}

export async function deletePurchase(id: number, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.delete(`/purchases/${id}/`);
    toast.success("Sale deleted");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to delete purchase"));
  }finally {
    setLoading(false);
  }
}

export async function ChangePassword(data: {old_password: string, new_password: string}, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.post("/user/change_password/", data);
    toast.success(response.data?.detail ?? "Password updated successfully");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to change password"));
  }finally {
    setLoading(false);
  }
}

export async function CreateBulkPurchase(data: saleCartPayload, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.post("/purchases/bulk_create/", data);
    if (response.status === 202 || response.data?.pending) {
      toast.message(response.data?.detail ?? "Sale held for manager approval");
    } else {
      toast.success(response.data?.detail ?? "Sales recorded");
    }
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to record sales"));
  } finally {
    setLoading(false);
  }
}

export type QuantitySaleRuleData = {
  id: number;
  medicine_id: number;
  medicine_name: string;
  threshold: number;
  final: number | null;
  created_at: string;
  updated_at: string;
};

export type ApprovalRequiredMedicineData = {
  id: number;
  medicine_id: number;
  medicine_name: string;
  medicine_price: number;
  medicine_quantity: number;
  created_at: string;
  updated_at: string;
};

export type PendingSaleLineData = {
  id: number;
  medicine_id: number | null;
  medicine_name: string;
  original_quantity: number;
  original_price: number;
  trigger: "none" | "quantity_band" | "needs_approval";
  is_attachment: boolean;
  parent_line: number | null;
  manager_unit_price: number | null;
  qty_threshold: number | null;
  qty_final: number | null;
  pharmacist_quantity: number | null;
  discount_percent: number | string | null;
  effective_price: number;
  attachments: PendingSaleLineData[];
};

export type PendingSaleData = {
  id: number;
  pharmacy_tin: string;
  status:
    | "awaiting_manager"
    | "awaiting_pharmacist"
    | "rejected"
    | "settled"
    | "failed";
  created_by: number | null;
  created_by_username: string;
  reviewed_by: number | null;
  manager_reject_reason: string;
  customer_name: string;
  lines: PendingSaleLineData[];
  created_at: string;
  updated_at: string;
};

export async function fetchQuantitySaleRules() {
  const response = await api.get("/sales-approvals/quantity-rules/");
  return unwrapResults<QuantitySaleRuleData>(response.data);
}

export async function createBulkQuantitySaleRules(
  items: { medicine_id: number; threshold: number; final?: number | null }[],
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const response = await api.post("/sales-approvals/quantity-rules/bulk_create/", { items });
    toast.success("Quantity rules saved");
    return unwrapResults<QuantitySaleRuleData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to save quantity rules"));
  } finally {
    setLoading(false);
  }
}

export async function deleteQuantitySaleRule(id: number | string) {
  try {
    await api.delete(`/sales-approvals/quantity-rules/${id}/`);
    toast.success("Quantity rule removed");
    return true;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to remove quantity rule"));
    return false;
  }
}

export async function fetchApprovalRequiredMedicines() {
  const response = await api.get("/sales-approvals/approval-required/");
  return unwrapResults<ApprovalRequiredMedicineData>(response.data);
}

export async function createBulkApprovalRequired(
  medicine_ids: number[],
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const response = await api.post("/sales-approvals/approval-required/bulk_create/", {
      medicine_ids,
    });
    toast.success("Needs-approval items saved");
    return unwrapResults<ApprovalRequiredMedicineData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to mark items for approval"));
  } finally {
    setLoading(false);
  }
}

export async function deleteApprovalRequiredMedicine(id: number | string) {
  try {
    await api.delete(`/sales-approvals/approval-required/${id}/`);
    toast.success("Removed from needs-approval list");
    return true;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to remove item"));
    return false;
  }
}

export type DiscountRole = "health_professional" | "other";

export type DiscountRuleData = {
  id: number;
  customer_name: string;
  role: DiscountRole;
  specific_role: string;
  medicine_ids: number[];
  medicine_names: string[];
  percentage: number | string;
  created_at: string;
  updated_at: string;
};

export type DiscountRulePayload = {
  customer_name: string;
  role: DiscountRole;
  specific_role?: string;
  medicine_ids: number[];
  percentage: number;
};

export async function fetchDiscountRules() {
  const response = await api.get("/sales-approvals/discount-rules/");
  return unwrapResults<DiscountRuleData>(response.data);
}

export async function createBulkDiscountRules(
  items: DiscountRulePayload[],
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const response = await api.post("/sales-approvals/discount-rules/bulk_create/", { items });
    toast.success("Discount rules saved");
    return unwrapResults<DiscountRuleData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to save discount rules"));
  } finally {
    setLoading(false);
  }
}

export async function updateDiscountRule(
  id: number | string,
  data: DiscountRulePayload,
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const response = await api.put(`/sales-approvals/discount-rules/${id}/`, data);
    toast.success("Discount rule updated");
    return response.data as DiscountRuleData;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to update discount rule"));
  } finally {
    setLoading(false);
  }
}

export async function deleteDiscountRule(id: number | string) {
  try {
    await api.delete(`/sales-approvals/discount-rules/${id}/`);
    toast.success("Discount rule removed");
    return true;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to remove discount rule"));
    return false;
  }
}

export async function fetchPendingSales(status?: string) {
  const response = await api.get("/sales-approvals/pending-sales/", {
    params: status ? { status } : undefined,
  });
  return unwrapResults<PendingSaleData>(response.data);
}

export async function managerDecidePendingSale(
  id: number | string,
  payload: {
    action: "approve" | "reject";
    reject_reason?: string;
    line_updates?: {
      id: number;
      manager_unit_price?: number | null;
      qty_threshold?: number | null;
      qty_final?: number | null;
    }[];
    attachments?: {
      parent_line_id: number;
      medicine_id?: number | null;
      medicine_name: string;
      qty_threshold: number;
      qty_final?: number | null;
      manager_unit_price?: number | null;
      original_price?: number;
    }[];
  },
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const response = await api.post(`/sales-approvals/pending-sales/${id}/manager_decide/`, payload);
    toast.success(payload.action === "reject" ? "Sale rejected" : "Sent to pharmacist for confirmation");
    return response.data as PendingSaleData;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to process pending sale"));
  } finally {
    setLoading(false);
  }
}

export async function pharmacistConfirmPendingSale(
  id: number | string,
  payload: {
    action: "accept" | "reject";
    lines?: { id: number; quantity: number }[];
  },
  setLoading: (loading: boolean) => void,
) {
  try {
    setLoading(true);
    const response = await api.post(
      `/sales-approvals/pending-sales/${id}/pharmacist_confirm/`,
      payload,
    );
    toast.success(
      payload.action === "accept"
        ? (response.data?.detail ?? "Sale settled")
        : "Sale cancelled",
    );
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to confirm pending sale"));
  } finally {
    setLoading(false);
  }
}

export async function createSupplierRecord(data: createSupplier, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.post("/suppliers/", data);
    toast.success("Supplier added");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to create supplier"));
  } finally {
    setLoading(false);
  }
}

export async function createBatchSuppliers(
  items: createSupplier[],
  setLoading: (loading: boolean) => void,
) {
  if (!items.length) return [];
  try {
    setLoading(true);
    const created: any[] = [];
    for (const item of items) {
      const res = await api.post("/suppliers/", item);
      created.push(res.data);
    }
    toast.success(`${created.length} vendor${created.length === 1 ? "" : "s"} added to directory`);
    return created;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to complete batch supplier creation"));
    throw error;
  } finally {
    setLoading(false);
  }
}

export async function fetchSuppliers() {
  try {
    const response = await api.get("/suppliers/", {
      params: { ordering: "supplier_name", page_size: 500 },
    });
    return unwrapResults<SupplierData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to fetch suppliers"));
  }
}

export async function editSupplierRecord(data: updateSupplier, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.put(`/suppliers/${data.id}/`, data);
    toast.success("Supplier updated");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to edit supplier"));
  } finally {
    setLoading(false);
  }
}

export async function deleteSupplierRecord(id: number, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.delete(`/suppliers/${id}/`);
    toast.success("Supplier deleted");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to delete supplier"));
  } finally {
    setLoading(false);
  }
}

export async function createInvoiceRecord(data: createInvoice, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const payload = {
      ...data,
      supplier_id: Number(data.supplier_id),
      invoice_date:
        data.invoice_date instanceof Date
          ? data.invoice_date.toISOString().slice(0, 10)
          : data.invoice_date,
    };
    const response = await api.post("/invoices/", payload);
    toast.success("Invoice added");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to create invoice"));
  } finally {
    setLoading(false);
  }
}

export async function createBatchInvoices(
  items: createInvoice[],
  setLoading: (loading: boolean) => void,
) {
  if (!items.length) return [];
  try {
    setLoading(true);
    const created: any[] = [];
    for (const item of items) {
      const payload = {
        ...item,
        supplier_id: Number(item.supplier_id),
        invoice_date:
          item.invoice_date instanceof Date
            ? item.invoice_date.toISOString().slice(0, 10)
            : item.invoice_date,
      };
      const res = await api.post("/invoices/", payload);
      created.push(res.data);
    }
    toast.success(`${created.length} invoice${created.length === 1 ? "" : "s"} recorded`);
    return created;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to complete batch invoice creation"));
    throw error;
  } finally {
    setLoading(false);
  }
}

export async function fetchInvoices() {
  try {
    const response = await api.get("/invoices/", {
      params: { page_size: 500 },
    });
    return unwrapResults<InvoiceData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to fetch invoices"));
  }
}

export async function editInvoiceRecord(data: updateInvoice, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const payload = {
      ...data,
      supplier_id: Number(data.supplier_id),
      invoice_date:
        data.invoice_date instanceof Date
          ? data.invoice_date.toISOString().slice(0, 10)
          : data.invoice_date,
    };
    const response = await api.put(`/invoices/${data.id}/`, payload);
    toast.success("Invoice updated");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to edit invoice"));
  } finally {
    setLoading(false);
  }
}

export async function deleteInvoiceRecord(id: number, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.delete(`/invoices/${id}/`);
    toast.success("Invoice deleted");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to delete invoice"));
  } finally {
    setLoading(false);
  }
}

export async function createCashoutRecord(data: createCashout, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.post("/cashouts/", data);
    toast.success("Cashout added");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to create cashout"));
  } finally {
    setLoading(false);
  }
}

export async function createBatchCashouts(
  items: createCashout[],
  setLoading: (loading: boolean) => void,
) {
  if (!items.length) return [];
  try {
    setLoading(true);
    const created: any[] = [];
    for (const item of items) {
      const res = await api.post("/cashouts/", item);
      created.push(res.data);
    }
    toast.success(`${created.length} expense line${created.length === 1 ? "" : "s"} recorded`);
    return created;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to complete batch cashout creation"));
    throw error;
  } finally {
    setLoading(false);
  }
}

export async function fetchCashouts() {
  try {
    const response = await api.get("/cashouts/", {
      params: { page_size: 500 },
    });
    return unwrapResults<CashoutData>(response.data);
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to fetch cashouts"));
  }
}

export async function editCashoutRecord(data: updateCashout, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.put(`/cashouts/${data.id}/`, data);
    toast.success("Cashout updated");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to edit cashout"));
  } finally {
    setLoading(false);
  }
}

export async function deleteCashoutRecord(id: number, setLoading: (loading: boolean) => void) {
  try {
    setLoading(true);
    const response = await api.delete(`/cashouts/${id}/`);
    toast.success("Cashout deleted");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to delete cashout"));
  } finally {
    setLoading(false);
  }
}

export async function getBillingMe() {
  const response = await api.get("/billing/me/");
  return response.data;
}

export async function fetchPublicPricing() {
  const response = await api.get("/billing/pricing/");
  return response.data as {
    business_type: string;
    setup_fee_etb: number;
    quarterly_fee_etb: number;
    yearly_fee_etb?: number;
    source?: string;
    description?: string;
  };
}

export async function fetchPublicSalesAgents() {
  const response = await api.get("/billing/sales-agents/");
  return (response.data ?? []) as {
    id: number;
    displayName: string;
    phone?: string | null;
    city?: string | null;
  }[];
}

export async function submitTenantPayment(data: {
  payment_kind: string;
  payment_channel: string;
  transaction_ref: string;
}) {
  const response = await api.post("/billing/submit-payment/", data);
  return response.data;
}

export async function fetchSignupRegistrationStatus(username: string) {
  const response = await api.get("/billing/signup-status/", { params: { username } });
  return response.data as {
    status: "pending" | "approved" | "rejected" | "not_found";
    pharmacy_name?: string;
    pharmacy_tin?: string;
    setup_fee_etb?: number;
    transaction_ref?: string;
    payment_channel?: string;
    rejection_reason?: string;
    detail?: string;
  };
}

export async function resubmitSignupSetupPayment(data: {
  username: string;
  password: string;
  payment_channel: string;
  transaction_ref: string;
}) {
  const response = await api.post("/billing/resubmit-setup/", data);
  return response.data;
}

export type TenantFeedbackMessage = {
  id: number;
  sender_side: string;
  body: string;
  image_url?: string;
  sender_username?: string;
  created_at: string;
};

export async function fetchTenantFeedbackInbox(opts?: { markRead?: boolean }) {
  const response = await api.get("/billing/feedback/inbox/", {
    params: opts?.markRead ? { mark_read: "1" } : undefined,
  });
  return response.data as {
    thread_id: number;
    status: string;
    unread_from_apex: number;
    messages: TenantFeedbackMessage[];
  };
}

export async function sendTenantFeedbackMessage(body: string, image_url = "") {
  const response = await api.post("/billing/feedback/send/", { body, image_url });
  return response.data as TenantFeedbackMessage;
}
