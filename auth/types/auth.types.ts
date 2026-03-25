// Auth-related types
export interface LoginCredentials {
  email: string;
  password: string;
  role?: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface RateLimitResult {
  allowed: boolean;
  resetTime?: number;
}
