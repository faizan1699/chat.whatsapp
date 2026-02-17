import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth-server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/verify-email', '/legal'];

  const staticRoutes = ['/api/socket', '/_next', '/favicon.ico', '/images', '/css', '/js'];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isStaticRoute = staticRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute || isStaticRoute) {
    return NextResponse.next();
  }

  const session = await getSession(request);

  if (!session) {
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
