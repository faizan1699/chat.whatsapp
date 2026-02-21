
export SUPABASE_URL=$(grep SUPABASE_URL .env | cut -d '=' -f2)
export SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2)
export SOCKET_PORT=3001
export NEXT_PUBLIC_APP_URL=http://localhost:3000

echo "Starting Socket.IO server..."
node server/socket-server.js &

sleep 3

echo "Starting Next.js development server..."
npm run dev
