import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/auth/config/auth';

// Define protected routes
const protectedRoutes = [
  '/account',
  '/orders',
  '/checkout',
  '/user',
  '/api/checkout',
  '/api/orders',
  '/api/user',
];

// Define public routes that should redirect authenticated users
const authRoutes = [
  '/login',
  '/register',
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtectedRoute = protectedRoutes.some((route) => 
    pathname.startsWith(route)
  );

  // Check if the path is an auth route
  const isAuthRoute = authRoutes.some((route) => 
    pathname.startsWith(route)
  );

  try {
    // Get the token from the request
    const token = await getToken({ req: request, secret: authOptions.secret });

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users from auth routes
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Add security headers
    const response = NextResponse.next();
    
    // Security Headers
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      
      // Payment gateway scripts
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://checkout.razorpay.com https://*.razorpay.com",
      
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      
      // API connections
      "connect-src 'self' https://api.stripe.com https://api.razorpay.com https://*.razorpay.com",
      
      // Payment popups/frames
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://checkout.razorpay.com https://api.razorpay.com",
      
    ].join('; ');
    
    response.headers.set('Content-Security-Policy', csp);

    // Performance Headers
    response.headers.set('X-Response-Time', Date.now().toString());
    
    // Add CORS headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
