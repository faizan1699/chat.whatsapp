import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO, Socket } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import prisma from '../../utils/prisma';

interface SocketWithIO extends NetSocket {
  server: NetServer & {
    io?: ServerIO;
  };
}

interface SocketWithUsername extends Socket {
  username?: string;
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
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    (res.socket as SocketWithIO).server.io = io;

    // Online users mapping
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

      socket.on('send-message', async (data, callback) => {
        const { to, from } = data;

        if (allusers[to] && allusers[from]) {
          try {
            // Save message to PostgreSQL via Prisma
            await prisma.message.create({
              data: {
                id: data.id,
                from: data.from,
                to: data.to,
                message: data.message || "",
                timestamp: new Date(data.timestamp),
                status: data.status || "sent",
                isVoiceMessage: !!data.isVoiceMessage,
                audioUrl: data.audioUrl || null,
                audioDuration: data.audioDuration || null,
                isEdited: !!data.isEdited,
                isDeleted: !!data.isDeleted,
                isPinned: !!data.isPinned,
                replyTo: data.replyTo ? (data.replyTo as any) : null,
                groupId: data.groupId || null,
                chunkIndex: data.chunkIndex !== undefined ? data.chunkIndex : null,
                totalChunks: data.totalChunks !== undefined ? data.totalChunks : null,
              }
            });

            io.to(allusers[to]).emit('receive-message', data);
            if (callback) callback({ status: 'ok' });
          } catch (error) {
            console.error('Error saving message to PostgreSQL:', error);
            if (callback) callback({ status: 'error', message: 'Failed to save message' });
          }
        } else {
          if (callback) callback({ status: 'error', message: 'User offline or not found' });
        }
      });

      socket.on('delete-message', async ({ id, to }) => {
        try {
          const msg = await prisma.message.findUnique({ where: { id } });
          if (!msg) return;

          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (msg.timestamp < oneHourAgo) {
            // Cannot delete for everyone after 1 hour
            return;
          }

          await prisma.message.update({
            where: { id },
            data: {
              isDeleted: true,
              message: "",
              audioUrl: null,
            }
          });

          if (allusers[to]) {
            io.to(allusers[to]).emit('delete-message', { id });
          }
        } catch (error) {
          console.error('Error deleting message from PostgreSQL:', error);
        }
      });

      // WebRTC Signal Forwarding
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
          await prisma.message.update({ where: { id: messageId }, data: { status: 'delivered' } });
          if (allusers[to]) io.to(allusers[to]).emit('message-status-update', { messageId, status: 'delivered' });
        } catch (e) { }
      });

      socket.on('mark-read', async ({ messageId, to }) => {
        try {
          await prisma.message.update({ where: { id: messageId }, data: { status: 'read' } });
          if (allusers[to]) io.to(allusers[to]).emit('message-status-update', { messageId, status: 'read' });
        } catch (e) { }
      });

      socket.on('edit-message', async ({ id, to, message }) => {
        try {
          await prisma.message.update({ where: { id }, data: { message, isEdited: true } });
          if (allusers[to]) io.to(allusers[to]).emit('message-edited', { id, message });
        } catch (e) { }
      });

      socket.on('pin-message', async ({ id, isPinned, to }) => {
        try {
          await prisma.message.update({ where: { id }, data: { isPinned } });
          if (allusers[to]) io.to(allusers[to]).emit('pin-message', { id, isPinned });
        } catch (e) { }
      });
    });
  }
  res.end();
};

export default SocketHandler;
