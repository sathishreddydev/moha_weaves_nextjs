import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Detect HTTPS the same way auth.config.ts does —
    // using NEXTAUTH_URL so local dev (http) and prod (https) behave correctly.
    const isHttps = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;

    // __Secure- prefix is required by browsers for cookies set over HTTPS.
    // Must match exactly what NextAuth sets in auth.config.ts cookies.sessionToken.name
    const cookieName = isHttps
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    const response = NextResponse.json({ success: true });

    response.cookies.set(cookieName, '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
