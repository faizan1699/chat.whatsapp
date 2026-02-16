'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Reply, Trash2, Pin, ChevronDown, Play, Pause, Pencil, Eye, EyeOff } from 'lucide-react';
import { Message } from '@/types/message';

interface MessageItemProps {
    message: Message;
    isMe: boolean;
    onRetry?: (msg: Message) => void;
    onReply?: (msg: Message) => void;
    onDelete?: (id: string, type: 'me' | 'everyone') => void;
    onPin?: (msg: Message) => void;
    onEdit?: (msg: Message) => void;
    onUpdateMessage?: (msg: Message) => void;
    onHide?: (id: string) => void;
    onUnhide?: (id: string) => void;
    isHighlighted?: boolean;
    highlightKey?: number;
}

export default function MessageItem({
    message,
    isMe,
    onRetry,
    onReply,
    onDelete,
    onPin,
    onEdit,
    onHide,
    onUnhide,
    isHighlighted,
    highlightKey
}: MessageItemProps) {
    const [visibleWords, setVisibleWords] = useState(30);
    const [showActions, setShowActions] = useState(false);
    const [showDeleteMenu, setShowDeleteMenu] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const deleteMenuRef = useRef<HTMLDivElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const words = message.message.trim().split(/\s+/);
    const isLongMessage = words.length > 30;
    const hasMore = words.length > visibleWords;

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const isToday = messageDate.toDateString() === now.toDateString();
        
        if (isToday) {
            return messageDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } else {
            return messageDate.toLocaleDateString([], {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const formatDateLabel = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const isToday = messageDate.toDateString() === now.toDateString();
        const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === messageDate.toDateString();
        
        if (isToday) return 'Today';
        if (isYesterday) return 'Yesterday';
        return messageDate.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
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
        const handleClickOutside = (event: MouseEvent) => {
            if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target as Node)) {
                setShowDeleteMenu(false);
            }
        };

        if (showDeleteMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDeleteMenu]);

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
            <div className={`flex flex-col max-w-[85%] md:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Message bubble */}
                <div
                    className={`flex flex-col px-2 py-1 shadow-sm relative ${isMe
                        ? 'rounded-l-lg rounded-br-lg bg-[#d9fdd3] text-[#111b21] ml-10'
                        : 'rounded-r-lg rounded-bl-lg bg-white text-[#111b21] mr-10'
                        } ${message.status === 'failed' ? 'bg-red-50 border border-red-200' : ''} ${isHighlighted ? 'highlight-message' : ''}`}
                >
                {/* Reply Context */}
                {message.replyTo && (
                    <div 
                        onClick={() => {
                            // Scroll to the original message
                            const originalMsgElement = document.getElementById(`msg-${message.replyTo?.id}`);
                            if (originalMsgElement) {
                                originalMsgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Add highlight effect
                                originalMsgElement.classList.add('highlight-message-reply');
                                setTimeout(() => {
                                    originalMsgElement.classList.remove('highlight-message-reply');
                                }, 2000);
                            }
                        }}
                        className="mb-1 border-l-4 border-[#06cf9c] bg-black/5 p-2 rounded text-[12px] opacity-80 cursor-pointer hover:bg-black/10 transition-colors"
                        title="Go to original message"
                    >
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

                <div className={`absolute top-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'right-full mr-[10px]' : 'left-full ml-[10px]'}`}>
                    {!message.isDeleted && (
                        <div className="flex flex-wrap gap-1 bg-white shadow-md rounded-full p-1 border border-[#f0f2f5]">
                            <button
                                onClick={() => onReply?.(message)}
                                className="p-1.5 hover:bg-black/5 rounded-full text-[#667781] transition-colors"
                                title="Reply"
                            >
                                <Reply size={16} />
                            </button>
                            {isMe && !message.isVoiceMessage && (
                                <button
                                    onClick={() => onEdit?.(message)}
                                    className="p-1.5 hover:bg-black/5 rounded-full text-[#667781] transition-colors"
                                    title="Edit"
                                >
                                    <Pencil size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => onPin?.(message)}
                                className={`p-1.5 hover:bg-black/5 rounded-full transition-colors ${message.isPinned ? 'text-[#00a884]' : 'text-[#667781]'}`}
                                title={message.isPinned ? 'Unpin' : 'Pin'}
                            >
                                <Pin size={16} className={message.isPinned ? 'fill-current' : ''} />
                            </button>
                            {!isMe && (
                                <button
                                    onClick={() => message.id && (message.isHidden ? onUnhide?.(message.id) : onHide?.(message.id))}
                                    className={`p-1.5 hover:bg-black/5 rounded-full transition-colors ${message.isHidden ? 'text-[#00a884]' : 'text-[#667781]'}`}
                                    title={message.isHidden ? 'Unhide message' : 'Hide message'}
                                >
                                    {message.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                            )}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                                    className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                                {showDeleteMenu && (
                                    <div
                                        ref={deleteMenuRef}
                                        className="absolute top-full right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => {
                                                message.id && onDelete?.(message.id, 'me');
                                                setShowDeleteMenu(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Delete for me
                                        </button>
                                        {isMe && (
                                            <button
                                                onClick={() => {
                                                    message.id && onDelete?.(message.id, 'everyone');
                                                    setShowDeleteMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                Delete for everyone
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Message Content */}
                <div className="flex flex-col pr-2">
                    {message.isHidden ? (
                        <div className="flex items-center gap-2 py-1 text-[#667781] italic text-[13px]">
                            <EyeOff size={14} className="opacity-60" />
                            <span>This message is hidden</span>
                            <button
                                onClick={() => message.id && onUnhide?.(message.id)}
                                className="text-[#00a884] hover:underline text-[12px] ml-auto"
                            >
                                Show
                            </button>
                        </div>
                    ) : message.isDeleted ? (
                        <div className="flex items-center gap-2 py-1 text-[#667781] italic text-[13px]">
                            <span className="opacity-60 text-[12px]">🚫</span>
                            <span>This message was deleted</span>
                        </div>
                    ) : message.isVoiceMessage ? (
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
                    <div className="flex items-center gap-1 ml-auto pt-1 h-5">
                        <span className="text-[11px] text-[#667781] whitespace-nowrap">
                            {formatTimestamp(message.timestamp)}
                        </span>
                        {message.isEdited && (
                            <span className="text-[10px] text-[#667781] italic">
                                (edited)
                            </span>
                        )}

                        {isMe && message.status && (
                            <span className={`flex items-center text-[12px] transition-colors
                             ${message.status === 'read' ? 'text-[#53bdeb]'
                                    : message.status === 'failed' ? 'text-red-500'
                                        : message.status === 'pending'
                                            ? 'text-gray-400'
                                            : 'text-[#667781]'
                                }`
                            }
                            >
                                {message.status === 'pending' ? (
                                    <div className="w-[12px] h-[12px] border-2 border-[#667781]/20 border-t-[#667781] rounded-full animate-spin"></div>
                                ) : (
                                    {
                                        failed: '!',
                                        sent: '✓',
                                        delivered: '✓✓',
                                        read: '✓✓'
                                    }[message.status as 'failed' | 'sent' | 'delivered' | 'read']
                                )}
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
        </div >
    );
}
