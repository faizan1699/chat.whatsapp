import React, { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { debounce } from '../../utils/debounce';
import { Plus, X, Search as SearchIcon, LogOut, User, Users } from 'lucide-react';
import UserSearch from '../chat/UserSearch';
import { apiService } from '@/services/apiService';

const UserSkeleton = () => (
    <div className="group relative flex w-full items-center gap-3 border-b border-[#f0f2f5] px-3 py-4">
        <div className="relative h-12 w-12 flex-shrink-0">
            <div className="h-full w-full overflow-hidden rounded-full bg-slate-200 animate-pulse">
                <div className="h-full w-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 animate-shimmer"></div>
            </div>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden text-left">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                </div>
                <div className="h-3 w-12 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between mt-1">
                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
        </div>
    </div>
);

interface SidebarProps {
    username: string;
    users: { [key: string]: string };
    selectedUser: string | null;
    setSelectedUser: (user: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    messages: any[];
    conversations: any[];
    unreadCounts?: { [key: string]: number };
    onLogout?: () => void;
    onEditProfile?: () => void;
    onConversationCreated?: () => void;
    isLoading?: boolean;
}

export default function Sidebar({
    username,
    users,
    selectedUser,
    setSelectedUser,
    searchQuery,
    setSearchQuery,
    messages,
    conversations,
    unreadCounts = {},
    onLogout,
    onEditProfile,
    onConversationCreated,
    isLoading = false,
}: SidebarProps) {
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const debouncedSetSearchQuery = useMemo(
        () => debounce((value: string) => setSearchQuery(value), 300),
        [setSearchQuery]
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearchQuery(value);
        debouncedSetSearchQuery(value);
    };

    const handleSelectGlobalUser = async (user: any) => {
        try {
            const userDataStr = localStorage.getItem('user_data') || '';
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const userId = userData?.id;

            if (!userId) {
                alert('Session expired. Please log in again.');
                return;
            }

            if (user.id === userId) {
                alert('Cannot start a chat with yourself.');
                return;
            }

            const conversation = await apiService.createConversation([userId, user.id]);
            setSelectedUser(user.username);
            setShowGlobalSearch(false);

            if (onConversationCreated) {
                onConversationCreated();
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const getLastMessageFromConversation = (conv: any) => {
        if (conv.messages?.length > 0) {
            return conv.messages[0];
        }

        const participantUsernames = conv.participants?.map((p: any) => p.user.username) || [];
        if (Array.isArray(messages)) {
            return messages.filter(m =>
                participantUsernames.includes(m.from) || participantUsernames.includes(m.to)
            ).pop();
        }

        return null;
    };

    const formatMessageTime = (timestamp: any) => {
        if (!timestamp) return '';

        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return '';
            }
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return '';
        }
    };

    const getUnreadCountForConversation = (conv: any) => {
        const participantUsernames = conv.participants?.map((p: any) => p.user.username) || [];
        return participantUsernames.reduce((total: number, username: string) => {
            return total + (unreadCounts[username] || 0);
        }, 0);
    };

    const conversationData = useMemo(() => {
        if (!Array.isArray(conversations)) return [];

        return conversations.map(conv => {
            const otherParticipants = conv.participants?.filter((p: any) =>
                p && p.user && p.user.username && p.user.username !== username
            ) || [];

            const lastMsg = getLastMessageFromConversation(conv);
            const unreadCount = getUnreadCountForConversation(conv);

            return {
                id: conv.id,
                name: conv.name,
                isGroup: conv.is_group,
                participants: otherParticipants,
                lastMessage: lastMsg,
                unreadCount: unreadCount,
                allParticipants: conv.participants || []
            };
        });
    }, [conversations, username, messages, unreadCounts]);

    const filteredConversations = conversationData
        .filter(conv =>
            conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.participants.some((p: any) => p.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    return (
        <div className="flex h-full w-full flex-col bg-white overflow-hidden">
            {/* Sidebar Header */}
            <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 py-2">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-300 cursor-pointer">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="avatar" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center gap-3 text-[#54656f]">
                    <button
                        onClick={() => setShowGlobalSearch(true)}
                        className="hover:bg-black/5 p-2 rounded-full transition-colors"
                        title="New Chat"
                    >
                        <Plus size={22} />
                    </button>
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="hover:bg-black/5 p-2 rounded-full transition-colors"
                            title="Menu"
                        >
                            <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor">
                                <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z"></path>
                            </svg>
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-[#e9edef] py-1 z-50 animate-in fade-in duration-150">
                                <button
                                    onClick={() => {
                                        onEditProfile?.();
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[#111b21] hover:bg-[#f0f2f5]"
                                >
                                    <User size={18} className="text-[#667781]" /> Edit Profile
                                </button>
                                <button
                                    onClick={() => {
                                        onLogout?.();
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {showGlobalSearch && (
                <div className="absolute inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-left duration-300">
                    <header className="flex h-[110px] items-end bg-[#008069] px-4 pb-4 text-white">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setShowGlobalSearch(false)} className="hover:bg-white/10 p-1 rounded-full">
                                <Plus className="rotate-45" size={24} />
                            </button>
                            <span className="text-xl font-medium">New Chat</span>
                        </div>
                    </header>
                    <div className="flex-1 overflow-y-auto">
                        <UserSearch onSelectUser={handleSelectGlobalUser} />
                    </div>
                </div>
            )}

            <div className="bg-white px-3 py-2">
                <div className="flex items-center gap-4 rounded-lg bg-[#f0f2f5] px-3 py-1.5 shadow-sm">
                    <span className="text-[#54656f]">
                        <SearchIcon size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="w-full bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#667781]"
                        value={localSearchQuery}
                        onChange={handleSearchChange}
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-2 text-[13px] font-bold text-[#00a884] uppercase tracking-wider">
                    Recent Chats
                </div>
                {isLoading ? (
                    <Fragment>
                        {
                            Array.from({ length: 8 }).map((_, index) => (
                                <UserSkeleton key={index} />
                            ))
                        }
                    </Fragment>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#667781]">
                        <p className="text-sm">No chats found</p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => {
                        const { id, name, isGroup, participants, lastMessage, unreadCount } = conversation;
                        const getConversationTitle = () => {
                            if (name) return name;
                            if (isGroup) {
                                return participants.map((p: any) => p.user.username).join(', ');
                            }
                            return participants.length > 0 ? participants[0].user.username : 'Unknown';
                        };

                        const conversationTitle = getConversationTitle();
                        const isSelected = selectedUser === conversationTitle ||
                            (participants.some((p: any) => p.user.username === selectedUser));

                        return (
                            <button
                                key={id}
                                onClick={() => {
                                    if (!isGroup && participants.length === 1) {
                                        setSelectedUser(participants[0].user.username);
                                    } else {
                                        setSelectedUser(participants[0]?.user.username || '');
                                    }
                                }}
                                className={`group relative flex w-full items-center gap-3 border-b border-[#f0f2f5] px-3 py-4 transition-colors ${isSelected ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'}`}
                            >
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00a884]"></div>
                                )}

                                <div className="relative flex-shrink-0">
                                    {isGroup ? (
                                        <div className="flex">
                                            <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 border-2 border-white -mr-2">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participants[0]?.user.username || 'group1'}`} alt="participant" className="h-full w-full object-cover" />
                                            </div>
                                            {participants.length > 1 && (
                                                <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 border-2 border-white">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participants[1]?.user.username || 'group2'}`} alt="participant" className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                            {participants.length > 2 && (
                                                <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-300 border-2 border-white flex items-center justify-center">
                                                    <span className="text-xs font-semibold text-slate-600">+{participants.length - 2}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participants[0]?.user.username || conversationTitle}`} alt={conversationTitle} className="h-full w-full object-cover" />
                                        </div>
                                    )}

                                    {!isGroup && participants.length === 1 && (
                                        <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-[#25d366]"></div>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col overflow-hidden text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="truncate font-semibold text-[#111b21]">
                                                {conversationTitle}
                                            </span>
                                            {isGroup && (
                                                <Users size={14} className="text-[#667781] flex-shrink-0" />
                                            )}
                                        </div>
                                        {lastMessage && (
                                            <span className={`text-[12px] ${unreadCount > 0 ? 'text-[#00a884] font-semibold' : 'text-[#667781]'}`}>
                                                {formatMessageTime(lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`truncate text-sm ${unreadCount > 0 ? 'text-[#111b21] font-medium' : 'text-[#667781]'}`}>
                                            {lastMessage ? (lastMessage.isDeleted ? <span className="italic flex items-center gap-1"><X size={12} /> This message was deleted</span> : lastMessage.message) : 'Start a conversation'}
                                        </span>
                                        {unreadCount > 0 && (
                                            <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[11px] font-bold text-white">
                                                {unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {isGroup && (
                                        <div className="text-xs text-[#667781] mt-1">
                                            {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

