'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { frontendAuth } from '@/utils/frontendAuth';
import AuthOverlay from '@/components/global/AuthOverlay';
import Sidebar from '@/components/global/Sidebar';
import MessageSkeleton from '@/components/chat/MessageSkeleton';
import { Message } from '@/types/message';

export default function CleanChatPage() {
    const router = useRouter();
    const [username, setUsername] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const session = frontendAuth.getSession();
                if (session) {
                    setUsername(session.user.username);
                    setIsLoading(false);
                    
                    loadConversations(session.user.id);
                } else {
                    console.log('❌ No session found, showing login');
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('❌ Auth check failed:', error);
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const loadConversations = async (userId: string) => {
        try {
            const response = await fetch(`/api/conversations?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
                console.log('✅ Conversations loaded:', data.length);
            }
        } catch (error) {
            console.error('❌ Failed to load conversations:', error);
        }
    };

    const loadMessages = async (user: string) => {
        setIsMessagesLoading(true);
        try {
            const response = await fetch(`/api/messages?from=${username}&to=${user}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
                console.log('✅ Messages loaded:', data.length);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('❌ Failed to load messages:', error);
            setMessages([]);
        } finally {
            setIsMessagesLoading(false);
        }
    };

    // Load messages when selected user changes
    useEffect(() => {
        if (selectedUser && username) {
            loadMessages(selectedUser);
            
            // Set up auto-refresh for messages every 5 seconds
            const interval = setInterval(() => {
                loadMessages(selectedUser);
            }, 5000);

            return () => clearInterval(interval);
        } else {
            setMessages([]);
        }
    }, [selectedUser, username]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedUser) return;

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            from: username,
            to: selectedUser,
            message: inputMessage.trim(),
            timestamp: new Date(),
            status: 'sending'
        };

        setMessages(prev => [...prev, tempMessage]);
        setInputMessage('');

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId: 'temp-conversation',
                    senderId: 'temp-user',
                    content: inputMessage.trim(),
                    to: selectedUser,
                    from: username
                }),
            });

            if (response.ok) {
                const savedMsg = await response.json();
                setMessages(prev => prev.map(m => 
                    m.id === tempMessage.id ? { ...savedMsg, status: 'sent' } : m
                ));
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            setMessages(prev => prev.map(m => 
                m.id === tempMessage.id ? { ...m, status: 'failed' } : m
            ));
            setInputMessage(inputMessage.trim());
        }
    };

    const handleUsernameCreated = (newUsername: string, userId?: string) => {
        console.log('Login successful:', newUsername);
        setUsername(newUsername);
        if (userId) {
            loadConversations(userId);
        }
    };

    // Handle user selection with loading state
    const handleUserSelect = (user: string) => {
        setSelectedUser(user);
        // Messages will be loaded by useEffect
    };

    const handleClearData = () => {
        setUsername('');
        setSelectedUser(null);
        setMessages([]);
        setConversations([]);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!username) {
        return <AuthOverlay 
            username={username}
            onUsernameCreated={handleUsernameCreated}
            onClearData={handleClearData}
        />;
    }

    const users = conversations.reduce((acc: { [key: string]: string }, conv) => {
        conv.participants.forEach((p: any) => {
            if (p.user.username !== username) {
                acc[p.user.username] = p.user.id;
            }
        });
        return acc;
    }, {});

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-80 bg-white border-r border-gray-200">
                <Sidebar
                    username={username}
                    users={users}
                    selectedUser={selectedUser}
                    setSelectedUser={handleUserSelect}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    messages={messages}
                    conversations={conversations}
                    unreadCounts={unreadCounts}
                    onLogout={handleClearData}
                    isLoading={false}
                />
            </div>

            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <Fragment>
                        <div className="bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">{selectedUser}</h2>
                                {isMessagesLoading && (
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                        <span className="text-sm text-gray-500">Loading...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {isMessagesLoading ? (
                                <MessageSkeleton count={5} />
                            ) : (
                                messages
                                    .filter(m => (m.from === username && m.to === selectedUser) || (m.from === selectedUser && m.to === username))
                                    .map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.from === username ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                                    message.from === username
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-200 text-gray-800'
                                                }`}
                                            >
                                                <p>{message.message}</p>
                                                <p className="text-xs mt-1 opacity-70">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 px-6 py-4">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder={isMessagesLoading ? "Loading messages..." : "Type a message..."}
                                    disabled={isMessagesLoading}
                                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        isMessagesLoading 
                                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                                            : 'border-gray-300'
                                    }`}
                                />
                                <button
                                    type="submit"
                                    disabled={isMessagesLoading || !inputMessage.trim()}
                                    className={`px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        isMessagesLoading || !inputMessage.trim()
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                    }`}
                                >
                                    {isMessagesLoading ? 'Loading...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </Fragment>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Chat</h3>
                            <p className="text-gray-600">Select a user to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
