'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

interface User {
    [key: string]: string;
}

interface Message {
    from: string;
    to: string;
    message: string;
    timestamp: Date;
}

export default function ChatPage() {
    const router = useRouter();
    const [username, setUsername] = useState<string>('');
    const [users, setUsers] = useState<User>({});
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const savedUsername = localStorage.getItem('webrtc-username');
        if (!savedUsername) {
            router.push('/');
            return;
        }
        setUsername(savedUsername);

        // Initialize socket
        fetch('/api/socket')
            .then(() => {
                socketRef.current = io(undefined, {
                    path: '/api/socket',
                    addTrailingSlash: false,
                    transports: ['polling'],
                });

                socketRef.current.on('connect', () => {
                    console.log('Connected to chat socket');
                    setIsConnected(true);
                    socketRef.current?.emit('join-user', savedUsername);
                });

                socketRef.current.on('joined', (allUsers: User) => {
                    setUsers(allUsers);
                });

                socketRef.current.on('receive-message', (data: Message) => {
                    console.log('Received message:', data);
                    setMessages((prev) => [...prev, { ...data, timestamp: new Date(data.timestamp) }]);
                });

                // Handle errors/disconnections
                socketRef.current.on('disconnect', () => {
                    setIsConnected(false);
                });
            });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [router]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedUser || !socketRef.current) return;

        const newMessage: Message = {
            from: username,
            to: selectedUser,
            message: inputMessage,
            timestamp: new Date(),
        };

        // Emit message to server
        socketRef.current.emit('send-message', newMessage);

        // Add to local state
        setMessages((prev) => [...prev, newMessage]);
        setInputMessage('');
    };

    const filteredUsers = Object.keys(users).filter((u) => u !== username);

    // Filter messages for the selected conversation
    const currentChatMessages = messages.filter(
        (msg) =>
            (msg.from === username && msg.to === selectedUser) ||
            (msg.from === selectedUser && msg.to === username)
    );

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar - User List */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Chats</h2>
                        <button
                            onClick={() => router.push('/')}
                            className="text-sm text-blue-500 hover:underline"
                        >
                            Back to Call
                        </button>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{username}</p>
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredUsers.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            <p>No active users</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <button
                                key={user}
                                onClick={() => setSelectedUser(user)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${selectedUser === user
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${selectedUser === user ? 'bg-blue-600' : 'bg-gray-400'}`}>
                                    {user.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">{user}</p>
                                    {/* Could show last message preview here later */}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* Mobile User List Toggle logic would go here, for now focusing on desktop layout primarily but responsive hooks are here */}

            {/* Chat Area */}
            <main className="flex-1 flex flex-col h-full relative">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 justify-between shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden mr-2 text-gray-500" onClick={() => setSelectedUser(null)}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                    {selectedUser.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{selectedUser}</h3>
                                    <span className="text-xs text-green-500 font-medium">Active Now</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push('/')}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    title="Start Video Call"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 7l-7 5 7 5V7z" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                    </svg>
                                </button>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {currentChatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </div>
                                    <p>Send a message to start chatting!</p>
                                </div>
                            ) : (
                                currentChatMessages.map((msg, idx) => {
                                    const isMe = msg.from === username;
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                    }`}
                                            >
                                                <p className="text-sm md:text-base break-words">{msg.message}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <form onSubmit={handleSendMessage} className="flex gap-2 items-center max-w-4xl mx-auto">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim()}
                                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
                        <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a user to chat</h2>
                        <p className="text-gray-500 max-w-sm text-center">
                            Choose a user from the sidebar to start a real-time conversation.
                        </p>

                        {/* Mobile-only visible tip */}
                        <div className="md:hidden mt-8 w-full max-w-xs">
                            <p className="text-sm font-semibold text-gray-600 mb-2">Active Users:</p>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y">
                                {filteredUsers.map(user => (
                                    <button
                                        key={user}
                                        onClick={() => setSelectedUser(user)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {user.charAt(0)}
                                        </span>
                                        {user}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
