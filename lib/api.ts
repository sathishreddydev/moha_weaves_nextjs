import {
  ApiResponse,
  LoginCredentials,
  RegisterCredentials,
  User
} from '../shared';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_KEY = process.env.ADMIN_API_KEY || '';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Custom error class for API errors
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Retry configuration
const retryConfig = {
  retries: MAX_RETRIES,
  retryDelay: RETRY_DELAY,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }
};

// Create base axios instance with enhanced configuration
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    withCredentials: true, // Enable credentials for cross-domain requests
  });

  // Request interceptor for authentication and logging
  client.interceptors.request.use(
    (config) => {
      // Add auth token from localStorage or cookie
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') || getCookie('auth_token')
        : null;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request timestamp for debugging
      (config as any).metadata = { startTime: new Date() };

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          data: config.data,
          headers: config.headers,
        });
      }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(new ApiError('Request setup failed', undefined, 'REQUEST_ERROR'));
    }
  );

  // Response interceptor for error handling, logging, and retries
  client.interceptors.response.use(
    (response) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        const duration = new Date().getTime() - (response.config as any).metadata?.startTime?.getTime();
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, {
          status: response.status,
          data: response.data,
        });
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API Error: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest?._retry) {
        (originalRequest as any)._retry = true;

        // Clear auth tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          deleteCookie('auth_token');
        }

        // Redirect to login if not already there
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(new ApiError('Session expired. Please login again.', 401, 'UNAUTHORIZED'));
      }

      // Handle 403 Forbidden
      if (error.response?.status === 403) {
        return Promise.reject(new ApiError('Access forbidden. Insufficient permissions.', 403, 'FORBIDDEN'));
      }

      // Handle 404 Not Found
      if (error.response?.status === 404) {
        return Promise.reject(new ApiError('Resource not found.', 404, 'NOT_FOUND'));
      }

      // Handle 429 Rate Limit
      if (error.response?.status === 429) {
        return Promise.reject(new ApiError('Too many requests. Please try again later.', 429, 'RATE_LIMIT'));
      }

      // Handle 500 Server Errors with retry logic
      if (retryConfig.retryCondition(error)) {
        originalRequest._retryCount = originalRequest._retryCount || 0;

        if (originalRequest._retryCount < retryConfig.retries) {
          originalRequest._retryCount++;

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * (originalRequest._retryCount || 1)));

          console.log(`🔄 Retrying request: ${originalRequest.method?.toUpperCase()} ${originalRequest.url} (Attempt ${originalRequest._retryCount})`);

          return client(originalRequest);
        }
      }

      // Handle network errors
      if (!error.response) {
        return Promise.reject(new ApiError('Network error. Please check your connection.', undefined, 'NETWORK_ERROR'));
      }

      // Generic error handling
      const responseData = error.response.data as any;
      const errorMessage = responseData?.error || responseData?.message || error.message || 'An unexpected error occurred';
      return Promise.reject(new ApiError(errorMessage, error.response.status, 'API_ERROR', error.response.data));
    }
  );

  return client;
};

// Cookie management utilities
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }

  return null;
};

const setCookie = (name: string, value: string, options: { days?: number; domain?: string; secure?: boolean } = {}): void => {
  if (typeof document === 'undefined') return;

  let cookie = `${name}=${value}; path=/`;

  if (options.days) {
    const date = new Date();
    date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000));
    cookie += `; expires=${date.toUTCString()}`;
  }

  if (options.domain) {
    cookie += `; domain=${options.domain}`;
  }

  if (options.secure || window.location.protocol === 'https:') {
    cookie += '; secure';
  }

  document.cookie = cookie;
};

const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
};

// Create API client instance
const apiClient = createApiClient();

// Generic API request wrapper with error handling
const apiRequest = async <T>(
  requestFn: () => Promise<AxiosResponse<T>>
): Promise<ApiResponse<T>> => {
  try {
    const response = await requestFn();
    return response.data as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
};

// Authentication API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> => {
    return apiRequest(async () => {
      const response = await apiClient.post('/login', credentials);

      // Store tokens in both localStorage and cookies for cross-domain support
      if (response.data.success && response.data.data?.token) {
        const { token, refreshToken } = response.data.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', refreshToken);

          // Set cookies for cross-domain authentication
          setCookie('auth_token', token, { days: 7, secure: false });
          setCookie('refresh_token', refreshToken, { days: 30, secure: false });
        }
      }

      return response;
    });
  },

  register: async (credentials: RegisterCredentials): Promise<ApiResponse<{ user: User; token: string; refreshToken: string }>> => {
    return apiRequest(async () => {
      const response = await apiClient.post('/auth/register', credentials);

      // Store tokens after successful registration
      if (response.data.success && response.data.data?.token) {
        const { token, refreshToken } = response.data.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', refreshToken);

          setCookie('auth_token', token, { days: 7, secure: false });
          setCookie('refresh_token', refreshToken, { days: 30, secure: false });
        }
      }

      return response;
    });
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return apiRequest(async () => {
      const response = await apiClient.post('/auth/logout');

      // Clear tokens from both storage and cookies
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');

        deleteCookie('auth_token');
        deleteCookie('refresh_token');
      }

      return response;
    });
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiRequest(() => apiClient.get('/auth/me'));
  },

  refreshToken: async (): Promise<ApiResponse<{ token: string; refreshToken: string }>> => {
    return apiRequest(async () => {
      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('refresh_token') || getCookie('refresh_token')
        : null;

      if (!refreshToken) {
        throw new ApiError('No refresh token available', 401, 'NO_REFRESH_TOKEN');
      }

      const response = await apiClient.post('/auth/refresh', { refreshToken });

      // Update tokens
      if (response.data.success && response.data.data?.token) {
        const { token, refreshToken: newRefreshToken } = response.data.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', newRefreshToken);

          setCookie('auth_token', token, { days: 7, secure: false });
          setCookie('refresh_token', newRefreshToken, { days: 30, secure: false });
        }
      }

      return response;
    });
  },
};


export { ApiError, deleteCookie, getCookie, setCookie };

export default apiClient;
