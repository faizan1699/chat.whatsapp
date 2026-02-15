'use client';

import React from 'react';
import { Mic, MicOff, PhoneOff, User } from 'lucide-react';

interface AudioCallProps {
    username: string;
    remoteUser: string;
    callTimer: number;
    isMuted: boolean;
    onToggleMute: () => void;
    onEndCall: () => void;
    connectionState: 'connecting' | 'connected' | 'disconnected';
}

export default function AudioCall({
    username,
    remoteUser,
    callTimer,
    isMuted,
    onToggleMute,
    onEndCall,
    connectionState
}: AudioCallProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex h-full w-full flex-col items-center justify-between bg-[#111b21] p-8 text-white">
            <div className="mt-20 flex flex-col items-center">
                <div className="relative mb-6">
                    <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#202c33] bg-[#667781] shadow-2xl">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${remoteUser}`}
                            alt={remoteUser}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    {connectionState === 'connecting' && (
                        <div className="absolute inset-0 animate-ping rounded-full bg-[#00a884]/20"></div>
                    )}
                </div>

                <h2 className="text-2xl font-semibold">{remoteUser}</h2>
                <p className="mt-2 text-[#8696a0]">
                    {connectionState === 'connecting' ? 'Calling...' : formatTime(callTimer)}
                </p>
                {connectionState === 'connecting' && (
                    <span className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#00a884]">
                        Connecting
                    </span>
                )}
            </div>

            <div className="mb-12 flex items-center gap-8">
                <button
                    onClick={onToggleMute}
                    className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-[#202c33] text-white hover:bg-[#2a3942]'
                        }`}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
                </button>

                <button
                    onClick={onEndCall}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ea0038] text-white shadow-lg transition-all hover:bg-[#d10032] hover:scale-105 active:scale-95 shadow-red-500/20"
                    title="End Call"
                >
                    <PhoneOff size={28} />
                </button>
            </div>

            <div className="absolute bottom-8 text-xs text-[#8696a0] opacity-50">
                End-to-end encrypted
            </div>
        </div>
    );
}
