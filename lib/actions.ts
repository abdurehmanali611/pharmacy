/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { type AxiosError } from "axios"
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

const DEFAULT_API_BASE_URL = "https://pharmacy-backend-black.vercel.app/api";

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
    name: string;
    price: number;
    cost: number;
    quantity: number;
    description: string;
    supplier_name: string;
    supplier_phone: string;
    supplier_email?: string;
}

export interface addMedicine {
    name: string;
    price: number;
    cost: number;
    quantity: number;
    description: string;
    supplier_name: string;
    supplier_phone: string;
    supplier_email?: string;
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
    const response = await api.get("/user/");
    return response.data;
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
    const response = await api.post("/medicines/", data);
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
    const response = await api.get("/medicines/");
    return response.data;
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
    const response = await api.put(`/medicines/${data.id}/`, data);
    toast.success("Medicine updated");
    return response.data;
  } catch (error: any) {
    toast.error(getApiErrorMessage(error, "Failed to edit medicine"));
  }finally {
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
    const response = await api.get("/purchases/");
    return response.data;
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