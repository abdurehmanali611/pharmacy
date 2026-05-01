/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosError } from "axios"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

const DEFAULT_API_BASE_URL = "https://pharmacy-backend-black.vercel.app/api";

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

    if (isAuthLogin || isUserCreation) {
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
    supplier_phone?: string;
    supplier_email?: string;
    supplier_name: string;
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
}

export interface updateMedicine extends addMedicine {
    id: string;
}

export interface PurchaseData {
    id: string;
    medicine_name: string;
    quantity: number;
    price: number;
    cost_price: number;
    total_price: number;
    profit: number;
    created_at: string;
    updated_at: string;
}

export interface purchaseMedicine {
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
  invoice_payment_method: "Cash" | "Bank" | "Credit";
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
  invoice_payment_method: "Cash" | "Bank" | "Credit";
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

export async function UserCreation(data: createUser, setLoading: (loading: boolean) => void, router: AppRouterInstance) {
  try {
    setLoading(true);
    const response = await api.post("/user/", data);
    toast.success("User created successfully");
    router.push("/");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to create user"));
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

export async function Login(data: {username: string, password: string}, setLoading: (loading: boolean) => void, router: AppRouterInstance) {
  try {
    setLoading(true);
    const response = await api.post("/auth/login/", data);
    const { access, refresh, user } = response.data;
    localStorage.setItem("token", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("Role", user.role);
    localStorage.setItem("Pharmacy", user.pharmacy_name);
    localStorage.setItem("Logo", user.logoUrl);
    localStorage.setItem("PharmacyTin", user.pharmacy_tin);
    setAuthCookie(access);
    api.defaults.headers.common["Authorization"] = `Bearer ${access}`
    toast.success(`welcome back, ${data.username}!`);

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
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Login failed"));
  }finally {
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
    toast.error(getApiErrorMessage(error, "Failed to fetch medicines"));
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
    toast.success(response.data?.detail ?? "Sales recorded");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to record sales"));
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
