'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, Fragment } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { Pin, ChevronDown, X } from 'lucide-react';
import { getClientSessionOptimized, invalidateSessionCache } from '@/utils/sessionCache';
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
import { clearAllSessionData, handleAuthFailure } from '@/utils/sessionCleanup';
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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const selectedUserRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [users, setUsers] = useState<{ [key: string]: string }>({});
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

    const memoizedConversations = useMemo(() => {
        return conversations.map(conv => ({
            ...conv,
            lastMessage: conv.last_message,
            unreadCount: unreadCounts[conv.other_user_id] || 0
        }));
    }, [conversations, unreadCounts]);

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

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join-user', username);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('joined', (onlineUsers: { [key: string]: string }) => {
            setUsers(onlineUsers);
        });

        socket.on('receive-message', (data: Message) => {

            setMessages(prev => {
                const exists = prev.some(m => m.id === data.id);
                if (!exists) {
                    return [...prev, data];
                } else {
                    return prev;
                }
            });

            if (data.from !== username && data.to === username) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.from]: (prev[data.from] || 0) + 1
                }));

                if (!isWindowFocusedRef.current) {
                    showNotification(data);
                }
            }

            if ((data.from === selectedUser && data.to === username) ||
                (data.from === username && data.to === selectedUser)) {
                setTimeout(() => loadMessages(selectedUser!), 1000);
            }
        });

        socket.on('message-status-update', ({ messageId, status }: { messageId: string; status: string }) => {
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, status: status as any } : m
            ));
        });

        socket.on('message-edited', ({ messageId, content, from, editedAt }: { messageId: string; content: string; from: string; to: string; editedAt: string }) => {
            setMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, content, isEdited: true, editedAt } : m
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


    useEffect(() => {
        document.body.classList.add('no-scroll');
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setMessages(prev => prev.map(m => {
                if (m.status === 'sending' && m.timestamp) {
                    const timeDiff = now.getTime() - new Date(m.timestamp).getTime();
                    if (timeDiff > 15000) {
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
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadMessages = async (selectedUsername: string) => {
        try {

            let currentConversation = conversations.find(c =>
                c.participants.some((p: any) => p.user.username === selectedUsername)
            );

            if (!currentConversation) {
                const cookies = getClientCookies();
                const userId = cookies['user-id'] || SecureSession.getUserId();

                if (userId) {
                    const { data: selectedUserData } = await supabaseAdmin
                        .from('users')
                        .select('id')
                        .eq('username', selectedUsername)
                        .maybeSingle();

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
                const response = await fetch(`/api/conversations/${currentConversation.id}/messages`);
                if (response.ok) {
                    const messagesData = await response.json();

                    const formattedMessages = messagesData.map((msg: any) => {
                        let timestamp = msg.timestamp;
                        if (timestamp) {
                            try {
                                if (typeof timestamp === 'string') {
                                    timestamp = new Date(timestamp);
                                }
                                if (!(timestamp instanceof Date)) {
                                    timestamp = new Date(timestamp);
                                }
                                if (isNaN(timestamp.getTime())) {
                                    timestamp = new Date();
                                }
                            } catch (error) {
                                timestamp = new Date();
                            }
                        } else {
                            timestamp = new Date();
                        }

                        return {
                            id: msg.id,
                            from: msg.from || msg.sender?.username || 'Unknown',
                            to: msg.to || (msg.sender?.username === username ? selectedUsername : username),
                            message: msg.message,
                            timestamp: timestamp,
                            status: msg.status,
                            isVoiceMessage: msg.isVoiceMessage,
                            audioUrl: msg.audioUrl,
                            audioDuration: msg.audioDuration,
                            isDeleted: msg.isDeleted,
                            isEdited: msg.isEdited,
                            isPinned: msg.isPinned,
                            replyTo: msg.replyTo ? {
                                id: msg.replyTo.id,
                                from: msg.replyTo.from || msg.replyTo.sender?.username || 'Unknown',
                                message: msg.replyTo.message
                            } : undefined,
                            senderId: msg.senderId
                        };
                    });

                    const unreadCount = formattedMessages.filter((msg: any) =>
                        msg.from === selectedUsername &&
                        msg.status !== 'read' &&
                        msg.status !== 'delivered'
                    ).length;

                    setUnreadCounts(prev => ({
                        ...prev,
                        [selectedUsername]: unreadCount
                    }));

                    setMessages(formattedMessages);
                    if (currentConversation && unreadCounts[selectedUsername] > 0) {
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
                    setMessages([]);
                }
            } else {
                setMessages([]);
            }
        } catch (error) {
            setMessages([]);
        }
    };

    // Load user conversations from API
    const loadConversations = useCallback(async (userId: string) => {
        try {
            const response = await fetch(`/api/conversations?userId=${userId}`);
            if (response.ok) {
                const result = await response.json();
                const conversationsData = result.data || [];
                setConversations(conversationsData);
            } else if (response.status === 401) {
                // 401 Unauthorized - clear session and redirect to login
                handleAuthFailure(router);
            }
        } catch (error) {
            throw error;
        }
    }, [router]);

    useEffect(() => {
        if (selectedUser && username) {
            loadMessages(selectedUser);
        }
    }, [selectedUser, username]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedSession = getClientSessionOptimized();

                if (storedSession) {
                    setUsername(storedSession?.user?.username || '');
                    setCurrentUserId(storedSession?.user?.id || null);
                    setIsLoading(false);
                    setIsConversationsLoading(true);

                    // Load conversations asynchronously to avoid blocking
                    loadConversations(storedSession?.user?.id || '').then(() => {
                        setIsConversationsLoading(false);
                    }).catch((error: any) => {
                        setIsConversationsLoading(false);
                    });

                    // Load failed messages asynchronously
                    setTimeout(() => {
                        const failed = storageHelpers.getFailedMessages() || [];
                        if (failed.length > 0) {
                            setMessages(prev => {
                                const newMessages = failed.filter((fm: Message) => !prev.some(m => m.id === fm.id));
                                return [...prev, ...newMessages];
                            });
                        }
                    }, 100);
                } else {
                    // No session found - clear cookies and localStorage, then redirect to login
                    handleAuthFailure(router);
                    setIsLoading(false);
                    setIsConversationsLoading(false);
                }
            } catch (error) {
                // Error checking auth - clear everything and redirect to login
                handleAuthFailure(router);
                setIsLoading(false);
                setIsConversationsLoading(false);
            }
        };

        checkAuth();

        // Reduced fallback timeout from 3s to 1.5s for faster UX
        const fallbackTimer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(fallbackTimer);
    }, []);

    useEffect(() => {
        const checkSessionChange = async () => {
            try {
                const storedSession = getClientSessionOptimized();
                const currentUsername = storedSession?.username || '';
                const newUserId = storedSession?.user?.id || null;

                if (currentUsername !== username) {
                    if (currentUsername && storedSession) {
                        setUsername(currentUsername);
                        // Only reload conversations if user ID actually changed
                        if (newUserId && newUserId !== currentUserId) {
                            setCurrentUserId(newUserId);
                            loadConversations(newUserId);
                        }
                    } else {
                        router.push('/login');
                    }
                }
            } catch (error) { }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user_data' || e.key === 'session_token') {
                invalidateSessionCache(); // Invalidate cache when storage changes
                checkSessionChange();
            }
        };

        checkSessionChange();

        window.addEventListener('storage', handleStorageChange);

        const interval = setInterval(checkSessionChange, 60000); // Increased from 30s to 60s

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [username, router, currentUserId, loadConversations]);

    const saveFailedMessageLocal = (msg: Message) => {
        try {
            storageHelpers.saveFailedMessage({
                ...msg,
                retryCount: 1,
                lastRetryTime: new Date(),
                status: 'failed'
            });
        } catch (error) { }
    };

    const retryFailedMessages = () => {
        try {
            const failed = storageHelpers.getFailedMessages() || [];
            const now = new Date();

            failed.forEach(async (msg: Message) => {
                const timeSinceLastRetry = msg.lastRetryTime ?
                    now.getTime() - new Date(msg.lastRetryTime).getTime() :
                    now.getTime() - new Date(msg.timestamp).getTime();

                if (timeSinceLastRetry > 30 * 1000) {
                    try {
                        setMessages(prev => prev.map(m =>
                            m.id === msg.id ? { ...m, status: 'sending' } : m
                        ));

                        const cookies = getClientCookies();
                        const userId = (cookies['user-id'] as string) || SecureSession.getUserId();

                        let currentConversation = conversations.find(c =>
                            c.participants.some((p: any) => p.user.username === msg.to)
                        );

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
                                const updatedFailed = failed.filter((m: Message) => m.id !== msg.id);
                                chatStorage.setItem('failed-messages', updatedFailed);

                                setMessages(prev => prev.map(m =>
                                    m.id === msg.id ? { ...m, status: 'sent' } : m
                                ));
                            } else { }
                        } else { }
                    } catch (error) {
                        msg.retryCount = (msg.retryCount || 0) + 1;
                        msg.lastRetryTime = new Date();
                        saveFailedMessageLocal(msg);
                    }
                }
            });
        } catch (error) {
        }
    };

    useEffect(() => {
        if (autoRetryEnabled && isConnected) {
            const interval = setInterval(() => {
                retryFailedMessages();
            }, 10000);
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
        }
    };

    useEffect(() => {
        const failed = storageHelpers.getFailedMessages() || [];
        if (failed.length > 0) {
            setMessages(prev => {
                const newMessages = failed.filter((fm: Message) => !prev.some(m => m.id === fm.id));
                return [...prev, ...newMessages];
            });
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        let isProcessing = false;

        if (isConnected && socketRef.current) {
            const processQueue = async () => {
                if (isProcessing) return;

                const failed: Message[] = storageHelpers.getFailedMessages() || [];
                if (failed.length === 0) return;

                isProcessing = true;

                for (const msg of failed) {
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
                        await new Promise(r => setTimeout(r, 200));
                    } catch (err) {
                    }
                }
                isProcessing = false;
            };
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

        setMessages(prev => [...prev, tempMessage]);

        const timeoutId = setTimeout(() => {
            setMessages(prev => prev.map(m =>
                m.id === tempMessage.id ? {
                    ...m,
                    status: 'failed',
                    retryCount: 1,
                    lastRetryTime: new Date()
                } : m
            ));

            saveFailedMessageLocal({
                ...tempMessage,
                status: 'failed',
                retryCount: 1,
                lastRetryTime: new Date()
            });

            setInputMessage(tempContent);
        }, 10000);

        try {
            const savedMsg = await sendMessage(
                tempContent,
                selectedUser,
                username,
                conversations,
                replyingTo
            );

            clearTimeout(timeoutId);

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
            clearTimeout(timeoutId);
            setMessages(prev => prev.map(m =>
                m.id === tempMessage.id ? {
                    ...m,
                    status: 'failed',
                    retryCount: 1,
                    lastRetryTime: new Date()
                } : m
            ));

            saveFailedMessageLocal({
                ...tempMessage,
                status: 'failed',
                retryCount: 1,
                lastRetryTime: new Date()
            });
            setInputMessage(tempContent);
        }
    };

    const handleUpdateMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMessage || !inputMessage.trim() || !selectedUser) return;

        const tempContent = inputMessage.trim();
        const originalMessage = editingMessage.message;
        
        // Clear editing state immediately for better UX
        setEditingMessage(null);
        setInputMessage('');

        // Optimistic update - update UI immediately
        setMessages(prev => prev.map(msg =>
            msg.id === editingMessage.id
                ? { ...msg, message: tempContent, isEdited: true, editedAt: new Date().toISOString() }
                : msg
        ));

        try {
            const response = await fetch(`/api/messages/${editingMessage.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: tempContent,
                    from: username,
                    to: selectedUser
                }),
            });

            if (response.ok) {
                const updatedMsg = await response.json();
                // Update with server response
                setMessages(prev => prev.map(msg =>
                    msg.id === editingMessage.id
                        ? { ...msg, ...updatedMsg.data }
                        : msg
                ));
            } else {
                // Revert on error
                setMessages(prev => prev.map(msg =>
                    msg.id === editingMessage.id
                        ? { ...msg, message: originalMessage }
                        : msg
                ));
                setEditingMessage(editingMessage);
                setInputMessage(tempContent);
            }

        } catch (error: any) {
            console.error('Failed to update message:', error);
            // Revert on error
            setMessages(prev => prev.map(msg =>
                msg.id === editingMessage.id
                    ? { ...msg, message: originalMessage }
                    : msg
            ));
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
            const savedMsg = await sendVoiceMessage(
                audioBlob,
                duration,
                selectedUser,
                username,
                conversations
            );

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

    useEffect(() => {
        const failedMessages = messages.filter(m => m.status === 'failed');

        if (failedMessages.length >= 2 && isConnected && socketRef.current) {

            failedMessages.forEach((msg, index) => {
                setTimeout(() => {
                    if (msg.id) {
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'pending' } : m));

                        if (isConnected && socketRef.current) {
                            sendMessageInternal(msg);
                        }
                    }
                }, index * 1000);
            });
        }
    }, [messages, isConnected]);

    const handleDeleteMessage = async (id: string, type: 'me' | 'everyone') => {
        try {
            if (type === 'me') {
                setMessages(prev => prev.map(m =>
                    m.id === id ? { ...m, isHidden: true } : m
                ));
            } else {
                setMessages(prev => prev.map(m =>
                    m.id === id ? { ...m, isDeleted: true, message: '', audioUrl: undefined } : m
                ));
                if (socketRef.current && selectedUser) {
                    socketRef.current?.emit('delete-message', { id, to: selectedUser });
                }
            }
        } catch (error) {
        }
    };

    const handlePinMessage = (msg: Message) => {
        const isPinned = !msg.isPinned;

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
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isHidden: true } : m));
    };

    const handleUnhideMessage = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isHidden: false } : m));
    };

    const handleRefreshMessages = () => {
        if (selectedUser) {
            loadMessages(selectedUser);
        }
    };

    const handleRetryMessage = (msg: Message) => {
        setMessages(prev => prev.map(m =>
            m.id === msg.id ? { ...m, status: 'sending' } : m
        ));

        retryFailedMessages();
    };

    const toggleAutoRetry = () => {
        setAutoRetryEnabled(!autoRetryEnabled);
    };

    const handleClearData = () => {
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
            const failed = storageHelpers.getFailedMessages() || [];
            const updatedFailed = failed.filter((m: Message) => m.to !== selectedUser);
            chatStorage.setItem('failed-messages', updatedFailed);
        }
    };

    const handleClearAllMessages = async () => {
        if (!selectedUser || !username) return;

        try {
            let currentConversation = conversations.find(c =>
                c.participants.some((p: any) => p.user.username === selectedUser)
            );

            if (!currentConversation) {
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
                const response = await fetch(`/api/conversations/${currentConversation.id}/messages/delete`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    setMessages([]);
                }
            }
        } catch (error) {
        }
    };

    const handleLogout = async () => {
        try {
            const response = await api.post('/auth/logout');
            if (response) handleClearData();
        } catch (error: any) {
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
            return shouldInclude;
        }
    );

    const pinnedMessages = currentChatMessages.filter(m => m.isPinned);

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
                            setUsername(u);

                            setTimeout(async () => {
                                const cookies = getClientCookies();
                                const userData = SecureSession.getUser();
                                const finalUserId = userId || (cookies['user-id'] as string) || userData.userId;

                                if (finalUserId) {
                                    try {
                                        await loadConversations(finalUserId);
                                    } catch (error) {
                                    }

                                    const failed = storageHelpers.getFailedMessages() || [];
                                    if (failed.length > 0) {
                                        setMessages(prev => {
                                            const newMessages = failed.filter((fm: Message) => !prev.some(m => m.id === fm.id));
                                            return [...prev, ...newMessages];
                                        });
                                    }
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