'use client';

import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { Pin, ChevronDown, X, PinOff } from 'lucide-react';
import { frontendAuth } from '@/utils/frontendAuth';
import IncomingCallModal from '@/components/video/IncomingCallModal';
import { Message } from '@/types/message';
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
import { useNotifications } from '@/hooks/useNotifications';
import { storageHelpers, chatStorage } from '@/utils/storage';
import { supabaseAdmin } from '@/utils/supabase-server';
import api from '@/utils/api';
import ChatFooter from '@/components/chat/ChatFooter';
import EmptyChatState from '@/components/chat/EmptyChatState';
import CallOverlay from '@/components/video/CallOverlay';
import MessageList from '@/components/chat/MessageList';
import ChatHeader from '@/components/chat/ChatHeader';

interface User {
    [key: string]: string;
}

interface PeerConnectionManager {
    getInstance: (stream: MediaStream) => RTCPeerConnection;
    reset: () => void;
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
    const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);

    const {
        sendMessage,
        sendVoiceMessage,
        loading: messageLoading,
        error: messageError
    } = useMessageApi();

    const { showNotification: showNotificationMessage, permission: notificationPermission } = useNotifications();

    const [isCallActive, setIsCallActive] = useState<boolean>(false);
    const [incomingCall, setIncomingCall] = useState<{ from: string; to: string; offer: RTCSessionDescriptionInit; isAudioOnly?: boolean } | null>(null);
    const [showEndCallButton, setShowEndCallButton] = useState<boolean>(false);
    const [showRemoteVideo, setShowRemoteVideo] = useState<boolean>(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callTimer, setCallTimer] = useState(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const [callNotification, setCallNotification] = useState<{ message: string; type: 'start' | 'end' } | null>(null);
    const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);
    const [callParticipant, setCallParticipant] = useState<string>('');
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [lastReceivedMessage, setLastReceivedMessage] = useState<Message | null>(null);

    useEffect(() => {
        if (highlightedMessageId) {
            const timer = setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [highlightedMessageId]);

    // Refs
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);
    const callerRef = useRef<string[]>([]);
    const chunkBufferRef = useRef<Record<string, Message[]>>({});
    const pinsDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pinsDropdownRef.current && !pinsDropdownRef.current.contains(event.target as Node)) {
                setShowPinsDropdown(false);
            }
        };

        if (showPinsDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPinsDropdown]);

    useEffect(() => {
        isWindowFocusedRef.current = isWindowFocused;
    }, [isWindowFocused]);

    const conversationUsers = conversations.reduce((acc: { [key: string]: string }, conv) => {
        conv.participants.forEach((p: any) => {
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

    const socket = useSocket();

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

            setConversations(prev => {
                return prev.map(conv => {
                    const involvesSender = conv.participants.some((p: any) =>
                        p.user.username === data.from || p.user.username === data.to
                    );

                    if (involvesSender) {
                        return {
                            ...conv,
                            messages: [data],
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return conv;
                });
            });

            setLastReceivedMessage(data);

            if (data.from !== username && data.to === username) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.from]: (prev[data.from] || 0) + 1
                }));

                if (selectedUser !== data.from) {
                    showNotificationMessage(data, username, selectedUser);
                }
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

        socket.on('offer', (payload) => {
            setIncomingCall({
                from: payload.from,
                to: payload.to,
                offer: payload.offer,
                isAudioOnly: payload.isAudioOnly
            });
            playRingtone();
        });

        socket.on('answer', (payload) => {
        });

        socket.on('icecandidate', (candidate) => {
        });

        socket.on('call-ended', () => {
            handleEndCallInternal();
        });

        socket.on('call-rejected', (payload) => {
            stopRingtone();
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
    }, [socket, username]);

    useEffect(() => {
        const requestNotificationPermission = async () => {
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    try {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                        } else if (permission === 'denied') {
                        }
                    } catch (error) {
                    }
                } else {
                }
            } else {
            }
        };

        requestNotificationPermission();

        const handleFocus = () => {
            setIsWindowFocused(true);
        };
        const handleBlur = () => {
            setIsWindowFocused(false);
        };

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
            setIsMessagesLoading(true);

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
                            currentConversation = await response.json();
                            setConversations(prev => [...prev, currentConversation]);
                        }
                    }
                }
            }

            if (currentConversation) {
                const token = frontendAuth.getAccessToken();
                const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const messagesData = await response.json();

                    const cookies = getClientCookies();
                    const currentUserId = cookies['user-id'] || SecureSession.getUserId();
                    const formattedMessages = messagesData.map((msg: any) => {
                        const isHidden = msg.hidden_by && Array.isArray(msg.hidden_by) && currentUserId && msg.hidden_by.includes(currentUserId);

                        return {
                            id: msg.id,
                            from: msg.sender?.username || 'Unknown',
                            to: msg.sender?.username === username ? selectedUsername : username,
                            message: msg.deleted_by ? '[This message was deleted]' : msg.content,
                            timestamp: msg.timestamp,
                            status: msg.status,
                            isVoiceMessage: msg.is_voice_message,
                            audioUrl: msg.audio_url,
                            audioDuration: msg.audio_duration,
                            isDeleted: !!msg.deleted_by,
                            isEdited: msg.is_edited,
                            isPinned: msg.is_pinned,
                            isHidden: isHidden,
                            replyTo: msg.reply_to ? {
                                id: msg.reply_to.id,
                                from: msg.reply_to.sender?.username || 'Unknown',
                                message: msg.reply_to.content || msg.reply_to.message
                            } : undefined,
                            senderId: msg.sender_id
                        };
                    }).filter((msg: any) => !msg.isHidden);

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
        } finally {
            setIsMessagesLoading(false);
        }
    };

    useEffect(() => {
        if (selectedUser && username) {
            loadMessages(selectedUser);
        }
    }, [selectedUser, username]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedSession = frontendAuth.getSession();

                if (storedSession) {
                    setUsername(storedSession.user.username);
                    setIsLoading(false);
                    setIsConversationsLoading(true);
                    loadConversations(storedSession.user.id).then(() => {
                        setIsConversationsLoading(false);
                    }).catch((error: any) => {
                        setIsConversationsLoading(false);
                    });
                    const failed = storageHelpers.getFailedMessages() || [];
                    if (failed.length > 0) {
                        setMessages(prev => {
                            const newMessages = failed.filter((fm: Message) => !prev.some(m => m.id === fm.id));
                            return [...prev, ...newMessages];
                        });
                    }
                } else {
                    setIsLoading(false);
                    setIsConversationsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
                setIsConversationsLoading(false);
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        const checkSessionChange = () => {
            try {
                const storedSession = frontendAuth.getSession();
                const currentUsername = storedSession?.user?.username || '';

                if (currentUsername !== username) {
                    if (currentUsername && storedSession) {
                        setUsername(currentUsername);
                        if (storedSession.user.id) {
                            loadConversations(storedSession.user.id);
                        }
                    } else {
                        router.push('/login');
                    }
                }
            } catch (error) {
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user_data' || e.key === 'session_token') {
                checkSessionChange();
            }
        };

        checkSessionChange();

        window.addEventListener('storage', handleStorageChange);

        const interval = setInterval(checkSessionChange, 30000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [username, router]);

    const saveFailedMessageLocal = (msg: Message) => {
        try {
            storageHelpers.saveFailedMessage({
                ...msg,
                retryCount: 1,
                lastRetryTime: new Date(),
                status: 'failed'
            });
        } catch (error) {
        }
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

                        const session = frontendAuth.getSession();
                        const userId = session?.user?.id;

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
                                    currentConversation = await response.json();
                                    setConversations(prev => [...prev, currentConversation]);
                                }
                            }
                        }

                        if (currentConversation && userId) {
                            const token = frontendAuth.getAccessToken();
                            const response = await fetch('/api/messages', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
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
                            } else {
                                throw new Error('Failed to send message');
                            }
                        } else {
                        }
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

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCallActive) {
            interval = setInterval(() => setCallTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isCallActive]);

    const playRingtone = () => {
        if (!ringtoneRef.current) {
            ringtoneRef.current = new Audio('/assets/ringtones/ringtone.mp3');
            ringtoneRef.current.loop = true;
        }
        ringtoneRef.current.play().catch(e => { });
    };

    const stopRingtone = () => {
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    };

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

    const PeerConnection: PeerConnectionManager = useMemo(() => ({
        getInstance: (stream: MediaStream) => {
            if (peerConnectionRef.current) peerConnectionRef.current.close();

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socketRef.current?.emit('icecandidate', e.candidate);
                }
            };

            pc.ontrack = (e) => {
                if (e.streams[0]) {
                    setRemoteStream(e.streams[0]);
                    setShowRemoteVideo(true);
                    e.streams[0].getTracks().forEach(track => {
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') setConnectionState('connected');
            };

            peerConnectionRef.current = pc;
            return pc;
        },
        reset: () => {
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
        }
    }), []);

    const startCall = async (isAudio: boolean) => {
        if (!selectedUser) return;
        setIsAudioOnly(isAudio);
        setCallParticipant(selectedUser);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isAudio ? false : true,
                audio: true
            });
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = PeerConnection.getInstance(stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketRef.current?.emit('offer', {
                from: username,
                to: selectedUser,
                offer,
                isAudioOnly: isAudio
            });

            callerRef.current = [username, selectedUser];
            setShowEndCallButton(true);
            setIsCallActive(true);
            setConnectionState('connecting');
        } catch (e) {
            alert('Could not access camera/mic');
        }
    };

    const handleAcceptCall = async () => {
        if (!incomingCall) return;
        stopRingtone();

        const isAudioCall = incomingCall.isAudioOnly === true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: !isAudioCall,
                audio: true
            });
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = PeerConnection.getInstance(stream);
            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
            processBufferedIceCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketRef.current?.emit('answer', {
                from: username,
                to: incomingCall.from,
                answer
            });

            setIsAudioOnly(isAudioCall);
            setIsCallActive(true);
            setShowRemoteVideo(!isAudioCall);
            setShowEndCallButton(true);
            setIncomingCall(null);
            setCallParticipant(incomingCall.from);
            setConnectionState('connected');
        } catch (e) {
            alert('Could not accept call: ' + (e as Error).message);
        }
    };

    const handleRejectCall = () => {
        if (!incomingCall) return;
        stopRingtone();
        socketRef.current?.emit('call-rejected', { from: username, to: incomingCall.from });
        setIncomingCall(null);
    };

    const handleEndCallRequest = () => {
        const otherUser = callerRef.current.find(u => u !== username) || selectedUser || callParticipant;
        if (otherUser) {
            socketRef.current?.emit('call-ended', { from: username, to: otherUser });
        }
        handleEndCallInternal();
    };

    const handleEndCallInternal = () => {
        PeerConnection.reset();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsCallActive(false);
        setShowEndCallButton(false);
        setShowRemoteVideo(false);
        setCallTimer(0);
        setCallParticipant('');
        setConnectionState('disconnected');
        stopRingtone();
    };

    const processBufferedIceCandidates = async (pc: RTCPeerConnection) => {
        while (iceCandidatesBuffer.current.length > 0) {
            const candidate = iceCandidatesBuffer.current.shift();
            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
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
                    status: 'sent',
                    replyToMessageId: replyingTo?.id
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
                    totalChunks: null,
                    replyToMessageId: replyingTo?.id
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
        setEditingMessage(null);
        setInputMessage('');

        try {
            const session = frontendAuth.getSession();
            const userId = session?.user?.id;
            let token = frontendAuth.getAccessToken();

            if (!userId) {
                throw new Error('User not authenticated');
            }

            const response = await fetch('/api/messages', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messageId: editingMessage.id,
                    content: tempContent,
                    from: userId,
                    to: selectedUser
                }),
            });

            if (response.status === 401) {
                const refreshed = await frontendAuth.refreshSession();
                if (refreshed) {
                    token = frontendAuth.getAccessToken();
                    const retryResponse = await fetch('/api/messages', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            messageId: editingMessage.id,
                            content: tempContent,
                            from: userId,
                            to: selectedUser
                        }),
                    });

                    if (!retryResponse.ok) {
                        throw new Error('Failed to update message after token refresh');
                    }
                } else {
                    throw new Error('Session expired, please login again');
                }
            } else if (!response.ok) {
                throw new Error('Failed to update message');
            }
        } catch (error) {
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
                    replyTo: replyingTo ? {
                        id: replyingTo.id,
                        from: replyingTo.from,
                        message: replyingTo.message
                    } : undefined,
                    groupId: null,
                    chunkIndex: null,
                    totalChunks: null,
                    replyToMessageId: replyingTo?.id
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
                }, index * 5000);
            });
        }
    }, [messages, isConnected]);

    const handleDeleteMessage = async (id: string, type: 'me' | 'everyone') => {
        try {
            const session = frontendAuth.getSession();
            const user = frontendAuth.getUser();

            if (!session || !user) {
                alert('User not authenticated');
                return;
            }

            if (type === 'me') {
                try {
                    const response = await fetch(`/api/messages/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.accessToken}`,
                        },
                        body: JSON.stringify({
                            type: 'me',
                            userId: user.id
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to hide message');
                    }

                    setMessages(prev => prev.filter(m => m.id !== id));
                } catch (apiError) {
                    alert('Failed to hide message. Please try again.');
                    return;
                }

            } else {
                setMessages(prev => prev.map(m =>
                    m.id === id ? { ...m, isDeleted: true, message: '[This message was deleted]', audioUrl: undefined } : m
                ));

                try {
                    const response = await fetch(`/api/messages/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.accessToken}`,
                        },
                        body: JSON.stringify({
                            type: 'everyone',
                            userId: user.id
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to delete message from server');
                    }

                } catch (apiError) {
                    setMessages(prev => prev.map(m =>
                        m.id === id ? { ...m, isDeleted: false, message: m.message, audioUrl: m.audioUrl } : m
                    ));
                    alert('Failed to delete message. Please try again.');
                    return;
                }

                if (socketRef.current && selectedUser) {
                    socketRef.current?.emit('delete-message', { id, to: selectedUser });
                }
            }
        } catch (error) {
            alert('Failed to delete message. Please try again.');
        }
    };

    const handlePinMessage = (msg: Message) => {
        const isPinned = !msg.isPinned;
        const currentPins = messages.filter(m =>
            m.isPinned &&
            ((m.from === username && m.to === selectedUser) || (m.from === selectedUser && m.to === username))
        );

        if (isPinned && currentPins.length >= 3) {
            alert('Only 3 messages allowed to pin');
            return;
        }

        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned } : m));
        socketRef.current?.emit('pin-message', { id: msg.id, isPinned, to: selectedUser });
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
                            currentConversation = await response.json();
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
                    const failed = storageHelpers.getFailedMessages() || [];
                    const updatedFailed = failed.filter((m: Message) => m.to !== selectedUser);
                    chatStorage.setItem('failed-messages', updatedFailed);

                    if (socketRef.current?.connected) {
                        socketRef.current.emit('clear-all-messages', {
                            from: username,
                            to: selectedUser,
                            conversationId: currentConversation.id
                        });
                    }

                } else {
                    throw new Error('Failed to delete messages');
                }
            }
        } catch (error) {
            alert('Failed to delete messages. Please try again.');
        }
    };

    const loadConversations = async (userId: string) => {
        try {
            const response = await fetch(`/api/conversations?userId=${userId}`);
            if (response.ok) {
                const conversationsData = await response.json();
                setConversations(conversationsData);
            } else {
            }
        } catch (error) {
            throw error;
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
        }
        handleClearData();
    };

    const handleProfileUpdated = (newUsername?: string) => {
        if (newUsername) {
            setUsername(newUsername);
        }
    };

    const handleScrollToMessage = (messageId: string | undefined) => {
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight-message-reply');
            setTimeout(() => {
                messageElement.classList.remove('highlight-message-reply');
            }, 2000);
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

    if (isLoading) {
        return <FullPageLoader />;
    }

    return (
        <div className="min-h-[100dvh] h-[100dvh] flex bg-[#f0f2f5] md:p-4 font-sans">
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
                                onStartVideoCall={() => startCall(false)}
                                onStartAudioCall={() => startCall(true)}
                                onClearChat={handleClearChat}
                                onClearAllMessages={handleClearAllMessages}
                                onRefreshMessages={handleRefreshMessages}
                            />

                            {pinnedMessages.length > 0 && (
                                <div className="relative z-30" ref={pinsDropdownRef}>
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
                                        </div>
                                        <ChevronDown size={18} className={`text-[#667781] transition-transform ${showPinsDropdown ? 'rotate-180' : ''}`} />
                                    </div>

                                    {showPinsDropdown && (
                                        <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-b border-[#f0f2f5] max-h-[300px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                            {pinnedMessages.slice().reverse().map((msg, index) => {
                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className="px-3 py-1 border-b border-[#f0f2f5] hover:bg-[#f8f9fa] cursor-pointer relative group"
                                                        onClick={() => {
                                                            setHighlightedMessageId(msg.id || '');
                                                            setShowPinsDropdown(false);
                                                            if (msg.id) {
                                                                setTimeout(() => {
                                                                    handleScrollToMessage(msg?.id);
                                                                }, 100);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00a884]/10 text-[#00a884] mt-1">
                                                                <Pin size={12} className="fill-current" />
                                                            </div>
                                                            <div className="flex flex-wrap min-w-0">
                                                                <p className="text-[13px] font-medium text-[#111b21]">{msg.from ? `${msg.from} : ` : ''}</p>
                                                                <p className="text-[14px] text-[#3b4a54] break-words ml-1">{msg.message}</p>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePinMessage(msg);
                                                                }}
                                                                className="bg-red-200/50 transition-opacity p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors absolute right-2 top-2"
                                                                title="Unpin message"
                                                            >
                                                                <PinOff size={14} color='red' />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <MessageList
                                messages={currentChatMessages}
                                username={username}
                                selectedUser={selectedUser}
                                recipientOnline={!!users[selectedUser]}
                                isLoading={isMessagesLoading}
                                onRetry={handleRetry}
                                onReply={(msg: Message) => setReplyingTo(msg)}
                                onDelete={handleDeleteMessage}
                                onPin={handlePinMessage}
                                onEdit={handleEditMessage}
                                highlightedMessageId={highlightedMessageId}
                                onScrollToMessage={handleScrollToMessage}
                            />

                            <ChatFooter
                                inputMessage={inputMessage}
                                setInputMessage={setInputMessage}
                                onSendMessage={handleSendMessage}
                                onSendVoice={handleSendVoice}
                                onUpdateMessage={handleUpdateMessage}
                                replyingTo={replyingTo}
                                editingMessage={editingMessage}
                                onCancelReply={() => setReplyingTo(null)}
                                onCancelEdit={handleCancelEdit}
                            />
                        </Fragment>
                    ) : (
                        <EmptyChatState />
                    )}
                </main>
            </div>

            <CallOverlay
                username={username}
                remoteUser={callParticipant}
                isCallActive={isCallActive}
                onEndCall={handleEndCallRequest}
                callNotification={callNotification}
                remoteStream={remoteStream}
                remoteVideoRef={remoteVideoRef}
                isAudioOnly={isAudioOnly}
                localStream={localStream}
                callTimer={callTimer}
                connectionState={connectionState}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                onClearData={handleClearData}
            />

            {incomingCall && (
                <IncomingCallModal
                    from={incomingCall.from}
                    isAudioOnly={incomingCall.isAudioOnly}
                    onAccept={handleAcceptCall}
                    onReject={handleRejectCall}
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
                        } else {
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
    );
}
