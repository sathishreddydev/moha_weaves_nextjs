import { QueryClient, QueryFunction } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

// Create axios instance with Next.js env
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

async function throwIfResNotOk(error: unknown) {
  if (error instanceof AxiosError) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      `${error.response?.status}: ${error.response?.statusText}`;

    const customError = new Error(errorMessage) as any;
    customError.data = error.response?.data || {};
    customError.status = error.response?.status;

    throw customError;
  }

  throw error;
}

export async function apiRequest(
  method: string,
  url: string,
  reqBody?: any,
  options: any = {}
): Promise<any> {
  try {
    const isFormData =
      typeof FormData !== "undefined" && reqBody instanceof FormData;

    const config: any = {
      method,
      url,
      ...options,
    };

    if (reqBody) {
      if (isFormData) {
        config.data = reqBody;
        config.headers = {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        };
      } else {
        config.data = reqBody;
      }
    }

    const response = await api.request(config);
    return response.data;
  } catch (error) {
    await throwIfResNotOk(error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn =
  <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {
    try {
      const response = await api.get(queryKey.join("/") as string);
      return response.data;
    } catch (error) {
      if (
        error instanceof AxiosError &&
        on401 === "returnNull" &&
        error.response?.status === 401
      ) {
        return null as T;
      }

      await throwIfResNotOk(error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});