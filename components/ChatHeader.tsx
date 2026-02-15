'use client';

import React from 'react';
import { Search, MoreVertical, Video, Phone, ArrowLeft } from 'lucide-react';

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
                    <span className="text-[12px] text-[#667781]">online</span>
                </div>
            </div>
            <div className="flex items-center gap-4 text-[#54656f]">
                <button onClick={onStartVideoCall} className="hover:bg-black/5 p-2 rounded-full transition-colors" title="Video Call">
                    <Video size={20} />
                </button>
                <button onClick={onStartAudioCall} className="hover:bg-black/5 p-2 rounded-full transition-colors" title="Audio Call">
                    <Phone size={20} />
                </button>
                <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                    <Search size={20} />
                </button>
                <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
        </header>
    );
}
