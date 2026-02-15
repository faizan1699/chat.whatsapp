'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

interface User {
    [key: string]: string;
}

interface Message {
    id?: string;
    from: string;
    to: string;
    message: string;
    timestamp: Date;
    status?: 'pending' | 'sent' | 'failed';
}

export default function ChatPage() {
    const router = useRouter();
    const [username, setUsername] = useState<string>('');
    const [users, setUsers] = useState<User>({});
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const selectedUserRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isWindowFocused, setIsWindowFocused] = useState(true);
    const isWindowFocusedRef = useRef(true);

    // Sync refs with state
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        isWindowFocusedRef.current = isWindowFocused;
    }, [isWindowFocused]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Request Notification Permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const handleFocus = () => setIsWindowFocused(true);
        const handleBlur = () => setIsWindowFocused(false);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedUser]);

    useEffect(() => {
        const savedUsername = localStorage.getItem('webrtc-username');
        if (!savedUsername) {
            router.push('/');
            return;
        }
        setUsername(savedUsername);

        const initSocket = async () => {
            try {
                await fetch('/api/socket');

                const socket = io(undefined, {
                    path: '/api/socket',
                    addTrailingSlash: false,
                    transports: ['polling', 'websocket'], // Allow websocket if available
                    reconnectionAttempts: 5,
                    timeout: 10000,
                });

                socketRef.current = socket;

                socket.on('connect', () => {
                    console.log('Socket connected:', socket.id);
                    setIsConnected(true);
                    socket.emit('join-user', savedUsername);
                });

                socket.on('joined', (allUsers: User) => {
                    console.log('Users updated:', allUsers);
                    setUsers(allUsers);
                });

                socket.on('receive-message', (data: Message) => {
                    console.log('Message received:', data);

                    // Show notification
                    if (data.from !== savedUsername) {
                        if (!isWindowFocusedRef.current || selectedUserRef.current !== data.from) {
                            showNotification(data);
                        }
                    }

                    setMessages((prev) => {
                        if (data.id && prev.some(m => m.id === data.id)) return prev;
                        return [...prev, { ...data, timestamp: new Date(data.timestamp), status: 'sent' }];
                    });
                });

                socket.on('disconnect', (reason) => {
                    console.log('Socket disconnected:', reason);
                    setIsConnected(false);
                });

                socket.on('connect_error', (error) => {
                    console.error('Socket connection error:', error);
                    setIsConnected(false);
                });

            } catch (err) {
                console.error('Failed to initialize socket:', err);
            }
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [router]);

    const sendMessageInternal = (msg: Message) => {
        if (!socketRef.current) return;
        socketRef.current.emit('send-message', msg, (ack: any) => {
            if (ack && ack.status === 'ok') {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
            } else {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
            }
        });
    };

    const showNotification = (data: Message) => {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const options: any = {
                body: data.message,
                icon: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.from}`,
                tag: 'chat-msg',
                renotify: true
            };
            const notification = new Notification(`New message from ${data.from}`, options);

            notification.onclick = () => {
                window.focus();
                setSelectedUser(data.from);
                notification.close();
            };
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedUser) {
            console.log('Cannot send: empty message or no user selected');
            return;
        }

        const newMessage: Message = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            from: username,
            to: selectedUser,
            message: inputMessage.trim(),
            timestamp: new Date(),
            status: 'pending'
        };

        setMessages((prev) => [...prev, newMessage]);
        const currentMsg = inputMessage;
        setInputMessage('');

        if (socketRef.current?.connected) {
            sendMessageInternal(newMessage);
        } else {
            console.warn('Socket not connected, marking message as failed');
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'failed' } : m));
            }, 1000);
        }
    };

    const handleRetry = (msg: Message) => {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'pending' } : m));
        if (isConnected && socketRef.current) {
            sendMessageInternal(msg);
        } else {
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
            }, 500);
        }
    };

    const filteredUsers = Object.keys(users)
        .filter((u) => u !== username)
        .filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()));

    const currentChatMessages = messages.filter(
        (msg) =>
            (msg.from === username && msg.to === selectedUser) ||
            (msg.from === selectedUser && msg.to === username)
    );

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#f0f2f5] md:p-4 font-sans">
            <div className="flex h-full w-full overflow-hidden bg-white shadow-2xl md:rounded-sm">

                {/* Sidebar */}
                <aside className={`flex flex-col border-r border-[#e9edef] bg-white transition-all duration-300 ${selectedUser ? 'hidden md:flex w-full md:w-[30%] lg:w-[25%]' : 'w-full md:w-[30%] lg:w-[25%]'}`}>
                    {/* Sidebar Header */}
                    <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 py-2">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-300 cursor-pointer">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="avatar" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex items-center gap-5 text-[#54656f]">
                            <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                                <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                    <path d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-1.135-.728 7.269 7.269 0 0 0-13.231-1.582.977.977 0 0 1-1.636-1.079 9.219 9.219 0 0 1 16.729 2.254.977.977 0 0 1-.727 1.135zm-7.965-11.69c3.02 0 5.61 1.444 7.23 3.664a.978.978 0 0 1-1.583 1.15 7.268 7.268 0 0 0-11.294 0 .978.978 0 0 1-1.583-1.15c1.62-2.22 4.21-3.664 7.23-3.664z"></path>
                                </svg>
                            </button>
                            <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                                <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                    <path d="M19.005 3.125H4.995c-1.03 0-1.875.845-1.875 1.875V19c0 1.03.845 1.875 1.875 1.875h14.01c1.03 0 1.875-.845 1.875-1.875V5c0-1.03-.845-1.875-1.875-1.875zm-3.13 11.516s-.462.433-1.127.433c-.628 0-1.05-.333-1.05-.333s-.39-.4-.523-.623V14h-1.5s-.1-.013-.234-.013c-.42 0-1.055.347-1.055.347s-.395.347-.947.347c-.52 0-.842-.333-.842-.333s-.342-.32-.474-.533V14h-1.5v-1h1.5v-.547c-.145-.227-.513-.579-.513-.579s-.355-.373-.829-.373c-.566 0-.974.387-.974.387s-.408.4-.553.639V12h-1.5V6h1.5v2.533c.132-.213.487-.533.487-.533s.342-.347.882-.347c.54 0 .934.347.934.347s.408.347.539.56V8.5h1.5v2.853c.158-.28.592-.519.592-.519S11.411 10.5 12 10.5s1.053.333 1.053.333.408.387.54.667H14.5s-.118.013-.263.013c-.434 0-1.013.253-1.013.253s-.421.307-.421.787c0 .52.329.84.329.84s.408.36.934.36c.553 0 .934-.36.934-.36z"></path>
                                </svg>
                            </button>
                            <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                                <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                    <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z"></path>
                                </svg>
                            </button>
                        </div>
                    </header>

                    {/* Search Bar */}
                    <div className="bg-white px-3 py-2">
                        <div className="flex items-center gap-4 rounded-lg bg-[#f0f2f5] px-3 py-1.5 shadow-sm">
                            <span className="text-[#54656f]">
                                <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor">
                                    <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search or start new chat"
                                className="w-full bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#667781]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredUsers.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#667781]">
                                <p className="text-sm">No chats found</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => {
                                const lastMsg = messages.filter(m => (m.from === user && m.to === username) || (m.from === username && m.to === user)).pop();
                                return (
                                    <button
                                        key={user}
                                        onClick={() => setSelectedUser(user)}
                                        className={`flex w-full items-center gap-3 border-b border-[#f0f2f5] px-3 py-3 transition-colors ${selectedUser === user ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'}`}
                                    >
                                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`} alt={user} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex flex-1 flex-col overflow-hidden text-left">
                                            <div className="flex items-center justify-between">
                                                <span className="truncate font-semibold text-[#111b21]">{user}</span>
                                                {lastMsg && (
                                                    <span className="text-[12px] text-[#667781]">
                                                        {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="truncate text-sm text-[#667781]">
                                                    {lastMsg ? lastMsg.message : 'Start a conversation'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                {/* Main Chat Area */}
                <main className={`flex flex-1 flex-col bg-[#efeae2] relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <header className="z-20 flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 py-2 border-l border-[#d1d7db]">
                                <div className="flex items-center gap-3">
                                    <button className="md:hidden text-[#54656f]" onClick={() => setSelectedUser(null)}>
                                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
                                        </svg>
                                    </button>
                                    <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-300">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser}`} alt={selectedUser} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[#111b21] font-medium">{selectedUser}</span>
                                        <span className="text-[12px] text-[#667781]">online</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-[#54656f]">
                                    <button onClick={() => router.push('/')} className="hover:bg-black/5 p-2 rounded-full transition-colors" title="Start Call">
                                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                            <path d="M20 4h-1.1V3c0-.55-.45-1-1-1H6.1c-.55 0-1 .45-1 1v1H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 18V6h16v12H4z"></path>
                                            <path d="M23 7l-7 5 7 5V7z" />
                                        </svg>
                                    </button>
                                    <button className="hover:bg-black/5 p-2 rounded-full transition-colors font-bold text-xl">
                                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                            <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </header>

                            {/* Messages Container */}
                            <div className="relative flex-1 overflow-hidden">
                                <div className="chat-bg-pattern absolute inset-0 z-0 opacity-10"></div>
                                <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4 space-y-2">
                                    {currentChatMessages.map((msg, idx) => {
                                        const isMe = msg.from === username;
                                        return (
                                            <div
                                                key={msg.id || idx}
                                                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`flex items-center px-2.5 py-1.5 shadow-sm ${isMe
                                                        ? 'rounded-l-lg rounded-br-lg bg-[#d9fdd3] text-[#111b21]'
                                                        : 'rounded-r-lg rounded-bl-lg bg-white text-[#111b21]'
                                                        } ${msg.status === 'failed' ? 'bg-red-50' : ''}`}
                                                >
                                                    <p className="text-[14.2px] leading-tight pr-10 whitespace-pre-wrap">{msg.message}</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[11px] text-[#667781] uppercase">
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                        {isMe && (
                                                            <span className={`text-[11px] ${msg.status === 'sent' ? 'text-[#53bdeb]' : 'text-[#667781]'}`}>
                                                                {msg.status === 'pending' ? '✓' : msg.status === 'sent' ? '✓✓' : '!'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {msg.status === 'failed' && isMe && (
                                                        <button onClick={() => handleRetry(msg)} className="block mt-1 text-[11px] text-red-500 underline">Retry</button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Message Input Footer */}
                            <footer className="z-20 flex min-h-[62px] items-center gap-2 bg-[#f0f2f5] px-4 py-2">
                                <div className="flex gap-2 text-[#54656f]">
                                    <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                            <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm5.694 0c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-2.844 4.884c1.359 0 2.547-.625 3.326-1.583a.91.91 0 0 0-.094-1.248.907.907 0 0 0-1.218.066c-.523.518-1.272.846-2.014.846s-1.491-.328-2.014-.846a.913.913 0 0 0-1.218-.066.909.909 0 0 0-.094 1.248c.78 0 1.968 1.583 3.327 1.583zm0-13.911c-5.263 0-9.53 4.267-9.53 9.53s4.267 9.53 9.53 9.53 9.53-4.267 9.53-9.53-4.267-9.53-9.53-9.53zM12 20.662c-4.554 0-8.261-3.707-8.261-8.261s3.707-8.261 8.261-8.261 8.261 3.707 8.261 8.261-3.707 8.261-8.261 8.261z"></path>
                                        </svg>
                                    </button>
                                    <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                            <path d="M11.5 15.5l.001-4c0-.276-.224-.5-.5-.5H8.204c-.276 0-.5.224-.5.5s.224.5.5.5h2.295v3.5c0 .276.224.5.5.5s.5-.224.5-.5zM17.796 11h-2.295v-3.5c0-.276-.224-.5-.5-.5s-.5.224-.5.5v4c0 .276.224.5.5.5h2.795c.276 0 .5-.224.5-.5s-.224-.5-.5-.5zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                                        </svg>
                                    </button>
                                </div>
                                <form onSubmit={handleSendMessage} className="flex flex-1 items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Type a message"
                                        className="w-full rounded-lg bg-white px-4 py-2.5 text-[15px] text-[#111b21] outline-none placeholder:text-[#667781]"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputMessage.trim()}
                                        className="text-[#54656f] hover:bg-black/5 p-2 rounded-full transition-colors disabled:opacity-50"
                                    >
                                        {inputMessage.trim() ? (
                                            <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                                <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                                                <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.24 0c0-3.181-2.583-5.529-5.753-5.529S6.24 11.761 6.24 11.761c-.341 0-.623.282-.623.624v.21c0 .341.282.624.623.624s3.784.004 3.784.004c0 1.238 1.059 2.259 2.222 2.259 1.162 0 2.112-1.021 2.112-2.259h3.784c.341 0 .624-.283.624-.624v-.21c0-.342-.283-.624-.624-.624z"></path>
                                            </svg>
                                        )}
                                    </button>
                                </form>
                            </footer>
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center">
                            <div className="mb-10 w-[400px]">
                                <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa69ar96s3m.png" alt="WhatsApp Web" className="mx-auto" />
                            </div>
                            <h1 className="mb-4 text-3xl font-light text-[#41525d]">WhatsApp Web</h1>
                            <p className="max-w-[500px] text-sm leading-relaxed text-[#667781]">
                                Send and receive messages without keeping your phone online.<br />
                                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                            </p>
                            <div className="mt-auto flex items-center gap-1 text-sm text-[#8696a0]">
                                <svg viewBox="0 0 24 24" height="14" width="14" fill="currentColor">
                                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
                                </svg>
                                <span>End-to-end encrypted</span>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
