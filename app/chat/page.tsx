'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { Pin } from 'lucide-react';
import VideoCall from '@/components/VideoCall';
import IncomingCallModal from '@/components/IncomingCallModal';
import MessageItem, { Message } from '@/components/MessageItem';
import CallNotification from '@/components/CallNotification';
import Sidebar from '@/components/Sidebar';
import ResizableSidebar from '@/components/ResizableSidebar';
import ChatHeader from '@/components/ChatHeader';
import ChatFooter from '@/components/ChatFooter';
import MessageList from '@/components/MessageList';
import EmptyChatState from '@/components/EmptyChatState';
import CallOverlay from '@/components/CallOverlay';
import AuthOverlay from '@/components/AuthOverlay';

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
    const [users, setUsers] = useState<User>({});
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const selectedUserRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const [isWindowFocused, setIsWindowFocused] = useState(true);
    const isWindowFocusedRef = useRef(true);

    // Call States
    const [isCallActive, setIsCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState<{ from: string; to: string; offer: RTCSessionDescriptionInit; isAudioOnly?: boolean } | null>(null);
    const [showEndCallButton, setShowEndCallButton] = useState(false);
    const [showRemoteVideo, setShowRemoteVideo] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [callTimer, setCallTimer] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const [callNotification, setCallNotification] = useState<{ message: string; type: 'start' | 'end' } | null>(null);
    const [isAudioOnly, setIsAudioOnly] = useState(false);
    const [callParticipant, setCallParticipant] = useState<string>('');
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});

    // Refs
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);
    const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);
    const callerRef = useRef<string[]>([]);

    // Sync refs with state
    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    useEffect(() => {
        isWindowFocusedRef.current = isWindowFocused;
    }, [isWindowFocused]);

    // Clear unread counts when user is selected
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


    useEffect(() => {
        const savedUsername = localStorage.getItem('webrtc-username');
        if (savedUsername) {
            setUsername(savedUsername);
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
                });

                socket.on('joined', (allUsers: User) => {
                    setUsers(allUsers);
                });

                socket.on('receive-message', (data: Message) => {
                    if (data.from !== savedUsername) {
                        if (!isWindowFocusedRef.current || selectedUserRef.current !== data.from) {
                            showNotification(data);

                            // Increment unread count if chat is not open or window not focused
                            if (selectedUserRef.current !== data.from) {
                                setUnreadCounts(prev => ({
                                    ...prev,
                                    [data.from]: (prev[data.from] || 0) + 1
                                }));
                            }
                        }
                    }

                    setMessages((prev) => {
                        if (data.id && prev.some(m => m.id === data.id)) return prev;
                        return [...prev, { ...data, timestamp: new Date(data.timestamp), status: 'sent' }];
                    });
                });

                socket.on('delete-message', ({ id }) => {
                    setMessages(prev => prev.filter(m => m.id !== id));
                });

                socket.on('pin-message', ({ id, isPinned }) => {
                    setMessages(prev => prev.map(m => m.id === id ? { ...m, isPinned } : m));
                });

                socket.on('offer', async ({ from, to, offer, isAudioOnly: incomingIsAudioOnly }) => {
                    console.log('Offer received from:', from);
                    setIncomingCall({ from, to, offer, isAudioOnly: incomingIsAudioOnly });
                    setIsAudioOnly(!!incomingIsAudioOnly);
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

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [router]);

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
            } else {
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
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

                stream.getTracks().forEach(track => pc.addTrack(track, stream));

                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        socketRef.current?.emit('icecandidate', e.candidate);
                    }
                };

                pc.ontrack = (e) => {
                    if (remoteVideoRef.current && e.streams[0]) {
                        remoteVideoRef.current.srcObject = e.streams[0];
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
                video: !isAudio,
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

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: !incomingCall.isAudioOnly,
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

            setIsCallActive(true);
            setShowRemoteVideo(!incomingCall.isAudioOnly);
            setShowEndCallButton(true);
            setIncomingCall(null);
            setConnectionState('connected');
        } catch (e) {
            console.error('Accept call error:', e);
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
            status: 'pending',
            replyTo: replyingTo || undefined
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputMessage('');
        setReplyingTo(null);

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

    const handleDeleteMessage = (id: string) => {
        if (!confirm('Delete this message?')) return;
        setMessages(prev => prev.filter(m => m.id !== id));
        socketRef.current?.emit('delete-message', { id, to: selectedUser });
    };

    const handlePinMessage = (msg: Message) => {
        const isPinned = !msg.isPinned;
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned } : m));
        socketRef.current?.emit('pin-message', { id: msg.id, isPinned, to: selectedUser });
    };

    const handleClearData = () => {
        localStorage.removeItem('webrtc-username');
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

    const currentChatMessages = messages.filter(
        (msg) =>
            (msg.from === username && msg.to === selectedUser) ||
            (msg.from === selectedUser && msg.to === username)
    );

    const pinnedMessages = currentChatMessages.filter(m => m.isPinned);

    return (
        <div className="min-h-screen h-screen flex bg-[#f0f2f5] md:p-4 font-sans">
            <div className="relative flex h-full w-full bg-white shadow-2xl md:rounded-sm">

                <ResizableSidebar selectedUser={selectedUser}>
                    <Sidebar
                        username={username}
                        users={users}
                        selectedUser={selectedUser}
                        setSelectedUser={setSelectedUser}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        messages={messages}
                        unreadCounts={unreadCounts}
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
                                <div className="z-20 bg-white/90 backdrop-blur px-4 py-2 border-b border-[#f0f2f5] flex items-center gap-2 shadow-sm animate-in fade-in duration-300">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884]/10 text-[#00a884]">
                                        <Pin size={16} className="fill-current" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[12px] font-bold text-[#00a884]">Pinned Message</p>
                                        <p className="text-[13px] text-[#54656f] truncate">
                                            {pinnedMessages[pinnedMessages.length - 1].message}
                                        </p>
                                    </div>
                                    <span className="text-[10px] bg-[#f0f2f5] px-1.5 py-0.5 rounded text-[#667781] font-bold">
                                        {pinnedMessages.length}
                                    </span>
                                </div>
                            )}

                            <MessageList
                                messages={currentChatMessages}
                                username={username}
                                onRetry={handleRetry}
                                onReply={(msg) => setReplyingTo(msg)}
                                onDelete={handleDeleteMessage}
                                onPin={handlePinMessage}
                            />

                            <ChatFooter
                                inputMessage={inputMessage}
                                setInputMessage={setInputMessage}
                                onSendMessage={handleSendMessage}
                                replyingTo={replyingTo}
                                onCancelReply={() => setReplyingTo(null)}
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
                onUsernameCreated={(u) => {
                    setUsername(u);
                    localStorage.setItem('webrtc-username', u);
                    socketRef.current?.emit('join-user', u);
                }}
                onClearData={() => {
                    localStorage.removeItem('webrtc-username');
                    setUsername('');
                }}
            />
        </div>
    );
}
