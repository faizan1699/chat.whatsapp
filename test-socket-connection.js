import io from "socket.io-client";


const socket = io('http://localhost:3000');

socket.on('connect', () => {
    
    socket.emit('join-user', 'testuser');
    
    setTimeout(() => {
        socket.emit('send-message', {
            from: 'testuser',
            to: 'testuser2',
            message: 'Hello from test script!',
            conversationId: 'test-conv'
        }, (ack) => {
            console.log('📬 Message acknowledgment:', ack);
        });
    }, 2000);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from socket server');
});

socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
});

socket.on('joined', (users) => {
    console.log('👥 Online users:', users);
});

socket.on('receive-message', (data) => {
    console.log('📨 Received message:', data);
});

setTimeout(() => {
    console.log('🔌 Closing connection...');
    socket.disconnect();
}, 5000);
