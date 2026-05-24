import { NextRequest, NextResponse } from 'next/server';

/**
 * Guest cart API route.
 * 
 * Guest cart is managed entirely client-side via localStorage (lib/guest-storage.ts).
 * This route exists only to provide a consistent API response when the client
 * accidentally hits it. All actual guest cart operations happen in the browser.
 */

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: { cart: [], count: 0 },
    isGuest: true,
    message: 'Guest cart is managed client-side via localStorage'
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    isGuest: true,
    error: 'Guest cart operations should be handled client-side'
  }, { status: 400 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: false,
    isGuest: true,
    error: 'Guest cart operations should be handled client-side'
  }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    success: false,
    isGuest: true,
    error: 'Guest cart operations should be handled client-side'
  }, { status: 400 });
}
