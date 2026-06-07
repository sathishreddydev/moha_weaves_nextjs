import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ── Route classification ───────────────────────────────────────────────────

// Paths that require a valid session
const protectedRoutes = [
  '/account',
  '/orders',
  '/checkout',
  '/wishlist',
  '/my',           // was missing — /my/* routes need auth
  '/api/checkout',
  '/api/orders',
  '/api/user',
];

// Auth pages that should redirect already-logged-in users to home
const authRoutes = [
  '/login',
  '/register',
];

// ── Middleware ─────────────────────────────────────────────────────────────

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  try {
    // NEXTAUTH_SECRET is injected at runtime via env — getToken reads it here
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (isProtectedRoute && !token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.next();

    // ── Security headers ───────────────────────────────────────────────────

    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
    // X-XSS-Protection is deprecated in modern browsers but harmless
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // ── Content Security Policy ───────────────────────────────────────────
    // API URL comes from the environment so the CSP never contains a hardcoded
    // IP address. Falls back to the production domain if the variable is unset.
    const isDev = process.env.NODE_ENV !== 'production';
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'https://admin.urumibymounika.com';
    const apiHostname = apiUrl.replace(/^https?:\/\//, '');

    const connectSrc = [
      "'self'",
      'https://api.razorpay.com',
      'https://*.razorpay.com',
      `https://${apiHostname}`,
      `wss://${apiHostname}`,
      ...(isDev
        ? [
            'http://localhost:3000',
            'ws://localhost:3000',
            'http://localhost:5000',
            'ws://localhost:5000',
          ]
        : []),
    ].join(' ');

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https://res.cloudinary.com",
      `connect-src ${connectSrc}`,
      "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    // ── CORS for API routes ────────────────────────────────────────────────
    // BUG FIX: Access-Control-Allow-Origin: '*' is incompatible with
    // Access-Control-Allow-Credentials: 'true'. Browsers reject this
    // combination. Use the specific allowed origin instead.
    if (pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin') || '';
      const allowed = [
        apiUrl,
        'http://localhost:3000',
        'http://localhost:5000',
      ];
      if (allowed.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Vary', 'Origin');
      }
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  } catch {
    // On error (e.g. JWT decode failure) let the request through;
    // individual API routes / pages handle their own auth checks.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Run middleware on all routes EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)',
  ],
};
