import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { NextApiResponse } from 'next';

interface ExtendedSocket extends Socket {
  username?: string;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

let io: SocketIOServer | null = null;
const userSockets = new Map<string, string>();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function getSocketIO(res: NextApiResponse & { socket: any }): SocketIOServer {
  if (!io) {
    
    const httpServer: NetServer = res.socket.server;
    
    if (!httpServer) {
      throw new Error('HTTP server not available');
    }

    if (res.socket.server.io) {
      console.log('Socket.IO already initialized');
      io = res.socket.server.io as SocketIOServer;
      return io;
    }

    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : ["http://localhost:3000"],
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket: ExtendedSocket) => {
      console.log('Socket connected:', socket.id);

      socket.on('join-user', (username) => {
        if (username) {
          userSockets.set(username, socket.id);
          socket.username = username;
          socket.join(`user:${username}`);
          const online = Object.fromEntries(
            [...userSockets.entries()].map(([u, id]) => [u, id])
          );
          io?.emit('joined', online);
          console.log('User joined:', username, 'Total users:', userSockets.size);
        }
      });

      socket.on('send-message', async (msg, ack) => {
        try {          
          const { data: message, error } = await supabase
            .from('messages')
            .insert({
              conversation_id: msg.conversationId,
              sender_id: msg.from,
              content: msg.message,
              timestamp: new Date().toISOString(),
              status: 'sent',
              is_edited: msg.isEdited || false,
              is_voice_message: msg.isVoiceMessage || false,
              audio_url: msg.audioUrl || null,
              audio_duration: msg.audioDuration || null,
              reply_to: msg.replyTo ? JSON.stringify(msg.replyTo) : null,
              is_pinned: msg.isPinned || false
            })
            .select()
            .single();

          if (error) {
            console.error('Error saving message:', error);
            if (typeof ack === 'function') ack({ status: 'error', error: error.message });
            return;
          }

          // Broadcast to target user
          const targetId = userSockets.get(msg.to);
          if (targetId) {
            io?.to(targetId).emit('receive-message', {
              ...message,
              id: message.id,
              status: 'delivered'
            });
            console.log('Message broadcasted to:', msg.to);
          } else {
            console.log('Target user not online:', msg.to);
          }

          if (typeof ack === 'function') ack({ status: 'ok', messageId: message.id });
        } catch (error) {
          console.error('Socket send-message error:', error);
          if (typeof ack === 'function') ack({ status: 'error', error: (error as Error).message });
        }
      });

      socket.on('mark-read', ({ messageId, to }) => {
        const targetId = userSockets.get(to);
        if (targetId) {
          io?.to(targetId).emit('message-status-update', { messageId, status: 'read' });
          console.log('Mark read sent to:', to);
        }
      });

      socket.on('message-edited', async (data) => {
        const { messageId, content, to, from } = data;
        try {
          const { error } = await supabase
            .from('messages')
            .update({
              content: content,
              is_edited: true,
              edited_at: new Date().toISOString()
            })
            .eq('id', messageId)
            .eq('sender_id', from);

          if (error) {
            console.error('Error updating edited message:', error);
            return;
          }

          const targetId = userSockets.get(to);
          if (targetId) {
            io?.to(targetId).emit('message-edited', {
              messageId,
              content,
              from,
              to,
              editedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Socket message-edited error:', error);
        }
      });

      socket.on('delete-message', (data) => {
        const targetId = userSockets.get(data.to);
        if (targetId) io?.to(targetId).emit('delete-message', data);
      });

      socket.on('pin-message', (data) => {
        const targetId = userSockets.get(data.to);
        if (targetId) io?.to(targetId).emit('pin-message', data);
      });

      socket.on('clear-all-messages', (data) => {
        io?.emit('clear-all-messages', data);
      });

      socket.on('offer', (payload) => {
        const targetId = userSockets.get(payload.to);
        if (targetId) io?.to(targetId).emit('offer', payload);
      });

      socket.on('answer', (payload) => {
        const targetId = userSockets.get(payload.to);
        if (targetId) io?.to(targetId).emit('answer', payload);
      });

      socket.on('icecandidate', (payload) => {
        const { candidate, to } = typeof payload === 'object' && payload?.to
          ? payload
          : { candidate: payload, to: null };
        const targetId = to ? userSockets.get(to) : null;
        if (targetId) io?.to(targetId).emit('icecandidate', candidate);
        else socket.broadcast.emit('icecandidate', candidate);
      });

      socket.on('call-ended', (payload) => {
        const targetId = userSockets.get(payload.to);
        if (targetId) io?.to(targetId).emit('call-ended');
      });

      socket.on('call-rejected', (payload) => {
        const targetId = userSockets.get(payload.to);
        if (targetId) io?.to(targetId).emit('call-rejected', payload);
      });

      socket.on('disconnect', () => {
        if (socket.username) {
          userSockets.delete(socket.username);
        }
      });
    });

    res.socket.server.io = io;
  }
  
  return io;
}
