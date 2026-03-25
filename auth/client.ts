// Client-side only exports
export { useAuth } from './hooks/useAuth';
export { AuthProvider } from './providers/AuthProvider';
export { default as AuthWrapper } from './components/AuthWrapper';
export { AuthUtils } from './utils/auth.utils';

// Auth types
export type { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthTokens, 
  RateLimitResult 
} from './types/auth.types';

// Re-export NextAuth types for convenience
export type { Session } from 'next-auth';
export { signIn, signOut, useSession } from 'next-auth/react';
