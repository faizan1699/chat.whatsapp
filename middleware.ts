import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth-server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/verify-email', '/legal'];
  
  // Static assets and API routes that don't need auth
  const staticRoutes = ['/api/socket', '/_next', '/favicon.ico', '/images', '/css', '/js'];
  
  // Check if path starts with any public or static route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isStaticRoute = staticRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute || isStaticRoute) {
    return NextResponse.next();
  }

  // Check authentication using request object
  const session = await getSession(request);
  
  if (!session) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|favicon.ico).*)',
  ],
};
