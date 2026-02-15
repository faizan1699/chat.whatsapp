import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production';

export interface JWTPayload {
    userId: string;
    username: string;
}

export function getAuthUser(req: NextApiRequest): JWTPayload | null {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch {
        return null;
    }
}
