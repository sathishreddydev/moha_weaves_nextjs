import { authOptions } from '@/auth/config/auth';
import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';

const nextAuthHandler = NextAuth(authOptions);

export async function GET(
  req: NextRequest, 
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  return nextAuthHandler(req, ctx);
}

export async function POST(
  req: NextRequest, 
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  return nextAuthHandler(req, ctx);
}
