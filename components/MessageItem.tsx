'use client';

import React from 'react';

interface Message {
    id?: string;
    from: string;
    to: string;
    message: string;
    timestamp: Date;
    status?: 'pending' | 'sent' | 'failed';
}

interface MessageItemProps {
    message: Message;
    isMe: boolean;
    onRetry?: (msg: Message) => void;
}

export default function MessageItem({ message, isMe, onRetry }: MessageItemProps) {
    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`flex flex-col max-w-[85%] md:max-w-[65%] px-2 py-1 shadow-sm relative ${isMe
                        ? 'rounded-l-lg rounded-br-lg bg-[#d9fdd3] text-[#111b21] ml-10'
                        : 'rounded-r-lg rounded-bl-lg bg-white text-[#111b21] mr-10'
                    } ${message.status === 'failed' ? 'bg-red-50 border border-red-200' : ''}`}
            >
                {/* Message Content */}
                <div className="flex flex-wrap items-end gap-2 pr-2">
                    <p className="text-[14.2px] leading-tight whitespace-pre-wrap py-0.5 min-w-[50px]">
                        {message.message}
                    </p>

                    {/* Meta data (Time + Status) */}
                    <div className="flex items-center gap-1 ml-auto pt-1 h-4">
                        <span className="text-[10px] text-[#667781] whitespace-nowrap uppercase">
                            {formatTime(message.timestamp)}
                        </span>

                        {isMe && (
                            <span className={`text-[11px] font-bold ${message.status === 'sent' ? 'text-[#53bdeb]' : 'text-[#667781]'
                                }`}>
                                {message.status === 'pending' ? '✓' : message.status === 'sent' ? '✓✓' : '!'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Retry Button for Failed Messages */}
                {message.status === 'failed' && isMe && (
                    <button
                        onClick={() => onRetry?.(message)}
                        className="text-[10px] text-red-500 underline text-left mt-1 hover:text-red-600 transition-colors"
                    >
                        Failed to send. Click to retry.
                    </button>
                )}

                {/* Tail Decoration (Simplified) */}
                <div className={`absolute top-0 w-2 h-3 ${isMe
                        ? '-right-1.5 bg-[#d9fdd3] clip-path-right'
                        : '-left-1.5 bg-white clip-path-left'
                    }`} style={{
                        clipPath: isMe
                            ? 'polygon(0 0, 0 100%, 100% 0)'
                            : 'polygon(100% 0, 100% 100%, 0 0)'
                    }} />
            </div>
        </div>
    );
}
