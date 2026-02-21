import { NextRequest, NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
interface ExtendedSocket extends Socket {
  username?: string;
}

let io: SocketIOServer | null = null;
const userSockets = new Map();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function initializeSocketIO(res: any) {
  if (!io) {
    console.log('Initializing Socket.IO server...');
    
    // @ts-ignore
    const httpServer: NetServer = res.socket?.server;
    
    if (httpServer) {
      io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        transports: ['websocket', 'polling'],
      });

      // Socket event handlers
      io.on('connection', (socket: ExtendedSocket) => {
        console.log('Socket connected:', socket.id);

        socket.on('join-user', (username) => {
          if (username) {
            userSockets.set(username, socket.id);
            socket.username = username;
            socket.join(`user:${username}`);
            const online = Object.fromEntries(
              Array.from(userSockets.entries()).map(([u, id]) => [u, id])
            );
            if (io) {
              io.emit('joined', online);
            }
          }
        });

        socket.on('send-message', async (msg, ack) => {
          try {
            console.log('Sending message:', msg);
            
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

            const targetId = userSockets.get(msg.to);
            if (targetId && io) {
              io.to(targetId).emit('receive-message', {
                ...message,
                id: message.id,
                status: 'delivered'
              });
              console.log('Message broadcasted to:', msg.to);
            }

            if (typeof ack === 'function') ack({ status: 'ok', messageId: message.id });
          } catch (error) {
            console.error('Socket send-message error:', error);
            if (typeof ack === 'function') ack({ status: 'error', error: (error as Error).message });
          }
        });

        socket.on('mark-read', ({ messageId, to }) => {
          const targetId = userSockets.get(to);
          if (targetId && io) io.to(targetId).emit('message-status-update', { messageId, status: 'read' });
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
            if (targetId && io) {
              io.to(targetId).emit('message-edited', {
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
          if (targetId && io) io.to(targetId).emit('delete-message', data);
        });

        socket.on('pin-message', (data) => {
          const targetId = userSockets.get(data.to);
          if (targetId && io) io.to(targetId).emit('pin-message', data);
        });

        socket.on('disconnect', () => {
          if (socket.username) {
            userSockets.delete(socket.username);
            console.log('User disconnected:', socket.username);
          }
        });
      });

      res.socket.server.io = io;
    }
  }
  return io;
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.IO endpoint - this should be accessed via WebSocket connection',
    status: 'socket-endpoint'
  });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Socket.IO endpoint - this should be accessed via WebSocket connection',
    status: 'socket-endpoint'
  });
}
