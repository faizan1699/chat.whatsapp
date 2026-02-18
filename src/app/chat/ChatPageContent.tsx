'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pin, ChevronDown, X } from 'lucide-react';
import { frontendAuth } from '@/utils/frontendAuth';
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
import { useRouteChangeConversations } from '@/hooks/useRouteChangeConversations';
import { useApiHook } from '@/hooks/useApiHook';
import { storageHelpers, STORAGE_KEYS, chatStorage } from '@/utils/storage';
import { uploadAudio } from '@/utils/supabase';
import api from '@/utils/api';
import ChatFooter from '@/components/chat/ChatFooter';
import EmptyChatState from '@/components/chat/EmptyChatState';
import CallOverlay from '@/components/video/CallOverlay';
import MessageList from '@/components/chat/MessageList';
import ChatHeader from '@/components/chat/ChatHeader';
import { chatToast, toast, authToast } from '@/utils/toast';
import { hasCookieAcceptance } from '@/utils/cookieConsent';
import { conversationsManager } from '@/utils/conversationsManager';
import { supabaseAdmin } from '@/utils/supabase-server';

interface User {
    [key: string]: string;
}

interface PeerConnectionManager {
    getInstance: (stream: MediaStream) => RTCPeerConnection;
    reset: () => void;
}

export default function ChatPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Rest of the original component code...
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
    const [editingMessage, setEditingMessage] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [activeCall, setActiveCall] = useState<any>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [showAuthOverlay, setShowAuthOverlay] = useState(false);
    const [callNotification, setCallNotification] = useState<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPip, setIsPip] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [screenShare, setScreenShare] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [showPin, setShowPin] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
    const [showMessageOptions, setShowMessageOptions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [showStarModal, setShowStarModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowShowTermsModal] = useState(false);
    const [showCookieModal, setShowCookieModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showMuteModal, setShowMuteModal] = useState(false);
    const [showUnmuteModal, setShowUnmuteModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
    const [showClearChatModal, setShowClearChatModal] = useState(false);
    const [showExportChatModal, setShowExportChatModal] = useState(false);
    const [showArchiveChatModal, setShowArchiveChatModal] = useState(false);
    const [showUnarchiveChatModal, setShowUnarchiveChatModal] = useState(false);
    const [showPinChatModal, setShowPinChatModal] = useState(false);
    const [showUnpinChatModal, setShowUnpinChatModal] = useState(false);
    const [showMuteChatModal, setShowMuteChatModal] = useState(false);
    const [showUnmuteChatModal, setShowUnmuteChatModal] = useState(false);
    const [showSearchChatModal, setShowSearchChatModal] = useState(false);
    const [showFilterChatModal, setShowFilterChatModal] = useState(false);
    const [showSortChatModal, setShowSortChatModal] = useState(false);
    const [showViewChatModal, setShowViewChatModal] = useState(false);
    const [showEditChatModal, setShowEditChatModal] = useState(false);
    const [showDeleteChatConfirmModal, setShowDeleteChatConfirmModal] = useState(false);
    const [showClearChatConfirmModal, setShowClearChatConfirmModal] = useState(false);
    const [showExportChatConfirmModal, setShowExportChatConfirmModal] = useState(false);
    const [showArchiveChatConfirmModal, setShowArchiveChatConfirmModal] = useState(false);
    const [showUnarchiveChatConfirmModal, setShowUnarchiveChatConfirmModal] = useState(false);
    const [showPinChatConfirmModal, setShowPinChatConfirmModal] = useState(false);
    const [showUnpinChatConfirmModal, setShowUnpinChatConfirmModal] = useState(false);
    const [showMuteChatConfirmModal, setShowMuteChatConfirmModal] = useState(false);
    const [showUnmuteChatConfirmModal, setShowUnmuteChatConfirmModal] = useState(false);
    const [showSearchChatConfirmModal, setShowSearchChatConfirmModal] = useState(false);
    const [showFilterChatConfirmModal, setShowFilterChatConfirmModal] = useState(false);
    const [showSortChatConfirmModal, setShowSortChatConfirmModal] = useState(false);
    const [showViewChatConfirmModal, setShowViewChatConfirmModal] = useState(false);
    const [showEditChatConfirmModal, setShowEditChatConfirmModal] = useState(false);
    const [showDeleteChatConfirmModal2, setShowDeleteChatConfirmModal2] = useState(false);
    const [showClearChatConfirmModal2, setShowClearChatConfirmModal2] = useState(false);
    const [showExportChatConfirmModal2, setShowExportChatConfirmModal2] = useState(false);
    const [showArchiveChatConfirmModal2, setShowArchiveChatConfirmModal2] = useState(false);
    const [showUnarchiveChatConfirmModal2, setShowUnarchiveChatConfirmModal2] = useState(false);
    const [showPinChatConfirmModal2, setShowPinChatConfirmModal2] = useState(false);
    const [showUnpinChatConfirmModal2, setShowUnpinChatConfirmModal2] = useState(false);
    const [showMuteChatConfirmModal2, setShowMuteChatConfirmModal2] = useState(false);
    const [showUnmuteChatConfirmModal2, setShowUnmuteChatConfirmModal2] = useState(false);
    const [showSearchChatConfirmModal2, setShowSearchChatConfirmModal2] = useState(false);
    const [showFilterChatConfirmModal2, setShowFilterChatConfirmModal2] = useState(false);
    const [showSortChatConfirmModal2, setShowSortChatConfirmModal2] = useState(false);
    const [showViewChatConfirmModal2, setShowViewChatConfirmModal2] = useState(false);
    const [showEditChatConfirmModal2, setShowEditChatConfirmModal2] = useState(false);

    const apiHook = useApiHook();
    const messageApi = useMessageApi();

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const session = frontendAuth.getSession();
                if (session?.user?.id) {
                    setIsAuthenticated(true);
                    setCurrentUser({
                        id: session.user.id,
                        username: session.user.username
                    });
                    await loadConversations(session.user.id);
                } else {
                    setShowAuthOverlay(true);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setShowAuthOverlay(true);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const loadConversations = async (userId: string) => {
        try {
            const result = await apiHook.getConversations(userId);
            if (result.error) {
                throw new Error(result.error);
            }
            setConversations(result.data || []);
            console.log('✅ Conversations loaded successfully:', result.data?.length || 0, 'conversations');
        } catch (error) {
            console.error('❌ Error loading conversations:', error);
            throw error;
        }
    };

    const handleLogout = async () => {
        try {
            frontendAuth.clearSession();
            setIsAuthenticated(false);
            setCurrentUser(null);
            setConversations([]);
            setSelectedConversation(null);
            setMessages([]);
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (isLoading) {
        return <FullPageLoader />;
    }

    if (!isAuthenticated) {
        return <AuthOverlay 
            username="" 
            onUsernameCreated={() => setIsAuthenticated(true)} 
            onClearData={() => {}} 
        />;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <ResizableSidebar
                selectedUser={null}
                initialWidth={320}
            >
                <Sidebar
                    username={currentUser?.username || ''}
                    users={{}}
                    selectedUser={selectedConversation?.id || null}
                    setSelectedUser={(userId) => {
                        const conv = conversations.find(c => c.id === userId);
                        setSelectedConversation(conv || null);
                    }}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    messages={messages}
                    conversations={conversations}
                    onLogout={handleLogout}
                />
            </ResizableSidebar>

            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <Fragment>
                        <ChatHeader
                            conversation={selectedConversation}
                            currentUser={currentUser}
                            onShowProfile={() => setShowProfileModal(true)}
                            onShowInfo={() => setShowInfoModal(true)}
                            onShowSettings={() => setShowSettingsModal(true)}
                        />
                        <MessageList
                            messages={messages}
                            username={currentUser?.username || currentUser?.email || 'User'}
                            onRetry={(message) => {/* Handle retry */}}
                            onReply={(message) => setReplyTo({ id: message.id, from: message.from, message: message.message })}
                            onEdit={(message) => setEditingMessage(message.id || '')}
                            onDelete={(messageId, type) => {/* Handle delete */}}
                            onPin={(message) => {/* Handle pin */}}
                        />
                    </Fragment>
                ) : (
                    <EmptyChatState />
                )}
            </div>

            {incomingCall && (
                <IncomingCallModal
                    from={incomingCall.callerName}
                    onAccept={() => {
                        // Handle accept
                    }}
                    onReject={() => setIncomingCall(null)}
                />
            )}

            {activeCall && (
                <CallOverlay
                    call={activeCall}
                    callerName={activeCall.callerName}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                    onToggleMute={() => setIsMuted(!isMuted)}
                    onToggleVideo={() => setIsVideoOff(!isVideoOff)}
                    onEndCall={() => setActiveCall(null)}
                    onToggleScreenShare={() => setScreenShare(!screenShare)}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                    isPip={isPip}
                    onTogglePip={() => setIsPip(!isPip)}
                />
            )}
        </div>
    );
}
