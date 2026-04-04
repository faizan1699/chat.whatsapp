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

    const { id } = req.query;
    const { type, userId } = req.body;
    if (!id || typeof id !== 'string') return res.status(400).end();

    if (userId !== session.userId) {
        return res.status(403).json({ error: 'Forbidden: Cannot perform actions as another user' });
    }

    if (req.method === 'DELETE') {
        try {
            const { data: existingMessage, error: fetchError } = await supabaseAdmin
                .from('messages')
                .select('sender_id')
                .eq('id', id)
                .single();
                
            if (fetchError || !existingMessage) {
                return res.status(404).json({ error: 'Message not found' });
            }
            
            // Verify that the authenticated user is the sender of the message
            if (existingMessage.sender_id !== session.userId) {
                return res.status(403).json({ error: 'Forbidden: Cannot delete messages from another user' });
            }

            if (type === 'everyone' && userId) {
                await supabaseAdmin
                    .from('messages')
                    .update({
                        deletedBy: userId,
                        content: '[This message was deleted]',
                        audioUrl: null,
                    })
                    .eq('id', id);
            } else if (type === 'me' && userId) {
                const { data: message } = await supabaseAdmin
                    .from('messages')
                    .select('hiddenBy')
                    .eq('id', id)
                    .single();

                let hiddenBy = [];
                try {
                    hiddenBy = message?.hiddenBy ? Array.isArray(message.hiddenBy) ? message.hiddenBy : JSON.parse(message.hiddenBy) : [];
                } catch (error) {
                    console.error('Error parsing hiddenBy:', error);
                    hiddenBy = [];
                }

                if (!hiddenBy.includes(userId)) {
                    hiddenBy.push(userId);
                }

                await supabaseAdmin
                    .from('messages')
                    .update({
                        hiddenBy: hiddenBy
                    })
                    .eq('id', id);
            } else {
                await supabaseAdmin
                    .from('messages')
                    .update({
                        is_deleted: true,
                        content: '',
                        audio_url: null,
                    })
                    .eq('id', id);
            }

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Delete message error:', error);
            res.status(500).json({ error: 'Failed to delete message' });
        }
    } else if (req.method === 'PATCH') {
        const { status } = req.body;
        try {
            await supabaseAdmin
                .from('messages')
                .update({ status })
                .eq('id', id);

            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to update status' });
        }
    } else {
        res.status(405).end();
    }
}
