import React, { useState, useMemo, useRef, useEffect } from 'react';
import { debounce } from '../../utils/debounce';
import { Plus, X, Search as SearchIcon, LogOut, User } from 'lucide-react';
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
    onConversationCreated?: () => void; // Add callback for when conversation is created
    isLoading?: boolean; // Add loading prop
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
    isLoading = false, // Default to false
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
        // Here we initiate a conversation via API
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
            
            // Call callback to refresh conversations list
            if (onConversationCreated) {
                onConversationCreated();
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    // Get unique conversation partners from conversations
    const conversationPartners = useMemo(() => {
        const partners = new Set<string>();
        if (Array.isArray(conversations)) {
            conversations.forEach(conv => {
                if (conv && conv.participants && Array.isArray(conv.participants)) {
                    conv.participants.forEach((p: any) => {
                        if (p && p.user && p.user.username && p.user.username !== username) {
                            partners.add(p.user.username);
                        }
                    });
                }
            });
        }
        return Array.from(partners);
    }, [conversations, username]);

    const filteredUsers = conversationPartners
        .filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()));

    const getLastMessage = (user: string) => {
        // First try to get last message from conversations data
        if (Array.isArray(conversations)) {
            const userConversation = conversations.find(conv => 
                conv && conv.participants && Array.isArray(conv.participants) &&
                conv.participants.some((p: any) => p && p.user && p.user.username === user)
            );
            
            if (userConversation?.messages?.length > 0) {
                return userConversation.messages[0];
            }
        }
        
        // Fallback to messages array
        if (Array.isArray(messages)) {
            return messages.filter(m => (m.from === user && m.to === username) || (m.from === username && m.to === user)).pop();
        }
        
        return null;
    };

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

            {/* Global Search Drawer */}
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

            {/* Search Bar */}
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

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-2 text-[13px] font-bold text-[#00a884] uppercase tracking-wider">
                    Recent Chats
                </div>
                
                {/* Show skeleton loaders when loading */}
                {isLoading ? (
                    <>
                        <UserSkeleton />
                        <UserSkeleton />
                        <UserSkeleton />
                        <UserSkeleton />
                        <UserSkeleton />
                    </>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#667781]">
                        <p className="text-sm">No chats found</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => {
                        const lastMsg = getLastMessage(user);
                        const unreadCount = unreadCounts[user] || 0;

                        return (
                            <button
                                key={user}
                                onClick={() => setSelectedUser(user)}
                                className={`group relative flex w-full items-center gap-3 border-b border-[#f0f2f5] px-3 py-4 transition-colors ${selectedUser === user ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'}`}
                            >
                                {selectedUser === user && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00a884]"></div>
                                )}
                                <div className="relative h-12 w-12 flex-shrink-0">
                                    <div className="h-full w-full overflow-hidden rounded-full bg-slate-200">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`} alt={user} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-[#25d366]"></div>
                                </div>
                                <div className="flex flex-1 flex-col overflow-hidden text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="truncate font-semibold text-[#111b21]">{user}</span>
                                        </div>
                                        {lastMsg && (
                                            <span className={`text-[12px] ${unreadCount > 0 ? 'text-[#00a884] font-semibold' : 'text-[#667781]'}`}>
                                                {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`truncate text-sm ${unreadCount > 0 ? 'text-[#111b21] font-medium' : 'text-[#667781]'}`}>
                                            {lastMsg ? (lastMsg.isDeleted ? <span className="italic flex items-center gap-1"><X size={12} /> This message was deleted</span> : lastMsg.message) : 'Start a conversation'}
                                        </span>
                                        {unreadCount > 0 && (
                                            <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[11px] font-bold text-white">
                                                {unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

