'use client';

import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { Pin, ChevronDown, X } from 'lucide-react';
import { getClientSession, isClientAuthenticated, handleAuthError } from '@/utils/auth-client-new';
import IncomingCallModal from '@/components/video/IncomingCallModal';
import MessageItem from '@/components/chat/MessageItem';
import { Message, ReplyTo } from '@/types/message';
import CallNotification from '@/components/video/CallNotification';
import Sidebar from '@/components/global/Sidebar';
import ResizableSidebar from '@/components/global/ResizableSidebar';
import { getClientCookies } from '@/utils/cookies';
import AuthOverlay from '@/components/global/AuthOverlay';
import EditProfileModal from '@/components/global/EditProfileModal';
import FullPageLoader from '@/components/global/FullPageLoader';
import { SecureSession } from '@/utils/secureSession';
import { useMessageApi } from '@/hooks/useMessageApi';
import { useSocket } from '@/hooks/useSocket';
import { storageHelpers, STORAGE_KEYS, chatStorage } from '@/utils/storage';
import { supabaseAdmin } from '@/utils/supabase-server';
import { uploadAudio } from '@/utils/supabase';
import api from '@/utils/api';
import { conversationsManager } from '@/utils/conversationsManager';
import ChatFooter from '@/components/chat/ChatFooter';
import EmptyChatState from '@/components/chat/EmptyChatState';
import CallOverlay from '@/components/video/CallOverlay';
import MessageList from '@/components/chat/MessageList';
import ChatHeader from '@/components/chat/ChatHeader';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';

interface User {
    [key: string]: string;
}

export default function ChatPage() {
    const router = useRouter();
    const [username, setUsername] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [users, setUsers] = useState<User>({});
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const selectedUserRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<Socket | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [showPinsDropdown, setShowPinsDropdown] = useState<boolean>(false);

    const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
    const isWindowFocusedRef = useRef(true);
    const [autoRetryEnabled, setAutoRetryEnabled] = useState<boolean>(true);
    const [retryInterval, setRetryInterval] = useState<NodeJS.Timeout | null>(null);
    const [isConversationsLoading, setIsConversationsLoading] = useState<boolean>(false);

    // Message API hook
    const {
        sendMessage,
        sendVoiceMessage,
        updateMessage,
        deleteMessage,
        pinMessage,
        fetchMessages,
        retryMessage,
        loading: messageLoading,
        error: messageError
    } = useMessageApi();

    const socket = useSocket();
    const [callNotification, setCallNotification] = useState<{ message: string; type: 'start' | 'end' } | null>(null);

    const call = useWebRTCCall({
        socket,
        username,
        selectedUser,
        onCallRejected: from => {
            setCallNotification({ message: `${from} rejected your call`, type: 'end' });
            setTimeout(() => setCallNotification(null), 3000);
        }
    });
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [showEditProfile, setShowEditProfile] = useState(false);

    // Clear highlighted message after animation
    useEffect(() => {
        if (highlightedMessageId) {
            const timer = setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [highlightedMessageId]);

    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const chunkBufferRef = useRef<Record<string, Message[]>>({});

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        isWindowFocusedRef.current = isWindowFocused;
    }, [isWindowFocused]);

    const conversationUsers = (conversations || []).reduce((acc: { [key: string]: string }, conv) => {
        conv.participants?.forEach((p: any) => {
            if (p.user.username !== username) {
                acc[p.user.username] = p.user.id;
            }
        });
        return acc;
    }, {});

    const allUsers = { ...conversationUsers, ...users };
    useEffect(() => {
        if (selectedUser) {
            setUnreadCounts(prev => ({
                ...prev,
                [selectedUser]: 0
            }));
        }
    }, [selectedUser]);

    useEffect(() => {
        if (!socket) return;

        socketRef.current = socket;

        // Socket event listeners
        socket.on('connect', () => {
            console.log('✅ Socket connected');
            setIsConnected(true);
            socket.emit('join-user', username);
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setIsConnected(false);
        });

        socket.on('joined', (onlineUsers: { [key: string]: string }) => {
            setUsers(onlineUsers);
        });

        socket.on('receive-message', (data: Message) => {
            console.log('📨 Received message:', data);
            console.log('📨 Current user:', username);
            console.log('📨 Selected user:', selectedUser);
            console.log('📨 Message from:', data.from, 'to:', data.to);

            setMessages(prev => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some(m => m.id === data.id);
                if (!exists) {
                    console.log('✅ Adding new message to list');
                    return [...prev, data];
                } else {
                    console.log('⚠️ Message already exists, skipping');
                    return prev;
                }
            });

            // Update unread count if message is not from current user
            if (data.from !== username && data.to === username) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.from]: (prev[data.from] || 0) + 1
                }));

                // Show notification if window is not focused
                if (!isWindowFocusedRef.current) {
                    showNotification(data);
                }
            }

            // If we receive a message for the current conversation, reload messages to ensure sync
            if ((data.from === selectedUser && data.to === username) ||
                (data.from === username && data.to === selectedUser)) {
                console.log('🔄 Message for current conversation, reloading...');
                setTimeout(() => loadMessages(selectedUser!), 1000);
            }
        });

        socket.on('message-status-update', ({ messageId, status }: { messageId: string; status: string }) => {
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, status: status as any } : m
            ));
        });

        socket.on('message-edited', ({ id, message }: { id: string; message: string }) => {
            setMessages(prev => prev.map(m =>
                m.id === id ? { ...m, message, isEdited: true } : m
            ));
        });

        socket.on('delete-message', ({ id }: { id: string }) => {
            setMessages(prev => prev.map(m =>
                m.id === id ? { ...m, isDeleted: true, message: '', audioUrl: undefined } : m
            ));
        });

        socket.on('pin-message', ({ id, isPinned }: { id: string; isPinned: boolean }) => {
            setMessages(prev => prev.map(m =>
                m.id === id ? { ...m, isPinned } : m
            ));
        });

        socket.on('clear-all-messages', ({ from, to }: { from: string; to: string }) => {
            if (to === username) {
                setMessages(prev => prev.filter(m =>
                    !((m.from === from && m.to === to) || (m.from === to && m.to === from))
                ));
            }
        });

        // WebRTC event listeners
        socket.on('offer', (payload) => {
            call.setIncomingCall({ from: payload.from, to: payload.to, offer: payload.offer, isAudioOnly: payload.isAudioOnly });
            call.playRingtone();
        });

        socket.on('answer', (payload) => {
            call.handleAnswer(payload.answer);
        });

        socket.on('icecandidate', (payload) => {
            const c = typeof payload === 'object' && payload?.candidate ? payload.candidate : payload;
            call.handleIceCandidate(c);
        });

        socket.on('call-ended', () => {
            call.handleRemoteEndCall();
        });

        socket.on('call-rejected', (payload) => {
            setCallNotification({ message: `${payload.from} rejected your call`, type: 'end' });
            setTimeout(() => setCallNotification(null), 3000);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('joined');
            socket.off('receive-message');
            socket.off('message-status-update');
            socket.off('message-edited');
            socket.off('delete-message');
            socket.off('pin-message');
            socket.off('clear-all-messages');
            socket.off('offer');
            socket.off('answer');
            socket.off('icecandidate');
            socket.off('call-ended');
            socket.off('call-rejected');
        };
    }, [socket, username, call]);

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
        if (selectedUser && isWindowFocused && socketRef.current) {
            const unreadMsgs = messages.filter(m => m.from === selectedUser && m.status !== 'read' && m.to === username);

            if (unreadMsgs.length > 0) {
                unreadMsgs.forEach(msg => {
                    if (msg.id) {
                        socketRef.current?.emit('mark-read', { messageId: msg.id, to: msg.from });
                    }
                });

                setMessages(prev => prev.map(m =>
                    (m.from === selectedUser && m.to === username && m.status !== 'read') ? { ...m, status: 'read' as const } : m
                ));
            }
        }
    }, [selectedUser, isWindowFocused, messages.length]);


    // Add no-scroll class to body for chat page
    useEffect(() => {
        document.body.classList.add('no-scroll');

        return () => {
            // Remove no-scroll class when component unmounts
            document.body.classList.remove('no-scroll');
        };
    }, []);

    // Periodic check for stuck sending messages
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setMessages(prev => prev.map(m => {
                // Check if message has been stuck in sending for more than 15 seconds
                if (m.status === 'sending' && m.timestamp) {
                    const timeDiff = now.getTime() - new Date(m.timestamp).getTime();
                    if (timeDiff > 15000) { // 15 seconds
                        console.warn('Message stuck in sending state, marking as failed:', m.id);
                        return {
                            ...m,
                            status: 'failed',
                            retryCount: 1,
                            lastRetryTime: new Date()
                        };
                    }
                }
                return m;
            }));
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, []);

    // Mark messages as read function removed - using WebSocket instead

    const loadMessages = async (selectedUsername: string) => {
        try {
            console.log('🔄 Loading messages for:', selectedUsername);
            console.log('🔄 Current conversations:', conversations.length);

            // Find conversation for this user
            let currentConversation = conversations.find(c =>
                c.participants.some((p: any) => p.user.username === selectedUsername)
            );

            console.log('Found conversation:', currentConversation);

            // If not found, try to get/create conversation directly
            if (!currentConversation) {
                console.log('🔄 Conversation not found, trying to create...');
                const cookies = getClientCookies();
                const userId = cookies['user-id'] || SecureSession.getUserId();

                if (userId) {
                    // Try to find conversation by participants
                    const { data: selectedUserData } = await supabaseAdmin
                        .from('users')
                        .select('id')
                        .eq('username', selectedUsername)
                        .maybeSingle();

                    console.log('Selected user data:', selectedUserData);

                    if (selectedUserData) {
                        const response = await fetch('/api/conversations', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                participantIds: [userId, selectedUserData.id]
                            }),
                        });

                        if (response.ok) {
                            const result = await response.json();
                            currentConversation = result.data;
                            setConversations(prev => [...prev, currentConversation]);
                        }
                    }
                }
            }

            if (currentConversation) {
                console.log('🔄 Fetching messages API for conversation:', currentConversation.id);
                const response = await fetch(`/api/conversations/${currentConversation.id}/messages`);
                if (response.ok) {
                    const messagesData = await response.json();
                    console.log('✅ Messages API loaded successfully:', messagesData.length, 'messages');

                    // Format messages for frontend and calculate unread counts
                    const formattedMessages = messagesData.map((msg: any) => ({
                        id: msg.id,
                        from: msg.sender?.username || 'Unknown',
                        to: msg.sender?.username === username ? selectedUsername : username,
                        message: msg.content,
                        timestamp: msg.timestamp,
                        status: msg.status,
                        isVoiceMessage: msg.is_voice_message,
                        audioUrl: msg.audio_url,
                        audioDuration: msg.audio_duration,
                        isDeleted: msg.is_deleted,
                        isEdited: msg.is_edited,
                        isPinned: msg.is_pinned,
                        replyTo: msg.reply_to ? {
                            id: msg.reply_to.id,
                            from: msg.reply_to.sender?.username || 'Unknown',
                            message: msg.reply_to.content || msg.reply_to.message
                        } : undefined,
                        senderId: msg.sender_id
                    }));

                    // Calculate unread messages for this conversation
                    const unreadCount = formattedMessages.filter((msg: any) =>
                        msg.from === selectedUsername &&
                        msg.status !== 'read' &&
                        msg.status !== 'delivered'
                    ).length;

                    // Update unread counts
                    setUnreadCounts(prev => ({
                        ...prev,
                        [selectedUsername]: unreadCount
                    }));

                    console.log('📊 Unread count for', selectedUsername, ':', unreadCount);

                    setMessages(formattedMessages);
                    console.log('✅ Loaded messages for', selectedUsername, ':', formattedMessages.length, 'messages');
                    console.log('📋 All loaded messages:', formattedMessages.map((m: any) => ({
                        id: m.id,
                        from: m.from,
                        to: m.to,
                        message: m.message?.substring(0, 20) + '...',
                        status: m.status,
                        isHidden: m.isHidden
                    })));

                    if (currentConversation && unreadCounts[selectedUsername] > 0) {
                        // Use WebSocket instead of HTTP API
                        const unreadMsgs = messages.filter(m =>
                            m.from === selectedUsername && m.status !== 'read' && m.to === username
                        );

                        if (unreadMsgs.length > 0 && socketRef.current) {
                            unreadMsgs.forEach(msg => {
                                if (msg.id) {
                                    socketRef.current?.emit('mark-read', { messageId: msg.id, to: msg.from });
                                }
                            });
                        }

                        setUnreadCounts(prev => ({
                            ...prev,
                            [selectedUsername]: 0
                        }));
                    }
                } else {
                    console.error('❌ Failed to load messages API:', response.status, response.statusText);
                    setMessages([]);
                }
            } else {
                console.log('ℹ️ No conversation found for', selectedUsername);
                setMessages([]);
            }
        } catch (error) {
            console.error('❌ Failed to load messages API:', error);
            setMessages([]);
        }
    };

    // Load user conversations from API
    const loadConversations = async (userId: string) => {
        try {
            const response = await fetch(`/api/conversations?userId=${userId}`);
            if (response.ok) {
                const result = await response.json();
                const conversationsData = result.data || [];
                setConversations(conversationsData);
                console.log('✅ Conversations loaded successfully:', conversationsData.length, 'conversations');
            } else {
                console.error('❌ Failed to load conversations:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            throw error;
        }
    };

    // Load messages when selected user changes
    useEffect(() => {
        if (selectedUser && username) {
            loadMessages(selectedUser);
        }
    }, [selectedUser, username]);

    // Also reload messages periodically to sync with database
    useEffect(() => {
        if (selectedUser && username) {
            const interval = setInterval(() => {
                loadMessages(selectedUser);
            }, 10000); // Reload every 10 seconds

            return () => clearInterval(interval);
        }
    }, [selectedUser, username]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check session using unified auth utility
                const storedSession = getClientSession();
                console.log('🔐 Checking authentication:', {
                    storedSession: storedSession,
                    hasSession: !!storedSession,
                    username: storedSession?.user?.username
                });

                if (storedSession) {
                    console.log('✅ User authenticated:', storedSession.user?.username);
                    setUsername(storedSession?.user?.username || '');
                    setIsLoading(false); // Set loading to false when data is available
                    setIsConversationsLoading(true);

                    // Load user data
                    loadConversations(storedSession?.user?.id || '').then(() => {
                        console.log('✅ Conversations loaded');
                        setIsConversationsLoading(false);
                    }).catch((error: any) => {
                        console.error('❌ Failed to load conversations:', error);
                        setIsConversationsLoading(false);
                    });

                    // Load failed messages
                    const failed = storageHelpers.getFailedMessages() || [];
                    if (failed.length > 0) {
                        console.log('🔄 Restoring failed messages:', failed.length);
                        setMessages(prev => {
                            const newMessages = failed.filter((fm: Message) => !prev.some(m => m.id === fm.id));
                            return [...prev, ...newMessages];
                        });
                    }
                } else {
                    console.log('❌ No session found, showing login');
                    setIsLoading(false);
                    setIsConversationsLoading(false);
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                setIsLoading(false);
                setIsConversationsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Listen for session changes using localStorage events
    useEffect(() => {
        const checkSessionChange = async () => {
            try {
                const storedSession = getClientSession();
                const currentUsername = storedSession?.username || '';

                if (currentUsername !== username) {
                    if (currentUsername && storedSession) {
                        console.log('🔄 Session changed, updating username:', currentUsername);
                        setUsername(currentUsername);
                        if (storedSession?.user?.id) {
                            loadConversations(storedSession.user.id);
                        }
                    } else {
                        // Session was cleared, redirect to login
                        console.log('❌ Session cleared, redirecting to login');
                        router.push('/login');
                    }
                }
            } catch (error) {
                console.error('Error checking session:', error);
            }
        };

        // Listen for storage events (for cross-tab changes)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user_data' || e.key === 'session_token') {
                checkSessionChange();
            }
        };

        // Check immediately
        checkSessionChange();

        // Set up storage event listener
        window.addEventListener('storage', handleStorageChange);

        // Also check periodically (less frequently) as fallback
        const interval = setInterval(checkSessionChange, 30000); // 30 seconds instead of 5

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [username, router]);

    // Persistence Helpers
    const saveFailedMessageLocal = (msg: Message) => {
        try {
            storageHelpers.saveFailedMessage({
                ...msg,
                retryCount: 1,
                lastRetryTime: new Date(),
                status: 'failed'
            });
        } catch (error) {
            console.error('Error saving failed message:', error);
        }
    };

    const retryFailedMessages = () => {
        try {
            const failed = storageHelpers.getFailedMessages() || [];
            const now = new Date();

            failed.forEach(async (msg: Message) => {
                // Only retry if 5 minutes have passed since last retry
                const timeSinceLastRetry = msg.lastRetryTime ?
                    now.getTime() - new Date(msg.lastRetryTime).getTime() :
                    now.getTime() - new Date(msg.timestamp).getTime();

                if (timeSinceLastRetry > 30 * 1000) { // 30 seconds
                    try {
                        // Update status to sending
                        setMessages(prev => prev.map(m =>
                            m.id === msg.id ? { ...m, status: 'sending' } : m
                        ));

                        // Get current user ID and conversation
                        const cookies = getClientCookies();
                        const userId = (cookies['user-id'] as string) || SecureSession.getUserId();

                        let currentConversation = conversations.find(c =>
                            c.participants.some((p: any) => p.user.username === msg.to)
                        );

                        // If conversation not found, create it
                        if (!currentConversation && userId) {
                            const { data: selectedUserData } = await supabaseAdmin
                                .from('users')
                                .select('id')
                                .eq('username', msg.to)
                                .maybeSingle();

                            if (selectedUserData) {
                                const response = await fetch('/api/conversations', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        participantIds: [userId, selectedUserData.id]
                                    }),
                                });

                                if (response.ok) {
                                    const result = await response.json();
                                    currentConversation = result.data;
                                    setConversations(prev => [...prev, currentConversation]);
                                }
                            }
                        }

                        if (currentConversation && userId) {
                            const response = await fetch('/api/messages', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    conversationId: currentConversation.id,
                                    senderId: userId,
                                    content: msg.message,
                                    to: msg.to,
                                    from: username
                                }),
                            });

                            if (response.ok) {
                                // Remove from failed messages
                                const updatedFailed = failed.filter((m: Message) => m.id !== msg.id);
                                chatStorage.setItem('failed-messages', updatedFailed);

                                // Update message status to sent
                                setMessages(prev => prev.map(m =>
                                    m.id === msg.id ? { ...m, status: 'sent' } : m
                                ));
                            } else {
                                throw new Error('Failed to send message');
                            }
                        } else {
                            console.error('No conversation or user ID found for retry');
                        }
                    } catch (error) {
                        console.error('Failed to retry message:', error);
                        // Update retry count and last retry time
                        msg.retryCount = (msg.retryCount || 0) + 1;
                        msg.lastRetryTime = new Date();
                        saveFailedMessageLocal(msg);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to retry messages:', error);
        }
    };

    // Auto-retry failed messages
    useEffect(() => {
        if (autoRetryEnabled && isConnected) {
            const interval = setInterval(() => {
                retryFailedMessages();
            }, 10000); // Retry every 10 seconds
            setRetryInterval(interval);
        } else if (retryInterval) {
            clearInterval(retryInterval);
            setRetryInterval(null);
        }

        return () => {
            if (retryInterval) {
                clearInterval(retryInterval);
            }
        };
    }, [autoRetryEnabled, isConnected]);

    const removeFailedMessage = (id: string) => {
        try {
            const failed = storageHelpers.getFailedMessages() || [];
            const newFailed = failed.filter((m: Message) => m.id !== id);
            chatStorage.setItem('failed-messages', newFailed);
        } catch (error) {
            console.error('Error removing failed message:', error);
        }
    };

    // Restore failed messages on mount
    useEffect(() => {
        const failed = storageHelpers.getFailedMessages() || [];
        if (failed.length > 0) {
            setMessages(prev => {
                const newMessages = failed.filter((fm: Message) => !prev.some(m => m.id === fm.id));
                return [...prev, ...newMessages];
            });
        }
    }, []);

    // Retry failed messages when connected (every 5 seconds)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let isProcessing = false;

        if (isConnected && socketRef.current) {
            const processQueue = async () => {
                if (isProcessing) return;

                const failed: Message[] = storageHelpers.getFailedMessages() || [];
                if (failed.length === 0) return;

                isProcessing = true;
                console.log(`Auto-retrying ${failed.length} failed messages...`);

                for (const msg of failed) {
                    // Update status to pending in UI
                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'pending' } : m));

                    try {
                        await new Promise((resolve, reject) => {
                            if (!socketRef.current) return reject('Socket not connected');

                            socketRef.current.emit('send-message', msg, (ack: any) => {
                                if (ack && ack.status === 'ok') {
                                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
                                    removeFailedMessage(msg.id!);
                                    resolve(true);
                                } else {
                                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
                                    reject('Failed to send');
                                }
                            });
                        });
                        // Wait a bit between messages
                        await new Promise(r => setTimeout(r, 200));
                    } catch (err) {
                        console.error('Error retrying message:', msg.id, err);
                    }
                }
                isProcessing = false;
            };

            // Run immediately and then every 5 seconds
            processQueue();
            interval = setInterval(processQueue, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isConnected]);

    const sendMessageInternal = (msg: Message) => {
        if (!socketRef.current) return;
        socketRef.current.emit('send-message', msg, (ack: any) => {
            if (ack && ack.status === 'ok') {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
                removeFailedMessage(msg.id!);
            } else {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
                saveFailedMessageLocal({ ...msg, status: 'failed' });
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedUser) return;

        const tempContent = inputMessage.trim();
        setInputMessage('');
        setReplyingTo(null);

        // Create temporary message with sending status
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            from: username,
            to: selectedUser,
            message: tempContent,
            timestamp: new Date(),
            status: 'sending',
            retryCount: 0,
            replyTo: replyingTo ? {
                id: replyingTo.id,
                from: replyingTo.from,
                message: replyingTo.message
            } : undefined,
        };

        // Add to UI immediately with sending status
        setMessages(prev => [...prev, tempMessage]);

        // Add timeout to prevent stuck in sending state
        const timeoutId = setTimeout(() => {
            setMessages(prev => prev.map(m =>
                m.id === tempMessage.id ? {
                    ...m,
                    status: 'failed',
                    retryCount: 1,
                    lastRetryTime: new Date()
                } : m
            ));

            // Save to localStorage for retry
            saveFailedMessageLocal({
                ...tempMessage,
                status: 'failed',
                retryCount: 1,
                lastRetryTime: new Date()
            });

            // Restore input message
            setInputMessage(tempContent);
            console.warn('Message sending timed out, marked as failed');
        }, 10000); // 10 second timeout

        try {
            // Send message using hook
            const savedMsg = await sendMessage(
                tempContent,
                selectedUser,
                username,
                conversations,
                replyingTo
            );

            // Clear timeout on success
            clearTimeout(timeoutId);

            // Update local state with the saved message
            setMessages(prev => prev.map(m =>
                m.id === tempMessage.id ? {
                    ...savedMsg,
                    from: username,
                    to: selectedUser,
                    message: tempContent,
                    timestamp: new Date(savedMsg.timestamp),
                    status: 'sent'
                } : m
            ));

            // Emit to recipient via socket
            if (socketRef.current?.connected) {
                socketRef.current.emit('send-message', {
                    id: savedMsg.id,
                    from: username,
                    to: selectedUser,
                    message: tempContent,
                    timestamp: savedMsg.timestamp,
                    status: 'sent',
                    isVoiceMessage: false,
                    isEdited: false,
                    isDeleted: false,
                    isPinned: false,
                    replyTo: replyingTo ? {
                        id: replyingTo.id,
                        from: replyingTo.from,
                        message: replyingTo.message
                    } : undefined,
                    groupId: null,
                    chunkIndex: null,
                    totalChunks: null
                });
            }

        } catch (error) {
            console.error('Failed to send message:', error);

            // Clear timeout on error
            clearTimeout(timeoutId);

            // Update message status to failed
            setMessages(prev => prev.map(m =>
                m.id === tempMessage.id ? {
                    ...m,
                    status: 'failed',
                    retryCount: 1,
                    lastRetryTime: new Date()
                } : m
            ));

            // Save to localStorage for retry
            saveFailedMessageLocal({
                ...tempMessage,
                status: 'failed',
                retryCount: 1,
                lastRetryTime: new Date()
            });

            // Restore input message so user can retry
            setInputMessage(tempContent);
        }
    };

    const handleUpdateMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMessage || !inputMessage.trim() || !selectedUser) return;

        const tempContent = inputMessage.trim();
        setEditingMessage(null);
        setInputMessage('');

        try {
            // Update message in database
            const response = await fetch('/api/messages', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageId: editingMessage.id,
                    content: tempContent,
                    from: username,
                    to: selectedUser
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update message');
            }

            const updatedMsg = await response.json();

            // Update local state
            setMessages(prev => prev.map(msg =>
                msg.id === editingMessage.id
                    ? { ...msg, message: tempContent, isEdited: true }
                    : msg
            ));

            // Socket event is handled by the API server
            // No need to emit from client side

        } catch (error) {
            console.error('Failed to update message:', error);
            // Restore editing state if failed
            setEditingMessage(editingMessage);
            setInputMessage(tempContent);
        }
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setInputMessage('');
    };

    const handleEditMessage = (msg: Message) => {
        setEditingMessage(msg);
        setInputMessage(msg.message);
        setReplyingTo(null);
    };

    const handleSendVoice = async (audioBlob: Blob, duration: number) => {
        if (!selectedUser) return;

        try {
            // Send voice message using hook
            const savedMsg = await sendVoiceMessage(
                audioBlob,
                duration,
                selectedUser,
                username,
                conversations
            );

            // Update local state
            setMessages(prev => [...prev, {
                ...savedMsg,
                from: username,
                to: selectedUser,
                message: '🎤 Voice message',
                timestamp: new Date(savedMsg.timestamp),
                status: 'sent',
                isVoiceMessage: true,
                audioUrl: savedMsg.audioUrl,
                audioDuration: savedMsg.audioDuration
            }]);

            // Emit to recipient via socket
            if (socketRef.current?.connected) {
                socketRef.current.emit('send-message', {
                    id: savedMsg.id,
                    from: username,
                    to: selectedUser,
                    message: '🎤 Voice message',
                    timestamp: savedMsg.timestamp,
                    status: 'sent',
                    isVoiceMessage: true,
                    audioUrl: savedMsg.audioUrl,
                    audioDuration: savedMsg.audioDuration,
                    isEdited: false,
                    isDeleted: false,
                    isPinned: false,
                    replyTo: null,
                    groupId: null,
                    chunkIndex: null,
                    totalChunks: null
                });
            }

        } catch (error) {
            console.error('Failed to send voice message:', error);
            alert('Failed to send voice message');
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

    // Auto retry failed messages when there are 2 or more
    useEffect(() => {
        const failedMessages = messages.filter(m => m.status === 'failed');

        if (failedMessages.length >= 2 && isConnected && socketRef.current) {
            console.log(`🔄 Auto-retrying ${failedMessages.length} failed messages`);

            // Retry all failed messages with delay between each
            failedMessages.forEach((msg, index) => {
                setTimeout(() => {
                    if (msg.id) {
                        console.log(`🔄 Auto-retrying message ${index + 1}/${failedMessages.length}:`, msg.id);
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'pending' } : m));

                        if (isConnected && socketRef.current) {
                            sendMessageInternal(msg);
                        }
                    }
                }, index * 1000); // 1 second delay between each retry
            });
        }
    }, [messages, isConnected]);

    const handleDeleteMessage = async (id: string, type: 'me' | 'everyone') => {
        try {
            if (type === 'me') {
                // Delete for me - hide message for current user only
                setMessages(prev => prev.map(m =>
                    m.id === id ? { ...m, isHidden: true } : m
                ));
                console.log('� Hidden message for current user:', id);
            } else {
                setMessages(prev => prev.map(m =>
                    m.id === id ? { ...m, isDeleted: true, message: '', audioUrl: undefined } : m
                ));
                if (socketRef.current && selectedUser) {
                    socketRef.current?.emit('delete-message', { id, to: selectedUser });
                }
            }
        } catch (error) {
            console.error('❌ Failed to delete message:', error);
        }
    };

    const handlePinMessage = (msg: Message) => {
        const isPinned = !msg.isPinned;

        // Count pins for current chat
        const currentPins = messages.filter(m =>
            m.isPinned &&
            ((m.from === username && m.to === selectedUser) || (m.from === selectedUser && m.to === username))
        );

        if (isPinned && currentPins.length >= 3) {
            alert('Aap sirf 3 messages pin kar sakte hain per chat.');
            return;
        }

        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned } : m));
        socketRef.current?.emit('pin-message', { id: msg.id, isPinned, to: selectedUser });
    };

    const handleHideMessage = (id: string) => {
        console.log('🙈 Hiding message:', id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isHidden: true } : m));
    };

    const handleUnhideMessage = (id: string) => {
        console.log('👁️ Unhiding message:', id);
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isHidden: false } : m));
    };

    const handleRefreshMessages = () => {
        if (selectedUser) {
            console.log('🔄 Manual refresh triggered for:', selectedUser);
            loadMessages(selectedUser);
        }
    };

    const handleRetryMessage = (msg: Message) => {
        // Update status to sending
        setMessages(prev => prev.map(m =>
            m.id === msg.id ? { ...m, status: 'sending' } : m
        ));

        // Retry immediately
        retryFailedMessages();
    };

    const toggleAutoRetry = () => {
        setAutoRetryEnabled(!autoRetryEnabled);
    };

    const handleClearData = () => {
        // Clear secure session (requires server-side)
        SecureSession.clearSession();
        setUsername('');
        setSelectedUser(null);
        setMessages([]);
        setUsers({});
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        router.push('/');
    };

    const handleClearChat = () => {
        if (selectedUser) {
            setMessages([]);
            // Clear failed messages for this conversation
            const failed = storageHelpers.getFailedMessages() || [];
            const updatedFailed = failed.filter((m: Message) => m.to !== selectedUser);
            chatStorage.setItem('failed-messages', updatedFailed);
        }
    };

    const handleClearAllMessages = async () => {
        if (!selectedUser || !username) return;

        try {
            // Find current conversation
            let currentConversation = conversations.find(c =>
                c.participants.some((p: any) => p.user.username === selectedUser)
            );

            if (!currentConversation) {
                // Try to get conversation ID
                const cookies = getClientCookies();
                const userId = (cookies['user-id'] as string) || SecureSession.getUserId();

                if (userId) {
                    const { data: selectedUserData } = await supabaseAdmin
                        .from('users')
                        .select('id')
                        .eq('username', selectedUser)
                        .maybeSingle();

                    if (selectedUserData) {
                        const response = await fetch('/api/conversations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                participantIds: [userId, selectedUserData.id]
                            }),
                        });

                        if (response.ok) {
                            const result = await response.json();
                            currentConversation = result.data;
                        }
                    }
                }
            }

            if (currentConversation) {
                // Delete all messages from database
                const response = await fetch(`/api/conversations/${currentConversation.id}/messages/delete`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    // Clear local messages
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error('Failed to clear all messages:', error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await api.post('/auth/logout');
            if (response) handleClearData();
        } catch (error: any) {
            console.log("logout error", error?.message);
        }
    };

    const handleProfileUpdated = (newUsername?: string) => {
        if (newUsername) {
            setUsername(newUsername);
        }
    };

    const currentChatMessages = messages.filter(
        (msg: Message) => {
            const shouldInclude = (msg.from === username && msg.to === selectedUser) ||
                (msg.from === selectedUser && msg.to === username);
            console.log('🔍 Message filter:', {
                messageId: msg.id,
                from: msg.from,
                to: msg.to,
                username,
                selectedUser,
                shouldInclude,
                isSentMessage: msg.from === username,
                isReceivedMessage: msg.from === selectedUser,
                message: msg.message?.substring(0, 20) + '...'
            });
            return shouldInclude;
        }
    );

    const pinnedMessages = currentChatMessages.filter(m => m.isPinned);

    // Debug: Log current state
    console.log('🔍 Debug Info:', {
        totalMessages: messages.length,
        currentChatMessages: currentChatMessages.length,
        username,
        selectedUser,
        allMessages: messages.map(m => ({
            id: m.id,
            from: m.from,
            to: m.to,
            message: m.message?.substring(0, 20) + '...',
            isSent: m.from === username,
            isReceived: m.from === selectedUser
        }))
    });

    return (
        <div className="min-h-[100dvh] h-[100dvh] flex bg-[#f0f2f5] md:p-4 font-sans">
            {isLoading ? (
                <FullPageLoader />
            ) : (
                <div className="relative flex h-full w-full bg-white shadow-2xl md:rounded-sm">

                    <ResizableSidebar selectedUser={selectedUser}>
                        <Sidebar
                            username={username}
                            users={allUsers}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            messages={messages}
                            conversations={conversations}
                            unreadCounts={unreadCounts}
                            onLogout={handleLogout}
                            onEditProfile={() => setShowEditProfile(true)}
                            isLoading={isConversationsLoading}
                        />
                    </ResizableSidebar>

                    {/* Main Chat Area */}
                    <main className={`flex flex-1 flex-col bg-[#efeae2] relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                        {selectedUser ? (
                            <Fragment>
                                <ChatHeader
                                    selectedUser={selectedUser}
                                    onBack={() => setSelectedUser(null)}
                                    onStartVideoCall={async () => {
                                        try { await call.startCall(false); } catch { alert('Could not access camera/mic'); }
                                    }}
                                    onStartAudioCall={async () => {
                                        try { await call.startCall(true); } catch { alert('Could not access camera/mic'); }
                                    }}
                                    onClearChat={handleClearChat}
                                    onClearAllMessages={handleClearAllMessages}
                                    onRefreshMessages={handleRefreshMessages}
                                />

                                {/* Pinned Messages Banner */}
                                {pinnedMessages.length > 0 && (
                                    <div className="relative z-30">
                                        <div
                                            onClick={() => setShowPinsDropdown(!showPinsDropdown)}
                                            className="bg-white/90 backdrop-blur px-4 py-2 border-b border-[#f0f2f5] flex items-center gap-2 shadow-sm cursor-pointer hover:bg-white transition-colors animate-in fade-in duration-300"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884]/10 text-[#00a884]">
                                                <Pin size={16} className="fill-current" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[12px] font-bold text-[#00a884]">
                                                    {pinnedMessages.length === 1 ? 'Pinned Message' : `${pinnedMessages.length} Pinned Messages`}
                                                </p>
                                                <p className="text-[13px] text-[#54656f] truncate">
                                                    {pinnedMessages[pinnedMessages.length - 1].message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <MessageList
                                    messages={messages}
                                    username={username}
                                    onRetry={handleRetry}
                                    onReply={setReplyingTo}
                                    onEdit={setEditingMessage}
                                    onDelete={handleDeleteMessage}
                                    onPin={handlePinMessage}
                                    highlightedMessageId={highlightedMessageId}
                                />

                                <ChatFooter
                                    inputMessage={inputMessage}
                                    setInputMessage={setInputMessage}
                                    onSendMessage={handleSendMessage}
                                    onSendVoice={handleSendVoice}
                                    onUpdateMessage={handleUpdateMessage}
                                    // onEditMessage={() => { }}
                                    replyingTo={replyingTo}
                                    editingMessage={editingMessage}
                                    onCancelReply={() => setReplyingTo(null)}
                                    onCancelEdit={() => {
                                        setEditingMessage(null);
                                        setInputMessage('');
                                    }}
                                />
                            </Fragment>
                        ) : (
                            <EmptyChatState />
                        )}
                    </main>

                    <CallOverlay
                        username={username}
                        remoteUser={call.callParticipant}
                        isCallActive={call.isCallActive}
                        onEndCall={call.endCall}
                        callNotification={callNotification}
                        remoteStream={call.remoteStream}
                        remoteVideoRef={remoteVideoRef}
                        isAudioOnly={call.isAudioOnly}
                        localStream={call.localStream}
                        callTimer={call.callTimer}
                        connectionState={call.connectionState}
                        isMuted={call.isMuted}
                        setIsMuted={call.setIsMuted}
                        onClearData={handleClearData}
                    />

                    {call.incomingCall && (
                        <IncomingCallModal
                            from={call.incomingCall.from}
                            isAudioOnly={call.incomingCall.isAudioOnly}
                            onAccept={call.acceptCall}
                            onReject={call.rejectCall}
                        />
                    )}

                    {callNotification && (
                        <CallNotification
                            message={callNotification.message}
                            type={callNotification.type === 'start' ? 'start' : 'end'}
                            onClose={() => setCallNotification(null)}
                        />
                    )}

                    <AuthOverlay
                        username={username}
                        onUsernameCreated={(u, userId) => {
                            console.log('Login successful, setting up user session...');
                            setUsername(u);

                            // Wait a moment for cookies to be set, then load data
                            setTimeout(async () => {
                                const cookies = getClientCookies();
                                const userData = SecureSession.getUser();
                                const finalUserId = userId || (cookies['user-id'] as string) || userData.userId;

                                if (finalUserId) {
                                    try {
                                        await loadConversations(finalUserId);
                                        console.log('✅ Conversations API loaded successfully');
                                    } catch (error) {
                                        console.error('❌ Failed to load conversations:', error);
                                    }

                                    const failed = storageHelpers.getFailedMessages() || [];
                                    if (failed.length > 0) {
                                        console.log('🔄 Restoring failed messages:', failed.length);
                                        setMessages(prev => {
                                            const newMessages = failed.filter((fm: Message) => !prev.some(m => m.id === fm.id));
                                            return [...prev, ...newMessages];
                                        });
                                    }
                                } else {
                                    console.error('❌ No user ID found after login');
                                }
                            }, 100);

                            socketRef.current?.emit('join-user', u);
                        }}
                        onClearData={() => {
                            SecureSession.clearSession();
                            setUsername('');
                        }}
                    />

                    <EditProfileModal
                        isOpen={showEditProfile}
                        onClose={() => setShowEditProfile(false)}
                        onSuccess={handleProfileUpdated}
                    />
                </div>
            )}
        </div>
    );
}
