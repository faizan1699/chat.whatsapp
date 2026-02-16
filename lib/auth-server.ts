import { serialize } from 'cookie';
import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } from './jwt';

export interface SessionPayload {
  userId: string;
  username: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  username: string;
  type: 'refresh';
}

// Server-side session creation for API routes
export async function createSession(userId: string, username: string, res: any) {
  // Create tokens
  const accessToken = await createAccessToken(userId, username);
  const refreshToken = await createRefreshToken(userId, username);

  // Set cookies using response object
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.setHeader('Set-Cookie', [
    serialize('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    }),
    serialize('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    }),
    serialize('user-id', userId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    }),
    serialize('username', username, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    }),
  ]);
}

// Server-side session clearing for API routes
export function clearSession(res: any) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.setHeader('Set-Cookie', [
    serialize('access_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    }),
    serialize('refresh_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    }),
    serialize('user-id', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    }),
    serialize('username', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    }),
  ]);
}

// Parse cookies from request headers (for API routes)
export function parseCookies(req: { headers?: { cookie?: string } } | { headers: Headers }): { [key: string]: string } {
  if (!req || !req.headers) {
    return {};
  }
  
  let cookieHeader: string | undefined;
  
  // Handle NextRequest (Headers object)
  if ('get' in req.headers) {
    cookieHeader = req.headers.get('cookie') || undefined;
  } 
  // Handle plain request object
  else {
    cookieHeader = req.headers.cookie;
  }
  
  if (!cookieHeader) return {};

  return cookieHeader.split('; ').reduce((acc: { [key: string]: string }, cookie) => {
    const [name, value] = cookie.split('=');
    acc[name] = value;
    return acc;
  }, {});
}

// Get session from request (for API routes)
export async function getSession(req: { headers?: { cookie?: string } } | { headers: Headers }): Promise<SessionPayload | null> {
  const cookies = parseCookies(req);
  const accessToken = cookies['access_token'];
  
  if (!accessToken) {
    return null;
  }

  try {
    return await verifyAccessToken(accessToken);
  } catch (error) {
    console.error('Invalid access token:', error);
    return null;
  }
}

// Refresh session (for API routes)
export async function refreshSession(req: { headers?: { cookie?: string } } | { headers: Headers }, res: any): Promise<SessionPayload | null> {
  const cookies = parseCookies(req);
  const refreshToken = cookies['refresh_token'];
  
  if (!refreshToken) {
    return null;
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    
    // Create new access token
    const newAccessToken = await createAccessToken(payload.userId, payload.username);

    // Update access token cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', serialize('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    }));

    console.log('✅ Session refreshed successfully');
    return {
      userId: payload.userId,
      username: payload.username,
      type: 'access'
    } as SessionPayload;
    
  } catch (error) {
    console.error('Invalid refresh token:', error);
    // Clear all cookies if refresh token is invalid
    clearSession(res);
    return null;
  }
}
