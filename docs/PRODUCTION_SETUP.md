# Production Setup

## TURN Server (NAT Traversal)

WebRTC calls need TURN when peers are behind symmetric NATs. Add to `.env`:

```env
NEXT_PUBLIC_TURN_URL=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=your-username
NEXT_PUBLIC_TURN_CREDENTIAL=your-credential
```

Options: [Twilio TURN](https://www.twilio.com/stun-turn), [Metered.ca](https://www.metered.ca/stun-turn), or self-host [coturn](https://github.com/coturn/coturn).

## Socket.IO Server

Run the standalone server:

```bash
node server/socket-server.js
```

Or with Redis for horizontal scaling:

```bash
npm install @socket.io/redis-adapter redis
REDIS_URL=redis://localhost:6379 node server/socket-server.js
```

Set `NEXT_PUBLIC_SOCKET_URL=http://your-socket-host:3001` for the client.

## Load Balancing

Use `docker-compose -f docker-compose.prod.yml up` or configure nginx as in `nginx.prod.conf`:
- Next.js on port 3000
- Socket.IO on port 3001
- Nginx reverse proxy on 80

## RLS Policies

Run migration `20250220010000_add_rls_policies.sql` in Supabase. Policies apply when using Supabase Auth; the API uses `service_role` (bypasses RLS).
