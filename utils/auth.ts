import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || '';

export interface JWTPayload {
    userId: string;
    username: string;
}

export function getAuthUser(req: NextApiRequest): JWTPayload | null {
    const cookies = parse(req.headers.cookie || '');
    const token = cookies['access_token'];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch {
        return null;
    }
}
