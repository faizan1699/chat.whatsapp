/** Socket.IO client config. Use standalone server URL in production. */

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export const socketConfig = {
  url: SOCKET_URL || undefined,
  path: SOCKET_URL ? '/' : '/api/socket',
  transports: ['websocket', 'polling'] as string[],
  timeout: 5000,
};
