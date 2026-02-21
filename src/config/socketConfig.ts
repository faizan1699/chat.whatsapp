/** Socket.IO client config. Use standalone server URL in production. */

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export const socketConfig = {
  url: SOCKET_URL,
  path: '/api/socket',
  transports: ['websocket', 'polling'] as string[],
  timeout: 5000,
  forceNew: true,
};
