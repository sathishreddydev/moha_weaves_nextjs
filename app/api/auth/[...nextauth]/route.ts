import { getAuthOptions } from '@/auth/config/auth';
import NextAuth from 'next-auth';

// Create the handler lazily on first request — this ensures env vars
// (GOOGLE_CLIENT_ID, NEXTAUTH_SECRET, etc.) are read at runtime,
// not baked in during `next build` when they are unavailable.
let _handler: ReturnType<typeof NextAuth> | null = null;

function getHandler() {
  if (!_handler) {
    _handler = NextAuth(getAuthOptions());
  }
  return _handler;
}

export const GET = (...args: any[]) => getHandler()(...args);
export const POST = (...args: any[]) => getHandler()(...args);
