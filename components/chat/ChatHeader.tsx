'use client';

import React from 'react';
import { Search, MoreVertical, Video, Phone, ArrowLeft, X } from 'lucide-react';

interface ChatHeaderProps {
    selectedUser: string;
    onBack: () => void;
    onStartVideoCall: () => void;
    onStartAudioCall: () => void;
}

export default function ChatHeader({ selectedUser, onBack, onStartVideoCall, onStartAudioCall }: ChatHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-[60px] w-full flex-shrink-0 items-center justify-between bg-[#f0f2f5] px-4 py-2 border-l border-[#d1d7db]">
            <div className="flex items-center gap-3">
                <button className="md:hidden text-[#54656f]" onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-300">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser}`} alt={selectedUser} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[#111b21] font-medium">{selectedUser}</span>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#00a884]"></div>
                        <span className="text-[12px] text-[#667781]">online</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 text-[#54656f]">
                <button onClick={onStartVideoCall} className="hover:bg-black/5 p-2 rounded-full transition-colors" title="Video Call">
                    <Video size={20} />
                </button>
                <button onClick={onStartAudioCall} className="hover:bg-black/5 p-2 rounded-full transition-colors" title="Audio Call">
                    <Phone size={20} />
                </button>
                <button className="max-[768px]:hidden hover:bg-black/5 p-1 rounded-full transition-colors group relative" title="Close Chat" onClick={onBack}>
                    <X size={20} className="group-hover:text-red-500 transition-colors" />
                </button>
                <div className="w-[1px] h-6 bg-[#d1d7db] mx-1"></div>
                {/* <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                    <Search size={20} />
                </button> */}
                <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
        </header>
    );
}
