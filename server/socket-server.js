#!/usr/bin/env node
/**
 * Standalone Socket.IO server for production.
 * Run: node server/socket-server.js
 *
 * For horizontal scaling, set REDIS_URL and install:
 *   npm install @socket.io/redis-adapter ioredis
 */

const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.SOCKET_PORT || 3001;
const NEXT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: NEXT_URL.split(',').map(s => s.trim()),
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Optional Redis adapter for horizontal scaling (install: @socket.io/redis-adapter redis)
async function attachRedisAdapter() {
  if (!process.env.REDIS_URL) return;
  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter attached for horizontal scaling');
  } catch (e) {
    console.warn('Redis adapter skipped. Install @socket.io/redis-adapter and redis for scaling.');
  }
}

const userSockets = new Map(); // username -> socketId

io.on('connection', (socket) => {
  socket.on('join-user', (username) => {
    if (username) {
      userSockets.set(username, socket.id);
      socket.username = username;
      socket.join(`user:${username}`);
      const online = Object.fromEntries(
        [...userSockets.entries()].map(([u, id]) => [u, id])
      );
      io.emit('joined', online);
    }
  });

  socket.on('send-message', async (msg, ack) => {
    try {
      // Store message in database
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

      // Broadcast to all connected clients
      const targetId = userSockets.get(msg.to);
      if (targetId) {
        io.to(targetId).emit('receive-message', {
          ...message,
          id: message.id,
          status: 'delivered'
        });
      }

      if (typeof ack === 'function') ack({ status: 'ok', messageId: message.id });
    } catch (error) {
      console.error('Socket send-message error:', error);
      if (typeof ack === 'function') ack({ status: 'error', error: error.message });
    }
  });

  socket.on('mark-read', ({ messageId, to }) => {
    const targetId = userSockets.get(to);
    if (targetId) io.to(targetId).emit('message-status-update', { messageId, status: 'read' });
  });

  socket.on('message-edited', async (data) => {
    const { messageId, content, to, from } = data;
    try {
      // Update message in database
      const { error } = await supabase
        .from('messages')
        .update({
          content: content,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', from); // Only sender can edit their messages

      if (error) {
        console.error('Error updating edited message:', error);
        return;
      }

      // Broadcast to all connected clients
      const targetId = userSockets.get(to);
      if (targetId) {
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
    if (targetId) io.to(targetId).emit('delete-message', data);
  });

  socket.on('pin-message', (data) => {
    const targetId = userSockets.get(data.to);
    if (targetId) io.to(targetId).emit('pin-message', data);
  });

  socket.on('clear-all-messages', (data) => {
    io.emit('clear-all-messages', data);
  });

  socket.on('offer', (payload) => {
    const targetId = userSockets.get(payload.to);
    if (targetId) io.to(targetId).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    const targetId = userSockets.get(payload.to);
    if (targetId) io.to(targetId).emit('answer', payload);
  });

  socket.on('icecandidate', (payload) => {
    const { candidate, to } = typeof payload === 'object' && payload?.to
      ? payload
      : { candidate: payload, to: null };
    const targetId = to ? userSockets.get(to) : null;
    if (targetId) io.to(targetId).emit('icecandidate', candidate);
    else socket.broadcast.emit('icecandidate', candidate);
  });

  socket.on('call-ended', (payload) => {
    const targetId = userSockets.get(payload.to);
    if (targetId) io.to(targetId).emit('call-ended');
  });

  socket.on('call-rejected', (payload) => {
    const targetId = userSockets.get(payload.to);
    if (targetId) io.to(targetId).emit('call-rejected', payload);
  });

  socket.on('disconnect', () => {
    if (socket.username) userSockets.delete(socket.username);
  });
});

attachRedisAdapter().then(() => {
  server.listen(PORT, () => {
    console.log(`Socket.IO server on port ${PORT}`);
  });
});
