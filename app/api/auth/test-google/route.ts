import { NextRequest, NextResponse } from 'next/server';

// This endpoint tests the Google OAuth token exchange manually
// Visit https://urumibymounika.com/api/auth/test-google to see what's happening
export async function GET(req: NextRequest) {
  const results: Record<string, any> = {};
  
  // 1. Check env vars
  results.NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  results.NEXTAUTH_SECRET_LENGTH = process.env.NEXTAUTH_SECRET?.length;
  results.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NOT SET';
  results.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ? 'SET (' + process.env.GOOGLE_CLIENT_SECRET.length + ' chars)' : 'NOT SET';
  
  // 2. Test if we can reach Google's token endpoint
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code: 'fake_code_for_testing',
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
      }),
    });
    const data = await response.json();
    results.googleTokenEndpoint = {
      status: response.status,
      reachable: true,
      // Expected: "invalid_grant" error since we used a fake code
      error: data.error,
      error_description: data.error_description,
    };
  } catch (error: any) {
    results.googleTokenEndpoint = {
      reachable: false,
      error: error.message,
    };
  }

  // 3. Check NextAuth internal state
  try {
    const csrfRes = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    results.csrfEndpoint = {
      status: csrfRes.status,
      hasToken: !!csrfData.csrfToken,
    };
  } catch (error: any) {
    results.csrfEndpoint = { error: error.message };
  }

  // 4. Check providers endpoint
  try {
    const provRes = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/providers`);
    const provData = await provRes.json();
    results.providersEndpoint = {
      status: provRes.status,
      providers: Object.keys(provData),
    };
  } catch (error: any) {
    results.providersEndpoint = { error: error.message };
  }

  // 5. Check cookie settings
  results.cookieConfig = {
    expectedCookieName: process.env.NEXTAUTH_URL?.startsWith('https://')
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
    isHttps: process.env.NEXTAUTH_URL?.startsWith('https://'),
  };

  // 6. Request headers (to check if proxy is forwarding correctly)
  results.requestHeaders = {
    host: req.headers.get('host'),
    xForwardedFor: req.headers.get('x-forwarded-for'),
    xForwardedProto: req.headers.get('x-forwarded-proto'),
    xForwardedHost: req.headers.get('x-forwarded-host'),
  };

  return NextResponse.json(results, { status: 200 });
}
