import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../utils/supabase-server';
import { authenticateRequest, sendUnauthorized } from '../../../../utils/auth-middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).end();

    // Authenticate user
    const session = await authenticateRequest(req);
    if (!session) {
        return sendUnauthorized(res);
    }

    try {
        const { data: messages, error } = await supabaseAdmin
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('timestamp', { ascending: true });

        if (error) throw error;

        const senderIds = Array.from(new Set((messages || []).map((m) => m.sender_id)));
        const { data: senders } = senderIds.length
            ? await supabaseAdmin.from('users').select('id, username, avatar').in('id', senderIds)
            : { data: [] };
        const senderMap = Object.fromEntries((senders || []).map((s) => [s.id, s]));

        const mapped = (messages || []).map((m) => ({
            ...m,
            conversationId: m.conversation_id,
            senderId: m.sender_id,
            sender: senderMap[m.sender_id] || { username: null, avatar: null },
            isVoiceMessage: m.is_voice_message,
            audioUrl: m.audio_url,
            audioDuration: m.audio_duration,
            isEdited: m.is_edited,
            isDeleted: m.is_deleted,
            isPinned: m.is_pinned,
            isHidden: m.is_hidden,
            replyTo: m.reply_to,
            groupId: m.group_id,
            chunkIndex: m.chunk_index,
            totalChunks: m.total_chunks,
        }));

        res.status(200).json(mapped);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
}
