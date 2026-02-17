import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');
const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_dont_use_in_production');

export interface SessionPayload extends JWTPayload {
  userId: string;
  username: string;
  type: 'access';
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  username: string;
  type: 'refresh';
}

// JWT creation functions (can be used anywhere)
export async function createAccessToken(userId: string, username: string): Promise<string> {
  const accessPayload: SessionPayload = { 
    userId, 
    username,
    type: 'access'
  };
  
  return await new SignJWT(accessPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

export async function createRefreshToken(userId: string, username: string): Promise<string> {
  const refreshPayload: RefreshTokenPayload = { 
    userId, 
    username,
    type: 'refresh'
  };
  
  return await new SignJWT(refreshPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret) as { payload: SessionPayload };
  
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  
  return payload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret) as { payload: RefreshTokenPayload };
  
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return payload;
}
