import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import { jwtVerify, JWTPayload } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_dont_use_in_production');

interface SessionPayload extends JWTPayload {
    userId: string;
    username: string;
    type: 'access';
}

// Authentication middleware
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

interface SocketWithIO extends NetSocket {
    server: NetServer & {
        io?: ServerIO;
    };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Authenticate user
    const session = await authenticate(req);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        const { conversationId, limit = 50, offset = 0 } = req.query;
        
        try {
            let query = supabaseAdmin
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('timestamp', { ascending: false })
                .limit(Number(limit))
                .range(Number(offset), Number(offset) + Number(limit) - 1);

            const { data: messages, error } = await query;

            if (error) throw error;

            res.status(200).json({
                messages: messages.reverse(), // Return in chronological order
                hasMore: messages.length === Number(limit)
            });
        } catch (error) {
            console.error('Fetch messages error:', error);
            res.status(500).json({ error: 'Failed to fetch messages' });
        }
    } else if (req.method === 'POST') {
        const { conversationId, senderId, content, isVoice, audioUrl, audioDuration, to, from } = req.body;

        // Verify that the authenticated user is the sender
        if (senderId !== session.userId) {
            return res.status(403).json({ error: 'Forbidden: Cannot send messages as another user' });
        }

        try {
            const { data: message, error } = await supabaseAdmin
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: senderId,
                    content: content || '',
                    is_voice_message: !!isVoice,
                    audio_url: audioUrl || null,
                    audio_duration: audioDuration ?? null,
                    status: 'sent',
                })
                .select('*')
                .single();

            if (error) throw error;

            res.status(200).json({
                id: message.id,
                conversationId: message.conversation_id,
                senderId: message.sender_id,
                content: message.content,
                timestamp: message.timestamp,
                status: message.status,
                isVoiceMessage: message.is_voice_message,
                audioUrl: message.audio_url,
                audioDuration: message.audio_duration,
            });
        } catch (error) {
            console.error('Message API error:', error);
            res.status(500).json({ error: 'Failed to send message' });
        }
    } else if (req.method === 'PUT') {
        const { messageId, content, from, to } = req.body;

        // Verify that the authenticated user is the one editing the message
        if (from !== session.userId) {
            return res.status(403).json({ error: 'Forbidden: Cannot edit messages as another user' });
        }

        try {
            const { data: message, error } = await supabaseAdmin
                .from('messages')
                .update({
                    content: content,
                    is_edited: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .select('*')
                .single();

            if (error) throw error;

            // Emit socket event for real-time update
            if (to && from && (res.socket as SocketWithIO)?.server?.io) {
                const io = (res.socket as SocketWithIO).server.io!;

                // Find recipient's socket and send update
                const allusers = (io as any)._nsps?.get('/')?.sockets || new Map();

                Object.values(allusers).forEach((socket: any) => {
                    if (socket.username === to) {
                        socket.emit('message-edited', {
                            id: message.id,
                            message: content,
                            from: from,
                            to: to
                        });
                    }
                });
            }

            res.status(200).json({
                id: message.id,
                content: message.content,
                isEdited: message.is_edited,
                updatedAt: message.updated_at
            });
        } catch (error) {
            console.error('Message update error:', error);
            res.status(500).json({ error: 'Failed to update message' });
        }
    } else if (req.method === 'DELETE') {
        const { messageId, from } = req.body;

        // Verify that the authenticated user is the one deleting the message
        if (from !== session.userId) {
            return res.status(403).json({ error: 'Forbidden: Cannot delete messages as another user' });
        }

        try {
            const { error } = await supabaseAdmin
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;

            res.status(200).json({ message: 'Message deleted successfully' });
        } catch (error) {
            console.error('Message delete error:', error);
            res.status(500).json({ error: 'Failed to delete message' });
        }
    } else {
        res.status(405).end();
    }
}
