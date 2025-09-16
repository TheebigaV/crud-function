import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard, /login)
  const path = request.nextUrl.pathname;

  // Define paths that require authentication
  const protectedPaths = ['/dashboard', '/profile', '/payments'];
  
  // Define paths that should redirect to dashboard if already authenticated
  const authPaths = ['/login', '/register'];
  
  // Define paths that should be excluded from middleware
  const excludedPaths = ['/auth/callback'];

  // Check if the path should be excluded from middleware
  const isExcludedPath = excludedPaths.some(excludedPath => 
    path.startsWith(excludedPath)
  );

  // Skip middleware for excluded paths (like OAuth callbacks)
  if (isExcludedPath) {
    return NextResponse.next();
  }

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path.startsWith(protectedPath)
  );

  // Check if the path is an auth path
  const isAuthPath = authPaths.some(authPath => 
    path.startsWith(authPath)
  );

  // For client-side routing and localStorage, we can't reliably check authentication
  // in middleware, so we'll handle this in the components instead
  
  // Only redirect if we have clear indicators
  // Don't redirect protected paths - let the component handle auth checks
  // Don't redirect auth paths - let the component handle auth state

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};