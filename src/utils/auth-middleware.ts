import { NextApiRequest } from 'next';
import { jwtVerify, JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');

interface SessionPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'access';
}

/**
 * Authentication middleware for API routes
 * Verifies JWT token and returns session payload
 */
export async function authenticateRequest(req: NextApiRequest): Promise<SessionPayload | null> {
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

/**
 * Higher-order function to protect API routes with authentication
 */
export function withAuth(handler: (req: NextApiRequest, res: any, session: SessionPayload) => Promise<any>) {
    return async (req: NextApiRequest, res: any) => {
        const session = await authenticateRequest(req);
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        return handler(req, res, session);
    };
}

/**
 * Helper function to send unauthorized response
 */
export function sendUnauthorized(res: any, message: string = 'Unauthorized') {
    return res.status(401).json({ error: message });
}

/**
 * Helper function to send forbidden response
 */
export function sendForbidden(res: any, message: string = 'Forbidden') {
    return res.status(403).json({ error: message });
}
