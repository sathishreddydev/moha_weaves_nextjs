import { authOptions } from '@/auth/config/auth';
import NextAuth from 'next-auth';

// For next-auth@4 on Next.js 15+/16, use the standard pattern.
// NextAuth internally handles the params extraction from the request URL.
const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;
