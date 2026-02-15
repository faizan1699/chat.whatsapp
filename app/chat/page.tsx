'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { Pin, ChevronDown } from 'lucide-react';
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
import FullPageLoader from '@/components/FullPageLoader';

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
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<Socket | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showPinsDropdown, setShowPinsDropdown] = useState<boolean>(false);

    const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
    const isWindowFocusedRef = useRef(true);

    // Call States
    const [isCallActive, setIsCallActive] = useState<boolean>(false);
    const [incomingCall, setIncomingCall] = useState<{ from: string; to: string; offer: RTCSessionDescriptionInit; isAudioOnly?: boolean } | null>(null);
    const [showEndCallButton, setShowEndCallButton] = useState<boolean>(false);
    const [showRemoteVideo, setShowRemoteVideo] = useState<boolean>(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [callTimer, setCallTimer] = useState(0);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const [callNotification, setCallNotification] = useState<{ message: string; type: 'start' | 'end' } | null>(null);
    const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);
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
                });

                socket.on('joined', (allUsers: User) => {
                    setUsers(allUsers);
                });

                socket.on('receive-message', (data: Message) => {
                    if (data.from !== savedUsername) {
                        if (!isWindowFocusedRef.current || selectedUserRef.current !== data.from) {
                            showNotification(data);

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

        let timer: NodeJS.Timeout;
        if (savedUsername) {
            timer = setTimeout(() => {
                setIsLoading(false);
            }, 2000);
        }

        return () => {
            if (timer) clearTimeout(timer);
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
            console.log('Socket not connected, message will be sent when reconnected');
        }
    };

    const handleSendVoice = async (audioBlob: Blob, duration: number) => {
        if (!selectedUser) {
            console.log('Cannot send voice: no user selected');
            return;
        }

        // Convert blob to base64 for transmission
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Audio = reader.result as string;

            const newVoiceMessage: Message = {
                id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
                from: username,
                to: selectedUser,
                message: '🎤 Voice message',
                timestamp: new Date(),
                status: 'pending',
                isVoiceMessage: true,
                audioUrl: base64Audio,
                audioDuration: duration,
                replyTo: replyingTo || undefined
            };

            setMessages((prev) => [...prev, newVoiceMessage]);
            setReplyingTo(null);

            if (socketRef.current?.connected) {
                sendMessageInternal(newVoiceMessage);
            } else {
                console.log('Socket not connected, voice message will be sent when reconnected');
            }
        };
        reader.readAsDataURL(audioBlob);
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

    const scrollToMessage = (id: string) => {
        const element = document.getElementById(`msg-${id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Brief highlight effect
            const container = element.querySelector('.flex.flex-col');
            if (container) {
                container.classList.add('ring-4', 'ring-[#00a884]/30');
                setTimeout(() => container.classList.remove('ring-4', 'ring-[#00a884]/30'), 1500);
            }
        }
        setShowPinsDropdown(false);
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

    if (isLoading) {
        return <FullPageLoader />;
    }

    return (
        <div className="min-h-[100dvh] h-[100dvh] flex bg-[#f0f2f5] md:p-4 font-sans">
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
                                                    onClick={() => scrollToMessage(msg.id!)}
                                                    className="px-4 py-3 border-b border-[#f0f2f5] last:border-0 hover:bg-[#f8f9fa] cursor-pointer flex flex-col gap-0.5"
                                                >
                                                    <span className="text-[11px] font-bold text-[#00a884]">
                                                        {msg.from === username ? 'You' : msg.from}
                                                    </span>
                                                    <p className="text-[13px] text-[#111b21] line-clamp-2">
                                                        {msg.message}
                                                    </p>
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
                            />

                            <ChatFooter
                                inputMessage={inputMessage}
                                setInputMessage={setInputMessage}
                                onSendMessage={handleSendMessage}
                                onSendVoice={handleSendVoice}
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
