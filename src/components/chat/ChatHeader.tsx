'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreVertical, Video, Phone, ArrowLeft, X, Trash2, RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
    conversation: any;
    currentUser: any;
    onShowProfile: () => void;
    onShowInfo: () => void;
    onShowSettings: () => void;
}

export default function ChatHeader({ conversation, currentUser, onShowProfile, onShowInfo, onShowSettings }: ChatHeaderProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <header className="sticky top-0 z-30 flex h-[60px] w-full flex-shrink-0 items-center justify-between bg-[#f0f2f5] px-4 py-2 border-l border-[#d1d7db]">
            <div className="flex items-center gap-3">
                <button className="md:hidden text-[#54656f]" onClick={onShowSettings}>
                    <ArrowLeft size={24} />
                </button>
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-300">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation?.participant?.name || 'user'}`} alt={conversation?.participant?.name || 'User'} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[#111b21] font-medium">{conversation?.participant?.name || 'Unknown User'}</span>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#00a884]"></div>
                        <span className="text-[12px] text-[#667781]">online</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 text-[#54656f]">
                <button onClick={onShowInfo} className="hover:bg-black/5 p-2 rounded-full transition-colors" title="Video Call">
                    <Video size={20} />
                </button>
                <button onClick={onShowProfile} className="hover:bg-black/5 p-2 rounded-full transition-colors" title="Audio Call">
                    <Phone size={20} />
                </button>
                <button className="max-[768px]:hidden hover:bg-black/5 p-1 rounded-full transition-colors group relative" title="Close Chat" onClick={onShowSettings}>
                    <X size={20} className="group-hover:text-red-500 transition-colors" />
                </button>
                <div className="w-[1px] h-6 bg-[#d1d7db] mx-1"></div>
                {/* <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                    <Search size={20} />
                </button> */}
              
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setShowMenu(!showMenu)} 
                        className="hover:bg-black/5 p-2 rounded-full transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                    
                    {showMenu && (
                        <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50">
                            <button
                                onClick={() => {
                                    onShowSettings();
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            >
                                Settings
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
