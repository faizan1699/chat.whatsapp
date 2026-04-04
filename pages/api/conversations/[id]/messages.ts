import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../utils/supabase-server';
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
    if (req.method !== 'GET') return res.status(405).end();

    const session = await authenticate(req);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).end();

    try {
        const { data: messages, error } = await supabaseAdmin
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('timestamp', { ascending: true });

        if (error) throw error;

        const filteredMessages = (messages || []).filter(message => {
            if (!message.is_deleted_from_me || message.is_deleted_from_me.length === 0) {
                return true;
            }
            
            let deletedFromMe = message.is_deleted_from_me;
            if (typeof deletedFromMe === 'object' && deletedFromMe !== null && !Array.isArray(deletedFromMe)) {
                deletedFromMe = Object.values(deletedFromMe);
            } else if (!Array.isArray(deletedFromMe)) {
                deletedFromMe = [deletedFromMe];
            }
            
            return !deletedFromMe.includes(session.userId);
        });

        const senderIds = Array.from(new Set(filteredMessages.map((m) => m.sender_id)));
        const { data: senders } = senderIds.length
            ? await supabaseAdmin.from('users').select('id, username, avatar').in('id', senderIds)
            : { data: [] };
        const senderMap = Object.fromEntries((senders || []).map((s) => [s.id, s]));

        const mapped = filteredMessages.map((m) => ({
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
