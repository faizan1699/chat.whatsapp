import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
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

    const { conversationId } = req.query;
    
    if (!conversationId || typeof conversationId !== 'string') {
        return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    if (req.method === 'GET') {
        try {
            // Check if user is part of this conversation
            const { data: participant, error: participantError } = await supabaseAdmin
                .from('conversation_participants')
                .select('user_id')
                .eq('conversation_id', conversationId)
                .eq('user_id', session.userId)
                .single();

            if (participantError || !participant) {
                return res.status(403).json({ error: 'Forbidden: Not a participant in this conversation' });
            }

            // Get deleted messages for this conversation
            const { data: deletedMessages, error } = await supabaseAdmin
                .from('deleted_messages')
                .select('*')
                .eq('conversation_id', conversationId)
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
