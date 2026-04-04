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
                .select('sender_id, content')
                .eq('id', id)
                .single();

            if (fetchError || !existingMessage) {
                return res.status(404).json({ error: 'Message not found' });
            }

            if (type === 'everyone' && userId) {
                if (existingMessage.sender_id !== session.userId) {
                    return res.status(403).json({ error: 'Forbidden: Only sender can delete for everyone' });
                }

                const { data: fullMessage, error: fetchError } = await supabaseAdmin
                    .from('messages')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (fetchError || !fullMessage) {
                    return res.status(404).json({ error: 'Message not found' });
                }

                await supabaseAdmin
                    .from('deleted_messages')
                    .insert({
                        original_message_id: fullMessage.id,
                        conversation_id: fullMessage.conversation_id,
                        sender_id: fullMessage.sender_id,
                        deleted_by: userId,
                        original_content: fullMessage.content,
                        original_audio_url: fullMessage.audio_url,
                        original_audio_duration: fullMessage.audio_duration,
                        reply_to: fullMessage.reply_to,
                        is_voice_message: fullMessage.is_voice_message,
                        is_edited: fullMessage.is_edited,
                        is_pinned: fullMessage.is_pinned,
                        deletion_reason: 'deleted_by_sender'
                    });

                await supabaseAdmin
                    .from('messages')
                    .update({
                        content: '[This message was deleted]',
                        audio_url: null,
                        is_deleted: true,
                        is_pinned: false
                    })
                    .eq('id', id);
                
            } else if (type === 'me' && userId) {
                const { data: message } = await supabaseAdmin
                    .from('messages')
                    .select('is_deleted_from_me')
                    .eq('id', id)
                    .single();

                let deletedFromMe = message?.is_deleted_from_me || [];

                if (!Array.isArray(deletedFromMe)) {
                    deletedFromMe = [];
                }

                if (!deletedFromMe.includes(userId)) {
                    deletedFromMe.push(userId);
                }

                await supabaseAdmin
                    .from('messages')
                    .update({
                        is_deleted_from_me: deletedFromMe,
                        content: '[This message was deleted]',
                        is_deleted: true,
                        audio_url: null
                    })
                    .eq('id', id);
                
                console.log('✅ "me" delete completed - content set to: [This message was deleted]');
            } else {
                await supabaseAdmin
                    .from('messages')
                    .update({
                        is_deleted: true,
                        content: '[This message was deleted]',
                        audio_url: null,
                    })
                    .eq('id', id);
                
                console.log('✅ "everyone" delete completed - content set to: [This message was deleted]');
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
