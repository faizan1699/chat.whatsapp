import type { NextApiRequest, NextApiResponse } from 'next';
import { jwtVerify, JWTPayload } from 'jose';
import { supabaseAdmin } from '../../../utils/supabase-server';

// Use the same secrets as the login API
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');

interface SessionPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'access';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        let accessToken: string | undefined;

        // Try Bearer token first (for frontend auth)
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
        } 
        // Fallback to cookies (for backward compatibility)
        else {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                return res.status(401).json({ message: 'No authentication provided' });
            }

            const cookies = cookieHeader.split('; ').reduce((acc: { [key: string]: string }, cookie) => {
                const [name, value] = cookie.split('=');
                acc[name] = value;
                return acc;
            }, {});

            accessToken = cookies['access_token'];
        }
        
        if (!accessToken) {
            return res.status(401).json({ message: 'No access token' });
        }

        const { payload } = await jwtVerify(accessToken, secret) as { payload: SessionPayload };
        
        if (payload.type !== 'access') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        // Get full user info from database
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('id, username, email, phone_number')
            .eq('id', payload.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Session valid',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phone_number
            }
        });

    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
