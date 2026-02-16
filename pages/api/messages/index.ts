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

            // Trigger socket emission after saving to database
            if (to && from && (res.socket as SocketWithIO)?.server?.io) {
                const io = (res.socket as SocketWithIO).server.io!;
                
                // Get user IDs from usernames
                const { data: fromUser } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('username', from)
                    .single();
                const { data: toUser } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('username', to)
                    .single();

                if (fromUser && toUser) {
                    // Get the allusers object from socket.io instance
                    const allusers = (io as any)._nsps?.get('/')?.sockets || new Map();
                    
                    // Find recipient's socket and send message directly
                    Object.values(allusers).forEach((socket: any) => {
                        if (socket.username === to) {
                            socket.emit('receive-message', {
                                id: message.id,
                                from,
                                to,
                                message: content,
                                timestamp: message.timestamp,
                                status: 'sent',
                                isVoiceMessage: !!isVoice,
                                audioUrl,
                                audioDuration
                            });
                        }
                    });
                }
            }

            res.status(201).json({
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
    } else {
        res.status(405).end();
    }
}
