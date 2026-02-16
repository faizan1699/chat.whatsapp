'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { Pin, ChevronDown, X } from 'lucide-react';
import IncomingCallModal from '@/components/video/IncomingCallModal';
import MessageItem, { Message } from '@/components/chat/MessageItem';
import CallNotification from '@/components/video/CallNotification';
import Sidebar from '@/components/global/Sidebar';
import ResizableSidebar from '@/components/global/ResizableSidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatFooter from '@/components/chat/ChatFooter';
import MessageList from '@/components/chat/MessageList';
import EmptyChatState from '@/components/chat/EmptyChatState';
import CallOverlay from '@/components/video/CallOverlay';
import AuthOverlay from '@/components/global/AuthOverlay';
import EditProfileModal from '@/components/global/EditProfileModal';
import FullPageLoader from '@/components/global/FullPageLoader';
import { apiService } from '@/services/apiService';
import api from '@/utils/api';
import { uploadAudio } from '@/utils/supabase';
import { supabaseAdmin } from '@/utils/supabase-server';
import { parseCookies, getClientCookies } from '@/utils/cookies';
import { useMessageApi } from '@/hooks/useMessageApi';
import { storageHelpers, STORAGE_KEYS, chatStorage } from '@/utils/storage';

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

    // Call States
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

    // Refs
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);
    const callerRef = useRef<string[]>([]);
    const chunkBufferRef = useRef<Record<string, Message[]>>({});

    // Sync refs with state
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        isWindowFocusedRef.current = isWindowFocused;
    }, [isWindowFocused]);

    // Extract unique users from conversations
    const conversationUsers = conversations.reduce((acc: { [key: string]: string }, conv) => {
        conv.participants.forEach((p: any) => {
            if (p.user.username !== username) {
                acc[p.user.username] = p.user.id;
            }
        });
        return acc;
    }, {});

    // Merge online users with conversation users
    const allUsers = { ...conversationUsers, ...users };
    useEffect(() => {
        if (selectedUser) {
            setUnreadCounts(prev => ({
                ...prev,
                [selectedUser]: 0
            }));
        }
    }, [selectedUser]);


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

    // Mark messages as read when focusing or changing user
    useEffect(() => {
        if (selectedUser && isWindowFocused && socketRef.current) {
            // Find messages from this user that are not read
            const unreadMsgs = messages.filter(m => m.from === selectedUser && m.status !== 'read' && m.to === username);

            if (unreadMsgs.length > 0) {
                unreadMsgs.forEach(msg => {
                    if (msg.id) {
                        socketRef.current?.emit('mark-read', { messageId: msg.id, to: msg.from });
                    }
                });

                // Optimistically update local state
                setMessages(prev => prev.map(m =>
                    (m.from === selectedUser && m.to === username && m.status !== 'read') ? { ...m, status: 'read' as const } : m
                ));
            }
        }
    }, [selectedUser, isWindowFocused, messages.length]);


    useEffect(() => {
        // Try to get user session from cookies first
        const cookies = getClientCookies();
        const userData = storageHelpers.getUser();
        const savedUsername = (cookies.username as string) || (userData?.username as string) || '';
        
        if (savedUsername) {
            setUsername(savedUsername);
        } else {
            setIsLoading(false);
        }

        const initSocket = async () => {
            try {
                await fetch('/api/socket');

                const socket = io(undefined, {
                    path: '/api/socket',
                    addTrailingSlash: false,
                    transports: ['polling', 'websocket'],
                    reconnectionAttempts: 5,
                    timeout: 10000,
                });
                socketRef.current = socket;
                socket.on('connect', () => {
                    console.log('Socket connected:', socket.id);
                    setIsConnected(true);
                    if (savedUsername) {
                        socket.emit('join-user', savedUsername);
                    }
                    // Hide loader once socket is connected
                    setIsLoading(false);
                });

                socket.on('joined', (allUsers: User) => {
                    setUsers(allUsers);
                });

                socket.on('receive-message', (data: Message) => {
                    // Don't add own messages - they're already added locally
                    if (data.from === username) return;

                    // Show notification for messages from other users
                    if (!isWindowFocusedRef.current || selectedUserRef.current !== data.from) {
                        showNotification(data);

                        if (selectedUserRef.current !== data.from) {
                            setUnreadCounts(prev => ({
                                ...prev,
                                [data.from]: (prev[data.from] || 0) + 1
                            }));
                        }
                    }

                    // Handle Reassembly Logic before state update
                    let messageToStore: Message | null = data;

                    if (data.groupId && data.totalChunks) {
                        const gid = data.groupId;
                        if (!chunkBufferRef.current[gid]) {
                            chunkBufferRef.current[gid] = [];
                        }

                        // Avoid duplicate chunks
                        const isDuplicate = chunkBufferRef.current[gid].some(c => c.chunkIndex === data.chunkIndex);
                        if (!isDuplicate) {
                            chunkBufferRef.current[gid].push(data);
                        }

                        // Check if complete
                        if (chunkBufferRef.current[gid].length === data.totalChunks) {
                            const sortedChunks = [...chunkBufferRef.current[gid]].sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
                            const fullMessage = sortedChunks.map(m => m.message).join('');

                            messageToStore = {
                                ...sortedChunks[0],
                                id: gid,
                                message: fullMessage,
                                timestamp: new Date(sortedChunks[0].timestamp),
                                status: 'sent' as const
                            };
                            delete chunkBufferRef.current[gid];
                        } else {
                            // Still waiting for chunks
                            messageToStore = null;
                        }
                    } else {
                        // Regular message without chunking metadata
                        messageToStore = { ...data, id: data.groupId || data.id, timestamp: new Date(data.timestamp), status: 'sent' as const };
                    }

                    if (messageToStore) {
                        setMessages((prev) => {
                            if (messageToStore?.id && prev.some(m => m.id === messageToStore?.id)) return prev;
                            return [...prev, messageToStore!];
                        });
                    }

                    // Handle delivery/read status correctly for chunks
                    if (socketRef.current) {
                        // Use groupId if it's a chunk, otherwise id
                        const ackId = (data.groupId && data.totalChunks && data.totalChunks > 1) ? data.groupId : data.id;
                        if (data.from === selectedUserRef.current && isWindowFocusedRef.current) {
                            socketRef.current.emit('mark-read', { messageId: ackId, to: data.from });
                        } else {
                            socketRef.current.emit('mark-delivered', { messageId: ackId, to: data.from });
                        }
                    }
                });

                socket.on('delete-message', ({ id }) => {
                    setMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, message: '', audioUrl: undefined } : m));
                });

                socket.on('pin-message', ({ id, isPinned }) => {
                    setMessages(prev => prev.map(m => m.id === id ? { ...m, isPinned } : m));
                });

                socket.on('message-status-update', ({ messageId, status }) => {
                    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status } : m));
                });

                socket.on('message-edited', ({ id, message }) => {
                    setMessages(prev => prev.map(m => m.id === id ? { ...m, message, isEdited: true } : m));
                });

                socket.on('offer', async ({ from, to, offer, isAudioOnly: incomingIsAudioOnly }) => {
                    console.log('Offer received from:', from, 'audioOnly:', incomingIsAudioOnly);
                    const isAudio = incomingIsAudioOnly === true || incomingIsAudioOnly === 'true';
                    setIncomingCall({ from, to, offer, isAudioOnly: isAudio });
                    setIsAudioOnly(isAudio);
                    setCallParticipant(from);
                    playRingtone();
                });

                socket.on('answer', async ({ from, to, answer }) => {
                    console.log('Answer received');
                    if (peerConnectionRef.current) {
                        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                        processBufferedIceCandidates(peerConnectionRef.current);
                        setConnectionState('connected');
                        setIsCallActive(true);
                    }
                });

                socket.on('icecandidate', async (candidate) => {
                    if (peerConnectionRef.current?.remoteDescription) {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } else {
                        iceCandidatesBuffer.current.push(candidate);
                    }
                });

                socket.on('call-ended', () => {
                    handleEndCallInternal();
                });

                socket.on('call-rejected', () => {
                    setCallNotification({ message: 'Call Rejected', type: 'end' });
                    handleEndCallInternal();
                });

                socket.on('disconnect', (reason) => {
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

        // Safety timeout in case socket fails to connect
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 5000);

        return () => {
            clearTimeout(timer);
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [router]);

    // Load conversations when user is set
    useEffect(() => {
        if (username) {
            const cookies = getClientCookies();
            const userData = storageHelpers.getUser();
            const userId = (cookies['user-id'] as string) || (userData?.userId as string);
            if (userId) {
                loadConversations(userId);
            }
        }
    }, [username]);

    // Also try to reload conversations if messages are empty and user is selected
    useEffect(() => {
        if (selectedUser && username && messages.length === 0) {
            const cookies = getClientCookies();
            const userData = storageHelpers.getUser();
            const userId = (cookies['user-id'] as string) || (userData?.userId as string);
            if (userId) {
                console.log('Messages empty, reloading conversations...');
                loadConversations(userId);
            }
        }
    }, [selectedUser, username, messages]);

    // Load messages when user is selected
    useEffect(() => {
        if (selectedUser && username) {
            loadMessages(selectedUser);
        }
    }, [selectedUser, username, conversations]);

    const loadConversations = async (userId: string) => {
        try {
            const response = await fetch(`/api/conversations?userId=${userId}`);
            if (response.ok) {
                const conversationsData = await response.json();
                setConversations(conversationsData);
                console.log('Loaded conversations:', conversationsData);
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadMessages = async (selectedUsername: string) => {
        console.log('Loading messages for:', selectedUsername);
        console.log('Current conversations:', conversations);
        
        try {
            // First try to find conversation in loaded conversations
            let currentConversation = conversations.find(c =>
                c.participants.some((p: any) => p.user.username === selectedUsername)
            );

            console.log('Found conversation:', currentConversation);

            // If not found, try to get/create conversation directly
            if (!currentConversation) {
                console.log('Conversation not found, trying to create...');
                const cookies = getClientCookies();
                const userId = cookies['user-id'] || storageHelpers.getUser().userId;
                
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
                            currentConversation = await response.json();
                            console.log('Created conversation:', currentConversation);
                            // Add to conversations state
                            setConversations(prev => [...prev, currentConversation]);
                        }
                    }
                }
            }

            if (currentConversation) {
                console.log('Fetching messages for conversation:', currentConversation.id);
                const response = await fetch(`/api/conversations/${currentConversation.id}/messages`);
                if (response.ok) {
                    const messagesData = await response.json();
                    console.log('Raw messages data:', messagesData);
                    
                    // Format messages for frontend
                    const formattedMessages = messagesData.map((msg: any) => ({
                        id: msg.id,
                        from: msg.sender?.username || 'Unknown',
                        to: selectedUsername,
                        message: msg.content,
                        timestamp: msg.timestamp,
                        status: msg.status,
                        isVoiceMessage: msg.is_voice_message,
                        audioUrl: msg.audio_url,
                        audioDuration: msg.audio_duration,
                        isDeleted: msg.is_deleted,
                        isEdited: msg.is_edited,
                        isPinned: msg.is_pinned,
                        replyTo: msg.reply_to,
                        senderId: msg.sender_id
                    }));
                    console.log('Formatted messages:', formattedMessages);
                    setMessages(formattedMessages);
                    console.log('Loaded messages for', selectedUsername, ':', formattedMessages);
                } else {
                    console.error('Failed to load messages:', response.statusText);
                }
            } else {
                console.log('No conversation found for', selectedUsername);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

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
                
                if (timeSinceLastRetry > 5 * 60 * 1000) { // 5 minutes
                    try {
                        // Update status to sending
                        setMessages(prev => prev.map(m => 
                            m.id === msg.id ? { ...m, status: 'sending' } : m
                        ));

                        const response = await fetch('/api/messages', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                conversationId: msg.conversationId,
                                senderId: msg.senderId,
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
            }, 30000); // Retry every 30 seconds
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

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCallActive) {
            interval = setInterval(() => setCallTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isCallActive]);

    // Ringtone Logic
    const playRingtone = () => {
        if (!ringtoneRef.current) {
            ringtoneRef.current = new Audio('/assets/ringtones/ringtone.mp3');
            ringtoneRef.current.loop = true;
        }
        ringtoneRef.current.play().catch(e => console.log('Audio play error:', e));
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

    const PeerConnection: PeerConnectionManager = (() => {
        return {
            getInstance: (stream: MediaStream) => {
                if (peerConnectionRef.current) peerConnectionRef.current.close();

                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });

                stream.getTracks().forEach(track => {
                    console.log(`Adding local track: ${track.kind}, enabled: ${track.enabled}`);
                    pc.addTrack(track, stream);
                });

                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        socketRef.current?.emit('icecandidate', e.candidate);
                    }
                };

                pc.ontrack = (e) => {
                    console.log('Received remote stream:', e.streams[0]);
                    console.log('Track kinds:', e.streams[0]?.getTracks().map(t => t.kind));

                    if (e.streams[0]) {
                        // Set remote video stream state
                        setRemoteStream(e.streams[0]);

                        // Show remote video
                        setShowRemoteVideo(true);

                        // Log for debugging
                        e.streams[0].getTracks().forEach(track => {
                            console.log(`Remote track: ${track.kind}, enabled: ${track.enabled}, state: ${track.readyState}`);
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
        };
    })();

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
            console.error('Media error:', e);
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
            console.error('Accept call error:', e);
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
            retryCount: 0
        };

        // Add to UI immediately with sending status
        setMessages(prev => [...prev, tempMessage]);

        try {
            // Send message using hook
            const savedMsg = await sendMessage(
                tempContent,
                selectedUser,
                username,
                conversations,
                replyingTo
            );

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
                    replyTo: replyingTo?.id || null,
                    groupId: null,
                    chunkIndex: null,
                    totalChunks: null
                });
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            
            // Update message status to failed
            setMessages(prev => prev.map(m => 
                m.id === tempMessage.id ? { 
                    ...m, 
                    status: 'failed',
                    retryCount: 1,
                    lastRetryTime: new Date(),
                    conversationId: null,
                    senderId: null
                } : m
            ));
            
            // Save to localStorage for retry
            saveFailedMessageLocal({
                ...tempMessage,
                status: 'failed',
                retryCount: 1,
                lastRetryTime: new Date(),
                conversationId: null,
                senderId: null
            });
            
            // Restore input message
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

            // Emit to recipient via socket
            if (socketRef.current?.connected) {
                socketRef.current.emit('message-edited', {
                    id: editingMessage.id,
                    message: tempContent,
                    from: username,
                    to: selectedUser
                });
            }

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

    const handleDeleteMessage = (id: string, type: 'me' | 'everyone') => {
        if (type === 'me') {
            setMessages(prev => prev.filter(m => m.id !== id));
        } else {
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, message: '', audioUrl: undefined } : m));
            socketRef.current?.emit('delete-message', { id, to: selectedUser });
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
        storageHelpers.clearUser();
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

    const scrollToMessage = (id: string) => {
        const element = document.getElementById(`msg-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setHighlightedMessageId(id);
            setTimeout(() => setHighlightedMessageId(null), 2000);
        }
        setShowPinsDropdown(false);
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            /* ignore */
        }
        handleClearData();
    };

    const handleProfileUpdated = (newUsername?: string) => {
        if (newUsername) {
            setUsername(newUsername);
            const currentUser = storageHelpers.getUser();
            if (currentUser.userId) {
                storageHelpers.saveUser(newUsername, currentUser.userId);
            }
            socketRef.current?.emit('join-user', newUsername);
        }
    };

    const currentChatMessages = messages.filter(
        (msg) =>
            (msg.from === username && msg.to === selectedUser) ||
            (msg.from === selectedUser && msg.to === username)
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
                        unreadCounts={unreadCounts}
                        onLogout={handleLogout}
                        onEditProfile={() => setShowEditProfile(true)}
                    />
                </ResizableSidebar>

                {/* Main Chat Area */}
                <main className={`flex flex-1 flex-col bg-[#efeae2] relative ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
                    {selectedUser ? (
                        <>
                            <ChatHeader
                                selectedUser={selectedUser}
                                onBack={() => setSelectedUser(null)}
                                onStartVideoCall={() => startCall(false)}
                                onStartAudioCall={() => startCall(true)}
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
                                        <ChevronDown size={18} className={`text-[#667781] transition-transform ${showPinsDropdown ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* Pins Dropdown */}
                                    {showPinsDropdown && (
                                        <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-b border-[#f0f2f5] max-h-[300px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                            {pinnedMessages.slice().reverse().map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className="p-3 border-b border-[#f0f2f5] hover:bg-[#f8f9fa] cursor-pointer"
                                                    onClick={() => {
                                                        setHighlightedMessageId(msg.id || '');
                                                        setShowPinsDropdown(false);
                                                    }}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00a884]/10 text-[#00a884] mt-1">
                                                            <Pin size={12} className="fill-current" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] font-medium text-[#111b21]">{msg.from}</p>
                                                            <p className="text-[14px] text-[#3b4a54] break-words">{msg.message}</p>
                                                            <p className="text-[11px] text-[#8696a0] mt-1">
                                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <MessageList
                                messages={currentChatMessages}
                                username={username}
                                onRetry={handleRetry}
                                onReply={(msg) => setReplyingTo(msg)}
                                onDelete={handleDeleteMessage}
                                onPin={handlePinMessage}
                                onEdit={handleEditMessage}
                                highlightedMessageId={highlightedMessageId}
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
                        </>
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
                    storageHelpers.saveUser(u, userId);
                    socketRef.current?.emit('join-user', u);
                }}
                onClearData={() => {
                    storageHelpers.clearUser();
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
