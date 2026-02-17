import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession, parseCookies } from './lib/auth-server';
import { verifyRefreshToken, createAccessToken } from './lib/jwt';
import { serialize } from 'cookie';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/verify-email', '/legal'];

  const staticRoutes = ['/api/socket', '/_next', '/favicon.ico', '/images', '/css', '/js'];

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isStaticRoute = staticRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute || isStaticRoute) {
    return NextResponse.next();
  }

  let session = await getSession(request);

  // If no session, try to refresh using refresh token
  if (!session) {
    console.log('🔄 Middleware: No valid session, attempting refresh...');
    
    const cookies = parseCookies(request);
    const refreshToken = cookies['refresh_token'];
    
    if (refreshToken) {
      try {
        const payload = await verifyRefreshToken(refreshToken);
        
        // Create new access token
        const newAccessToken = await createAccessToken(payload.userId, payload.username);

        // Create response with new access token cookie
        const response = NextResponse.next();
        const isProduction = process.env.NODE_ENV === 'production';
        
        response.headers.set('Set-Cookie', serialize('access_token', newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 60 * 60, // 1 hour
          path: '/',
        }));

        console.log('✅ Middleware: Session refreshed successfully');
        return response;
      } catch (error) {
        console.error('❌ Middleware: Refresh token invalid:', error);
        // Clear cookies and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Clear each cookie separately
        response.headers.append('Set-Cookie', serialize('access_token', '', {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 0,
          path: '/',
        }));
        
        response.headers.append('Set-Cookie', serialize('refresh_token', '', {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 0,
          path: '/',
        }));
        
        response.headers.append('Set-Cookie', serialize('user-id', '', {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 0,
          path: '/',
        }));
        
        response.headers.append('Set-Cookie', serialize('username', '', {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          maxAge: 0,
          path: '/',
        }));
        
        return response;
      }
    }
  }

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
