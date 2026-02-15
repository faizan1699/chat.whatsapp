'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Reply, Trash2, Pin, ChevronDown, Play, Pause } from 'lucide-react';

export interface Message {
    id?: string;
    from: string;
    to: string;
    message: string;
    timestamp: Date;
    status?: 'pending' | 'sent' | 'failed';
    replyTo?: Message;
    isPinned?: boolean;
    audioUrl?: string;
    audioDuration?: number;
    isVoiceMessage?: boolean;
}

interface MessageItemProps {
    message: Message;
    isMe: boolean;
    onRetry?: (msg: Message) => void;
    onReply?: (msg: Message) => void;
    onDelete?: (id: string) => void;
    onPin?: (msg: Message) => void;
}

export default function MessageItem({ message, isMe, onRetry, onReply, onDelete, onPin }: MessageItemProps) {
    const [visibleWords, setVisibleWords] = useState(30);
    const [showActions, setShowActions] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const words = message.message.trim().split(/\s+/);
    const isLongMessage = words.length > 30;
    const hasMore = words.length > visibleWords;

    const formatTimestamp = (date: Date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const displayedMessage = hasMore
        ? words.slice(0, visibleWords).join(' ') + '...'
        : message.message;

    const handleSeeMore = (e: React.MouseEvent) => {
        e.preventDefault();
        setVisibleWords(prev => prev + 30);
    };

    const handleSeeLess = (e: React.MouseEvent) => {
        e.preventDefault();
        setVisibleWords(30);
    };

    useEffect(() => {
        if (audioRef.current) {
            const audio = audioRef.current;
            
            const updateTime = () => setCurrentTime(audio.currentTime);
            const updateDuration = () => setDuration(audio.duration);
            const onEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };
            
            audio.addEventListener('timeupdate', updateTime);
            audio.addEventListener('loadedmetadata', updateDuration);
            audio.addEventListener('ended', onEnded);
            
            return () => {
                audio.removeEventListener('timeupdate', updateTime);
                audio.removeEventListener('loadedmetadata', updateDuration);
                audio.removeEventListener('ended', onEnded);
            };
        }
    }, [message.audioUrl]);

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            id={`msg-${message.id}`}
            className={`group flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div
                className={`flex flex-col max-w-[85%] md:max-w-[65%] px-2 py-1 shadow-sm relative ${isMe
                    ? 'rounded-l-lg rounded-br-lg bg-[#d9fdd3] text-[#111b21] ml-10'
                    : 'rounded-r-lg rounded-bl-lg bg-white text-[#111b21] mr-10'
                    } ${message.status === 'failed' ? 'bg-red-50 border border-red-200' : ''}`}
            >
                {/* Reply Context */}
                {message.replyTo && (
                    <div className="mb-1 border-l-4 border-[#06cf9c] bg-black/5 p-2 rounded text-[12px] opacity-80">
                        <p className="font-bold text-[#06cf9c]">{message.replyTo.from === message.from ? 'You' : message.replyTo.from}</p>
                        <p className="truncate text-[#54656f]">{message.replyTo.message}</p>
                    </div>
                )}

                {/* Pin Indicator */}
                {message.isPinned && (
                    <div className="mb-1 flex items-center gap-1 text-[10px] text-[#667781] font-medium italic">
                        <Pin size={10} className="fill-current" />
                        <span>Pinned Message</span>
                    </div>
                )}

                {/* Actions Trigger (Hidden by default, shown on hover/group-hover) */}
                <div className={`absolute top-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'left-[-40px]' : 'right-[-40px]'}`}>
                    <div className="flex flex-col gap-1 bg-white shadow-md rounded-full p-1 border border-[#f0f2f5]">
                        <button
                            onClick={() => onReply?.(message)}
                            className="p-1.5 hover:bg-black/5 rounded-full text-[#667781] transition-colors"
                            title="Reply"
                        >
                            <Reply size={16} />
                        </button>
                        <button
                            onClick={() => onPin?.(message)}
                            className={`p-1.5 hover:bg-black/5 rounded-full transition-colors ${message.isPinned ? 'text-[#00a884]' : 'text-[#667781]'}`}
                            title={message.isPinned ? 'Unpin' : 'Pin'}
                        >
                            <Pin size={16} className={message.isPinned ? 'fill-current' : ''} />
                        </button>
                        <button
                            onClick={() => message.id && onDelete?.(message.id)}
                            className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Message Content */}
                <div className="flex flex-col pr-2">
                    {message.isVoiceMessage ? (
                        <div className="flex items-center gap-3 py-2 min-w-[200px]">
                            <audio
                                ref={audioRef}
                                src={message.audioUrl}
                                className="hidden"
                            />
                            <button
                                onClick={togglePlayback}
                                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008069] text-white flex items-center justify-center transition-colors flex-shrink-0"
                            >
                                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-[#e9edef] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#00a884] transition-all duration-100"
                                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                                        />
                                    </div>
                                    <span className="text-[11px] text-[#667781] whitespace-nowrap">
                                        {formatTime(currentTime)} / {formatTime(message.audioDuration || duration || 0)}
                                    </span>
                                </div>
                                <div className="mt-1">
                                    <div className="flex gap-1">
                                        {[...Array(20)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-[#00a884]/30 rounded-full"
                                                style={{
                                                    height: `${8 + (isPlaying ? Math.random() * 8 : 0)}px`,
                                                    transition: 'height 0.1s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[14.2px] leading-tight whitespace-pre-wrap py-0.5 min-w-[50px]">
                            {displayedMessage}
                            {hasMore && (
                                <button
                                    onClick={handleSeeMore}
                                    className="ml-1 text-[#00a884] font-bold hover:underline text-[12px]"
                                >
                                    Read more
                                </button>
                            )}
                            {!hasMore && isLongMessage && visibleWords > 30 && (
                                <button
                                    onClick={handleSeeLess}
                                    className="ml-1 text-[#00a884] font-bold hover:underline text-[12px]"
                                >
                                    See less
                                </button>
                            )}
                        </p>
                    )}

                    {/* Meta data (Time + Status) */}
                    <div className="flex items-center gap-1 ml-auto pt-1 h-4">
                        <span className="text-[10px] text-[#667781] whitespace-nowrap uppercase">
                            {formatTimestamp(message.timestamp)}
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
        </div >
    );
}
