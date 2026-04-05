import { NextApiRequest } from 'next';
import { jwtVerify, JWTPayload } from 'jose';
import { secret } from '../lib/jwt-config';

export interface SessionPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'access';
}

export async function authenticate(req: NextApiRequest): Promise<SessionPayload | null> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const { payload } = await jwtVerify(token, secret) as { payload: SessionPayload };

        if (payload.type !== 'access') {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}
