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

            // Return the saved message - frontend will handle socket emission
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
