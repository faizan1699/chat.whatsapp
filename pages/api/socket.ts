import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO, Socket } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import { supabaseAdmin } from '../../utils/supabase-server';

interface SocketWithIO extends NetSocket {
  server: NetServer & {
    io?: ServerIO;
  };
}

interface SocketWithUsername extends Socket {
  username?: string;
}

async function getOrCreateConversation(fromUserId: string, toUserId: string) {
  const { data: participants } = await supabaseAdmin
    .from('conversation_participants')
    .select('conversation_id')
    .in('user_id', [fromUserId, toUserId]);

  if (participants?.length) {
    const convCounts: Record<string, number> = {};
    participants.forEach((p) => {
      convCounts[p.conversation_id] = (convCounts[p.conversation_id] || 0) + 1;
    });
    const sharedConv = Object.entries(convCounts).find(([, c]) => c === 2);
    if (sharedConv) {
      return sharedConv[0];
    }
  }

  const { data: newConv } = await supabaseAdmin
    .from('conversations')
    .insert({ is_group: false })
    .select('id')
    .single();

  if (!newConv) return null;
  await supabaseAdmin.from('conversation_participants').insert([
    { user_id: fromUserId, conversation_id: newConv.id },
    { user_id: toUserId, conversation_id: newConv.id },
  ]);
  return newConv.id;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  if ((res.socket as SocketWithIO).server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const httpServer: NetServer = (res.socket as SocketWithIO).server;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    (res.socket as SocketWithIO).server.io = io;

    const allusers: { [key: string]: string } = {};

    io.on('connection', (socket: SocketWithUsername) => {
      console.log('User connected with socket ID:', socket.id);

      socket.on('join-user', (username) => {
        if (!username) return;
        const cleanUsername = username.trim();
        allusers[cleanUsername] = socket.id;
        socket.username = cleanUsername;
        io.emit('joined', allusers);
      });

      socket.on('disconnect', () => {
        if (socket.username && allusers[socket.username] === socket.id) {
          delete allusers[socket.username];
          io.emit('joined', allusers);
        }
      });

      socket.on('send-message-api', async (data, callback) => {
        const { to, from, message, id, timestamp, status, isVoiceMessage, audioUrl, audioDuration } = data;

        if (allusers[to]) {
          try {
            // Save to database first
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

            if (!fromUser || !toUser) {
              if (callback) callback({ status: 'error', message: 'User not found' });
              return;
            }

            const convId = await getOrCreateConversation(fromUser.id, toUser.id);
            if (!convId) {
              if (callback) callback({ status: 'error', message: 'Failed to create conversation' });
              return;
            }

            await supabaseAdmin.from('messages').insert({
              id,
              conversation_id: convId,
              sender_id: fromUser.id,
              content: message || '',
              timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
              status: status || 'sent',
              is_voice_message: !!isVoiceMessage,
              audio_url: audioUrl || null,
              audio_duration: audioDuration ?? null,
              is_edited: !!data.isEdited,
              is_deleted: !!data.isDeleted,
              is_pinned: !!data.isPinned,
              reply_to: data.replyTo || null,
              group_id: data.groupId || null,
              chunk_index: data.chunkIndex ?? null,
              total_chunks: data.totalChunks ?? null,
            });

            // Send only to recipient
            io.to(allusers[to]).emit('receive-message', data);
            if (callback) callback({ status: 'ok', id: data.id });
          } catch (error) {
            console.error('Error saving message:', error);
            if (callback) callback({ status: 'error', message: 'Failed to save message' });
          }
        } else {
          if (callback) callback({ status: 'error', message: 'User offline or not found' });
        }
      });

      socket.on('delete-message', async ({ id, to }) => {
        try {
          const { data: msg } = await supabaseAdmin
            .from('messages')
            .select('timestamp')
            .eq('id', id)
            .single();
          if (!msg) return;

          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (new Date(msg.timestamp) < oneHourAgo) return;

          await supabaseAdmin
            .from('messages')
            .update({ is_deleted: true, content: '', audio_url: null })
            .eq('id', id);

          if (allusers[to]) {
            io.to(allusers[to]).emit('delete-message', { id });
          }
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      });

      socket.on('offer', (payload) => {
        if (allusers[payload.to]) io.to(allusers[payload.to]).emit('offer', payload);
      });

      socket.on('answer', (payload) => {
        if (allusers[payload.to]) io.to(allusers[payload.to]).emit('answer', payload);
      });

      socket.on('icecandidate', (candidate) => {
        socket.broadcast.emit('icecandidate', candidate);
      });

      socket.on('call-ended', (payload) => {
        if (allusers[payload.to]) io.to(allusers[payload.to]).emit('call-ended');
      });

      socket.on('call-rejected', (payload) => {
        if (allusers[payload.to]) io.to(allusers[payload.to]).emit('call-rejected', payload);
      });

      socket.on('mark-delivered', async ({ messageId, to }) => {
        try {
          await supabaseAdmin
            .from('messages')
            .update({ status: 'delivered' })
            .eq('id', messageId);
          if (allusers[to]) io.to(allusers[to]).emit('message-status-update', { messageId, status: 'delivered' });
        } catch (e) {
          /**/
        }
      });

      socket.on('mark-read', async ({ messageId, to }) => {
        try {
          await supabaseAdmin
            .from('messages')
            .update({ status: 'read' })
            .eq('id', messageId);
          if (allusers[to]) io.to(allusers[to]).emit('message-status-update', { messageId, status: 'read' });
        } catch (e) {
          /**/
        }
      });

      socket.on('edit-message', async ({ id, to, message }) => {
        try {
          await supabaseAdmin
            .from('messages')
            .update({ content: message, is_edited: true })
            .eq('id', id);
          if (allusers[to]) io.to(allusers[to]).emit('message-edited', { id, message });
        } catch (e) {
          /**/
        }
      });

      socket.on('pin-message', async ({ id, isPinned, to }) => {
        try {
          await supabaseAdmin.from('messages').update({ is_pinned: isPinned }).eq('id', id);
          if (allusers[to]) io.to(allusers[to]).emit('pin-message', { id, isPinned });
        } catch (e) {
          /**/
        }
      });
    });
  }
  res.end();
};

export default SocketHandler;
