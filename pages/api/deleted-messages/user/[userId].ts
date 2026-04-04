import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../utils/supabase-server';
import { jwtVerify, JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');

interface SessionPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'access';
}

async function authenticate(req: NextApiRequest): Promise<SessionPayload | null> {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Authenticate user
    const session = await authenticate(req);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Users can only see their own deleted messages (unless admin)
    if (userId !== session.userId) {
        return res.status(403).json({ error: 'Forbidden: Can only view your own deleted messages' });
    }

    if (req.method === 'GET') {
        try {
            // Get deleted messages either sent by this user or deleted by this user
            const { data: deletedMessages, error } = await supabaseAdmin
                .from('deleted_messages')
                .select('*')
                .or(`sender_id.eq.${userId},deleted_by.eq.${userId}`)
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Error fetching deleted messages:', error);
                return res.status(500).json({ error: 'Failed to fetch deleted messages' });
            }

            res.status(200).json({ deletedMessages });
        } catch (error) {
            console.error('Error in deleted messages API:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
