import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Remove trailing slashes (except root) to prevent duplicate content
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(0, -1)
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  // Only run on page routes, skip API, static files, and Next.js internals
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.png|logo\\.png|manifest\\.json|robots\\.txt|sitemap\\.xml).*)',
  ],
}
