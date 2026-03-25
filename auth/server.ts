// Server-side only exports
import 'server-only';

export { AuthService, RateLimitService } from './services/auth-service';
export { authOptions } from './config/auth';
export { getServerSession } from 'next-auth';

// Auth types
export type { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthTokens, 
  RateLimitResult 
} from './types/auth.types';
