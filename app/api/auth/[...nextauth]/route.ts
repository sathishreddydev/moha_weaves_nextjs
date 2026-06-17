import { authOptions } from '@/auth/config/auth';
import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const handler = NextAuth(authOptions);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    const params = await ctx.params;
    return handler(req, { params }) as unknown as NextResponse;
  } catch (error: any) {
    console.error('[NEXTAUTH GET ERROR]', error?.message, error?.stack);
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    const params = await ctx.params;
    return handler(req, { params }) as unknown as NextResponse;
  } catch (error: any) {
    console.error('[NEXTAUTH POST ERROR]', error?.message, error?.stack);
    return NextResponse.json({ error: 'Auth error' }, { status: 500 });
  }
}
