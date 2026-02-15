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
    sidebarWidth: number;
}

export default function Sidebar({ username, users, selectedUser, setSelectedUser, searchQuery, setSearchQuery, messages }: Omit<SidebarProps, 'sidebarWidth'>) {
    const filteredUsers = Object.keys(users)
        .filter((u) => u !== username)
        .filter(u => u.toLowerCase().includes(searchQuery.toLowerCase()));

    const getLastMessage = (user: string) => {
        return messages.filter(m => (m.from === user && m.to === username) || (m.from === username && m.to === user)).pop();
    };

    return (
        <div className="flex h-full w-full flex-col">
            {/* Sidebar Header */}
            <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 py-2">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-300 cursor-pointer">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="avatar" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center gap-5 text-[#54656f]">
                    <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                            <path d="M12 20.664a9.163 9.163 0 0 1-6.521-2.702.977.977 0 0 1 1.381-1.381 7.269 7.269 0 0 0 10.024.244.977.977 0 0 1 1.313 1.445A9.192 9.192 0 0 1 12 20.664zm7.965-6.112a.977.977 0 0 1-1.135-.728 7.269 7.269 0 0 0-13.231-1.582.977.977 0 0 1-1.636-1.079 9.219 9.219 0 0 1 16.729 2.254.977.977 0 0 1-.727 1.135zm-7.965-11.69c3.02 0 5.61 1.444 7.23 3.664a.978.978 0 0 1-1.583 1.15 7.268 7.268 0 0 0-11.294 0 .978.978 0 0 1-1.583-1.15c1.62-2.22 4.21-3.664 7.23-3.664z"></path>
                        </svg>
                    </button>
                    <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                            <path d="M19.005 3.125H4.995c-1.03 0-1.875.845-1.875 1.875V19c0 1.03.845 1.875 1.875 1.875h14.01c1.03 0 1.875-.845 1.875-1.875V5c0-1.03-.845-1.875-1.875-1.875zm-3.13 11.516s-.462.433-1.127.433c-.628 0-1.05-.333-1.05-.333s-.39-.4-.523-.623V14h-1.5s-.1-.013-.234-.013c-.42 0-1.055.347-1.055.347s-.395.347-.947.347c-.52 0-.842-.333-.842-.333s-.342-.32-.474-.533V14h-1.5v-1h1.5v-.547c-.145-.227-.513-.579-.513-.579s-.355-.373-.829-.373c-.566 0-.974.387-.974.387s-.408.4-.553.639V12h-1.5V6h1.5v2.533c.132-.213.487-.533.487-.533s.342-.347.882-.347c.54 0 .934.347.934.347s.408.347.539.56V8.5h1.5v2.853c.158-.28.592-.519.592-.519S11.411 10.5 12 10.5s1.053.333 1.053.333.408.387.54.667H14.5s-.118.013-.263.013c-.434 0-1.013.253-1.013.253s-.421.307-.421.787c0 .52.329.84.329.84s.408.36.934.36c.553 0 .934-.36.934-.36z"></path>
                        </svg>
                    </button>
                    <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                        <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                            <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z"></path>
                        </svg>
                    </button>
                </div>
            </header>

            {/* Search Bar */}
            <div className="bg-white px-3 py-2">
                <div className="flex items-center gap-4 rounded-lg bg-[#f0f2f5] px-3 py-1.5 shadow-sm">
                    <span className="text-[#54656f]">
                        <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor">
                            <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        className="w-full bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#667781]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#667781]">
                        <p className="text-sm">No chats found</p>
                    </div>
                ) : (
                    filteredUsers.map((user) => {
                        const lastMsg = getLastMessage(user);
                        return (
                            <button
                                key={user}
                                onClick={() => setSelectedUser(user)}
                                className={`flex w-full items-center gap-3 border-b border-[#f0f2f5] px-3 py-3 transition-colors ${selectedUser === user ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'}`}
                            >
                                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`} alt={user} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex flex-1 flex-col overflow-hidden text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="truncate font-semibold text-[#111b21]">{user}</span>
                                            {user === username && (
                                                <span className="text-[10px] text-[#00a884] font-bold uppercase tracking-wider bg-[#d9fdd3] px-1.5 py-0.5 rounded">You</span>
                                            )}
                                        </div>
                                        {lastMsg && (
                                            <span className="text-[12px] text-[#667781]">
                                                {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="truncate text-sm text-[#667781]">
                                            {lastMsg ? lastMsg.message : 'Start a conversation'}
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
