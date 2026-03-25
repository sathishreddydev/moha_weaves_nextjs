import { NextRequest, NextResponse } from 'next/server';

// This route is deprecated - use /api/auth/signin instead
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please use /api/auth/signin instead.' },
    { status: 301 }
  );
}
