# Socket.IO Setup

## Current Status
✅ Socket.IO endpoint is accessible at `/api/socket`
✅ Standalone server at `server/socket-server.js`
✅ Client connects to standalone server when `NEXT_PUBLIC_SOCKET_URL` is set

## Production

1. **Run standalone server**:
   ```bash
   npm run socket
   # or: node server/socket-server.js
   ```

2. **Horizontal scaling** (Redis adapter):
   ```bash
   npm install @socket.io/redis-adapter redis
   REDIS_URL=redis://localhost:6379 npm run socket
   ```

3. **Client**: Set `NEXT_PUBLIC_SOCKET_URL=http://your-socket-host:3001` so the client connects to the standalone server.

## Current Features
- ✅ Basic socket connection
- ✅ Error handling and fallbacks
- ✅ Message emitting (with mock responses)
- ✅ Event listeners
- ⚠️ Real-time messaging (limited without full server)

## Debugging
Check browser console for:
- "Connected to Socket.IO server" = Successful connection
- "Socket.IO connection error" = Connection failed, using fallback
- "Mock:" messages = Using fallback functionality

## API Endpoint
- **GET /api/socket**: Returns socket status
- **Path**: `/api/socket` for Socket.IO connections
