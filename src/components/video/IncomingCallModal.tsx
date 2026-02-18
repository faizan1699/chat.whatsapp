'use client';

import React from 'react';
import { Phone, Video, PhoneOff, Check } from 'lucide-react';

interface IncomingCallModalProps {
    from: string;
    isAudioOnly?: boolean;
    onAccept: () => void;
    onReject: () => void;
}

export default function IncomingCallModal({ from, isAudioOnly, onAccept, onReject }: IncomingCallModalProps) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="relative mx-auto mb-6 h-24 w-24">
                    <div className="h-full w-full overflow-hidden rounded-full bg-[#f0f2f5] shadow-inner border-4 border-white">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${from}`}
                            alt="caller"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884] text-white border-2 border-white shadow-lg">
                        {isAudioOnly ? <Phone size={14} fill="currentColor" /> : <Video size={14} fill="currentColor" />}
                    </div>
                </div>

                <h2 className="mb-1 text-2xl font-bold text-[#111b21]">
                    Incoming {isAudioOnly ? 'Audio' : 'Video'} Call
                </h2>
                <p className="mb-8 text-[#667781] font-medium">{from} is calling you...</p>

                <div className="flex gap-4">
                    <button
                        onClick={onReject}
                        className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-red-50 py-4 transition-all hover:bg-red-100 active:scale-95 group"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 group-hover:bg-red-600">
                            <PhoneOff size={24} className="rotate-[135deg]" />
                        </div>
                        <span className="text-sm font-bold text-red-600">Decline</span>
                    </button>

                    <button
                        onClick={onAccept}
                        className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-emerald-50 py-4 transition-all hover:bg-emerald-100 active:scale-95 group"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00a884] text-white shadow-lg shadow-emerald-500/30 group-hover:bg-[#008069]">
                            <Check size={28} strokeWidth={3} />
                        </div>
                        <span className="text-sm font-bold text-[#00a884]">Accept</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
