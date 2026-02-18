'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Try to connect to Socket.IO server with fallback handling
    try {
      socketRef.current = io({
        path: '/api/socket',
        transports: ['polling'], // Use polling as fallback
        timeout: 5000,
        forceNew: true,
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to Socket.IO server');
      });

      socketRef.current.on('connect_error', (error: any) => {
        console.warn('Socket.IO connection error:', error?.message || error);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
      });

    } catch (error) {
      console.error('Socket.IO initialization failed:', error);
      // Create a minimal fallback socket
      socketRef.current = {
        on: () => {},
        off: () => {},
        emit: () => {},
        disconnect: () => {},
        connected: false,
        id: 'fallback-id',
        io: null
      } as any;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};
