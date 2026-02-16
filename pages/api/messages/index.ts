import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase-server';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';

interface SocketWithIO extends NetSocket {
    server: NetServer & {
        io?: ServerIO;
    };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { conversationId, senderId, content, isVoice, audioUrl, audioDuration, to, from } = req.body;

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
    } else {
        res.status(405).end();
    }
}
