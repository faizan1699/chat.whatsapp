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
const { PrismaClient } = require('@prisma/client');

const PORT = process.env.SOCKET_PORT || 3001;
const NEXT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const prisma = new PrismaClient();

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
      // Store message in database using Prisma
      const message = await prisma.message.create({
        data: {
          conversationId: msg.conversationId,
          senderId: msg.from,
          content: msg.message,
          status: 'sent',
          isEdited: msg.isEdited || false,
          isVoiceMessage: msg.isVoiceMessage || false,
          audioUrl: msg.audioUrl || null,
          audioDuration: msg.audioDuration || null,
          replyTo: msg.replyTo ? JSON.stringify(msg.replyTo) : null,
          isPinned: msg.isPinned || false
        },
        include: {
          sender: {
            select: {
              username: true
            }
          }
        }
      });

      // Broadcast to target user
      const targetId = userSockets.get(msg.to);
      if (targetId) {
        io.to(targetId).emit('receive-message', {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          from: message.sender.username,
          to: msg.to,
          message: message.content,
          timestamp: message.timestamp,
          status: 'delivered',
          isVoiceMessage: message.isVoiceMessage,
          audioUrl: message.audioUrl,
          audioDuration: message.audioDuration,
          isEdited: message.isEdited,
          isDeleted: message.isDeleted,
          isPinned: message.isPinned
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
      // Update message in database using Prisma
      await prisma.message.update({
        where: {
          id: messageId,
          senderId: from // Only sender can edit their messages
        },
        data: {
          content: content,
          isEdited: true
        }
      });

      // Broadcast to target user
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
