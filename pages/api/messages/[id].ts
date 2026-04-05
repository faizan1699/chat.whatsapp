import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { authenticate } from '../../../utils/apiAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await authenticate(req);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    const { type, userId } = req.body;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Message ID is required' });
    }

    if (userId !== session.userId) {
        return res.status(403).json({ error: 'Forbidden: Cannot perform actions as another user' });
    }

    if (req.method === 'DELETE') {
        try {
            const { data: message, error: fetchError } = await supabaseAdmin
                .from('messages')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError || !message) {
                return res.status(404).json({ error: 'Message not found' });
            }

            if (type === 'everyone') {
                if (message.sender_id !== session.userId) {
                    return res.status(403).json({ error: 'Only sender can delete message for everyone' });
                }

                await supabaseAdmin.from('deleted_messages').insert({
                    original_message_id: message.id,
                    conversation_id: message.conversation_id,
                    sender_id: message.sender_id,
                    deleted_by: userId,
                    original_content: message.content,
                    original_audio_url: message.audio_url,
                    original_audio_duration: message.audio_duration,
                    reply_to: message.reply_to,
                    is_voice_message: message.is_voice_message,
                    is_edited: message.is_edited,
                    is_pinned: message.is_pinned,
                    deletion_reason: 'deleted_by_sender'
                });

                await supabaseAdmin
                    .from('messages')
                    .update({
                        content: '[This message was deleted]',
                        audio_url: null,
                        audio_duration: null,
                        is_deleted: true,
                        is_pinned: false,
                        deleted_at: new Date().toISOString()
                    })
                    .eq('id', id);

            } else if (type === 'me') {
                let deletedFromMe = Array.isArray(message.is_deleted_from_me) 
                    ? message.is_deleted_from_me 
                    : [];

                if (!deletedFromMe.includes(userId)) {
                    deletedFromMe.push(userId);
                }

                await supabaseAdmin
                    .from('messages')
                    .update({
                        is_deleted_from_me: deletedFromMe,
                        content: '[This message was deleted]',
                        is_deleted: true,
                        audio_url: null,
                        deleted_at: new Date().toISOString()
                    })
                    .eq('id', id);

            } else {
                return res.status(400).json({ error: 'Invalid delete type' });
            }

            return res.status(200).json({ success: true });

        } catch (error) {
            console.error('Delete error:', error);
            return res.status(500).json({ error: 'Failed to delete message' });
        }
    } 
    else if (req.method === 'PATCH') {
        const { status } = req.body;
        try {
            await supabaseAdmin
                .from('messages')
                .update({ status })
                .eq('id', id);

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to update status' });
        }
    } 
    else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}