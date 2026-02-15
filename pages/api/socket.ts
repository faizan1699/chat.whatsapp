import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO, Socket } from 'socket.io';
import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';

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

    // Clear all users on server start
    const allusers: { [key: string]: string } = {};

    io.on('connection', (socket: SocketWithUsername) => {
      console.log('User connected with socket ID:', socket.id);

      socket.on('join-user', (username) => {
        console.log(`User ${username} joining with socket ${socket.id}`);

        // Validate username
        if (!username || username.trim() === '' || username.length < 2) {
          socket.emit('username-taken', { message: 'Username must be at least 2 characters long' });
          return;
        }

        const cleanUsername = username.trim();

        // If username exists, we allow takeover for easier local development/refreshing
        // In a real app, you'd want auth here
        if (allusers[cleanUsername]) {
          console.log(`Username ${cleanUsername} already taken, replacing old socket ID ${allusers[cleanUsername]} with ${socket.id}`);
        }

        allusers[cleanUsername] = socket.id;
        socket.username = cleanUsername;

        console.log('Current users:', allusers);
        io.emit('joined', allusers);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.username && allusers[socket.username] === socket.id) {
          delete allusers[socket.username];
          console.log('User removed from list:', socket.username);
          console.log('Current users after disconnect:', allusers);
          io.emit('joined', allusers);
        }
      });

      // Add clear all users functionality
      socket.on('clear-all-users', () => {
        console.log('Clearing all users from server');
        Object.keys(allusers).forEach(username => {
          if (allusers[username]) {
            io.to(allusers[username]).emit('force-disconnect');
          }
        });
        // Clear the allusers object
        Object.keys(allusers).forEach(key => delete allusers[key]);
        io.emit('joined', allusers);
        console.log('All users cleared from server');
      });

      socket.on('offer', ({ from, to, offer }) => {
        // Only allow call if both users are authenticated (have usernames)
        if (allusers[from] && allusers[to]) {
          console.log(`Call offer from ${from} to ${to}`);
          io.to(allusers[to]).emit('offer', { from, to, offer });
        } else {
          console.log(`Call rejected: ${from} or ${to} not authenticated`);
        }
      });

      socket.on('answer', ({ from, to, answer }) => {
        // Only allow answer if both users are authenticated
        if (allusers[from] && allusers[to]) {
          console.log(`Call answer from ${from} to ${to}`);
          io.to(allusers[to]).emit('answer', { from, to, answer });
        } else {
          console.log(`Call answer rejected: ${from} or ${to} not authenticated`);
        }
      });

      socket.on('icecandidate', (candidate) => {
        // Only forward ICE candidates from authenticated users
        if (socket.username) {
          socket.broadcast.emit('icecandidate', candidate);
        }
      });

      socket.on('end-call', ({ from, to }) => {
        // Only allow end call if both users are authenticated
        if (allusers[from] && allusers[to]) {
          console.log(`Call end from ${from} to ${to}`);
          io.to(allusers[to]).emit('end-call', { from, to });
        } else {
          console.log(`Call end rejected: ${from} or ${to} not authenticated`);
        }
      });

      socket.on('call-rejected', ({ from, to }) => {
        // Only allow call rejection if both users are authenticated
        if (allusers[from] && allusers[to]) {
          console.log(`Call rejected from ${from} to ${to}`);
          io.to(allusers[to]).emit('call-rejected', { from, to });
        } else {
          console.log(`Call rejection rejected: ${from} or ${to} not authenticated`);
        }
      });

      socket.on('call-ended', (caller) => {
        // Only allow call end if both users are authenticated
        if (allusers[caller[0]] && allusers[caller[1]]) {
          console.log(`Call ended between ${caller[0]} and ${caller[1]}`);
          io.to(allusers[caller[0]]).emit('call-ended', caller);
          io.to(allusers[caller[1]]).emit('call-ended', caller);
        } else {
          console.log(`Call end rejected: ${caller[0]} or ${caller[1]} not authenticated`);
        }
      });

      socket.on('send-message', (data, callback) => {
        const { to, from, message } = data;
        if (allusers[to] && allusers[from]) {
          console.log(`Relaying message from ${from} to ${to}: ${message}`);
          console.log(`Target socket ID: ${allusers[to]}`);
          io.to(allusers[to]).emit('receive-message', data);
          if (callback) callback({ status: 'ok' });
        } else {
          console.log(`Message rejected: ${from} or ${to} not authenticated. 'to' in allusers: ${!!allusers[to]}, 'from' in allusers: ${!!allusers[from]}`);
          if (callback) callback({ status: 'error', message: 'User offline or not found' });
        }
      });

      socket.on('delete-message', ({ id, to }) => {
        if (allusers[to]) {
          io.to(allusers[to]).emit('delete-message', { id });
        }
      });

      socket.on('pin-message', ({ id, isPinned, to }) => {
        if (allusers[to]) {
          io.to(allusers[to]).emit('pin-message', { id, isPinned });
        }
      });
    });
  }
  res.end();
};

export default SocketHandler;
