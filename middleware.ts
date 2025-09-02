import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

// Define public paths that don't require authentication
const publicPaths = ['/login', '/register', '/forgot-password', '/api/auth'];

// Define auth paths that should redirect to dashboard if already authenticated
const authPaths = ['/login', '/register'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));
  const isApiAuthRoute = pathname.startsWith('/api/auth');
  
  // Allow API auth routes to be accessed without authentication
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Handle auth paths (login, register)
  if (isAuthPath) {
    // If user is already authenticated, redirect to dashboard
    if (req.auth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Allow public paths to be accessed without authentication
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!req.auth) {
    let callbackUrl = pathname;
    if (req.nextUrl.search) {
      callbackUrl += req.nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.url)
    );
  }

  return NextResponse.next();
});

// Optionally configure which routes should be processed by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
