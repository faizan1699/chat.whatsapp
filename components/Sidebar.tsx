'use client';

import React from 'react';

interface SidebarProps {
    username: string;
    users: { [key: string]: string };
    selectedUser: string | null;
    setSelectedUser: (user: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    messages: any[];
}

export default function Sidebar({
    username,
    users,
    selectedUser,
    setSelectedUser,
    searchQuery,
    setSearchQuery,
    messages
}: SidebarProps) {
    const filteredUsers = Object.keys(users)
        .filter((u) => u !== username)
        .filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()));

    const getLastMessage = (user: string) => {
        return messages.filter(m => (m.from === user && m.to === username) || (m.from === username && m.to === user)).pop();
    };

    return (
        <div className="flex h-full w-full flex-col bg-white">
            {/* Sidebar Header */}
            <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 py-2 border-b border-[#e9edef]">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 cursor-pointer border border-[#d1d7db]">
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                        alt="avatar"
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="flex items-center gap-5 text-[#54656f]">
                    <button className="hover:bg-black/5 p-2 rounded-full transition-colors active:scale-95">
                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                            <path d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-1.135-.728 7.269 7.269 0 0 0-13.231-1.582.977.977 0 0 1-1.636-1.079 9.219 9.219 0 0 1 16.729 2.254.977.977 0 0 1-.727 1.135zm-7.965-11.69c3.02 0 5.61 1.444 7.23 3.664a.978.978 0 0 1-1.583 1.15 7.268 7.268 0 0 0-11.294 0 .978.978 0 0 1-1.583-1.15c1.62-2.22 4.21-3.664 7.23-3.664z"></path>
                        </svg>
                    </button>
                    <button className="hover:bg-black/5 p-2 rounded-full transition-colors active:scale-95">
                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                            <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z"></path>
                        </svg>
                    </button>
                </div>
            </header>

            {/* Search Bar */}
            <div className="bg-white px-3 py-2 border-b border-[#f0f2f5]">
                <div className="flex items-center gap-3 rounded-lg bg-[#f0f2f5] px-3 py-1.5 shadow-sm ring-1 ring-inset ring-slate-200 focus-within:ring-emerald-500">
                    <span className="text-[#54656f]">
                        <svg viewBox="0 0 24 24" height="18" width="18" fill="currentColor">
                            <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search chats"
                        className="w-full bg-transparent text-[15px] text-[#111b21] outline-none placeholder:text-[#667781]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200">
                {filteredUsers.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#667781]">
                        <div className="mb-4 rounded-full bg-slate-50 p-6">
                            <MessageSquare size={32} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-medium">No results found</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => {
                        const lastMsg = getLastMessage(user);
                        const isActive = selectedUser === user;
                        return (
                            <button
                                key={user}
                                onClick={() => setSelectedUser(user)}
                                className={`flex w-full items-center gap-3 border-b border-[#f0f2f5] px-3 py-3 transition-all duration-200 ${isActive ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'}`}
                            >
                                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 shadow-sm border border-slate-200/50">
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`}
                                        alt={user}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col overflow-hidden text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="truncate font-semibold text-[#111b21]">{user}</span>
                                            {user === username && (
                                                <span className="text-[10px] text-[#00a884] font-extrabold uppercase tracking-widest bg-[#d9fdd3] px-1.5 py-0.5 rounded shadow-sm">You</span>
                                            )}
                                        </div>
                                        {lastMsg && (
                                            <span className="text-[12px] text-[#667781] font-medium">
                                                {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className="truncate text-sm text-[#667781] leading-tight">
                                            {lastMsg ? lastMsg.message : <span className="italic text-slate-400">Start a conversation</span>}
                                        </span>
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

function MessageSquare({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
