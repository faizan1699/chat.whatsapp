'use client';

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Pin, Reply, Edit, Trash2, MoreVertical, Mic, Send, X, Eye, EyeOff, Phone, Video, Download, Volume2, Pause, Play, Pencil, ArrowUp, PinOff, CheckCheck, Check } from 'lucide-react';
import CheckIcon from './CheckIcon';
import { Message } from '@/types/message';

interface MessageItemProps {
    message: Message;
    isMe: boolean;
    recipientOnline?: boolean;
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
    failedMessagesCount?: number;
    onScrollToMessage?: (messageId: string) => void;
}

export default function MessageItem({
    message,
    isMe,
    recipientOnline = false,
    onRetry,
    onReply,
    onDelete,
    onPin,
    onEdit,
    onHide,
    onUnhide,
    isHighlighted,
    highlightKey,
    failedMessagesCount,
    onScrollToMessage
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

    const messageHiglighter = () => {
        const originalMsgElement = document.getElementById(`msg-${message.replyTo?.id}`);
        if (originalMsgElement) {
            originalMsgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            originalMsgElement.classList.add('highlight-message-reply');
            setTimeout(() => {
                originalMsgElement.classList.remove('highlight-message-reply');
            }, 2000);
        }
    }

    return (
        <div
            id={`msg-${message.id}`}
            className={`group flex w-full mb-1  ${isMe ? 'justify-end' : 'justify-start'} ${isHighlighted ? 'highlight-message' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className={`flex flex-col max-w-[85%] md:max-w-[65%] lg:max-w-[60%] xl:max-w-[55%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                    className={`flex flex-col px-2 py-1 shadow-sm relative w-full min-w-0 cursor-pointer ${isMe
                            ? 'rounded-l-lg rounded-br-lg bg-[#d9fdd3] text-[#111b21] ml-10'
                            : 'rounded-r-lg rounded-bl-lg bg-white text-[#111b21] mr-10'
                        } ${message.status === 'failed' ? 'bg-red-50 border border-red-200' : ''} ${isHighlighted ? 'highlight-message' : ''}`}
                    onClick={() => {
                        if (message.isPinned && message.id) {
                            onScrollToMessage?.(message.id);
                        }
                    }}
                >
                    {message.replyTo && (
                        <div
                            onClick={messageHiglighter}
                            className="mb-1 border-l-4 border-[#06cf9c] bg-black/5 p-2 rounded text-[12px] opacity-80 cursor-pointer hover:bg-black/10 transition-colors"
                            title="Go to original message"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Reply size={16} className="text-[#06cf9c]" />
                                <div>
                                    <p className="font-bold text-[#06cf9c]">{message.replyTo.from === message.from ? 'You' : message.replyTo.from}</p>
                                    <p className="truncate text-[#54656f]">{message.replyTo.message}</p>
                                </div>
                                {message.replyToMessageId && (
                                    <div className="text-xs text-[#06cf9c] italic">Replying</div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={`absolute top-1 z-10 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity ${isMe ? 'right-full mr-[10px]' : 'left-full ml-[10px]'}`}>
                        {!message.isDeleted && (
                            <div className="flex gap-1 bg-white shadow-md rounded-full p-1 border border-[#f0f2f5]">
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
                                    {message.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                </button>
                                {!isMe && (
                                    <button
                                        onClick={() => {
                                            if (message.id) {
                                                if (message.isHidden) {
                                                    onUnhide?.(message.id);
                                                } else {
                                                    onHide?.(message.id);
                                                }
                                            }
                                        }}
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
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] animate-in fade-in duration-200">
                                            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                                                <h3 className="text-lg font-semibold text-[#111b21] mb-4">Delete Message</h3>
                                                <p className="text-[#667781] text-sm mb-6">
                                                    Choose how you want to delete this message:
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (message.id) {
                                                                onDelete?.(message.id, 'me');
                                                            }
                                                            setShowDeleteMenu(false);
                                                        }}
                                                        className="w-full px-4 py-3 text-left text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                                                    >
                                                        <EyeOff size={16} />
                                                        <div>
                                                            <div className="font-medium">Hide for me</div>
                                                            <div className="text-xs text-gray-500">Message will be hidden only for you</div>
                                                        </div>
                                                    </button>
                                                    {isMe && (
                                                        <button
                                                            onClick={() => {
                                                                if (message.id) {
                                                                    onDelete?.(message.id, 'everyone');
                                                                }
                                                                setShowDeleteMenu(false);
                                                            }}
                                                            className="w-full px-4 py-3 text-left text-[13px] text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                                                        >
                                                            <Trash2 size={16} />
                                                            <div>
                                                                <div className="font-medium">Delete for everyone</div>
                                                                <div className="text-xs text-red-500">This action cannot be undone</div>
                                                            </div>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setShowDeleteMenu(false)}
                                                        className="w-full px-4 py-2 text-left text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mt-2"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
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
                            <p className="text-sm leading-tight whitespace-pre-wrap break-words overflow-wrap-anywhere py-0.5 min-w-[50px]">
                                {displayedMessage}
                                {hasMore && (
                                    <button
                                        onClick={handleSeeMore}
                                        className="ml-1 text-[#00a884] font-bold hover:underline text-[12px] flex-shrink-0"
                                    >
                                        Read more
                                    </button>
                                )}
                                {!hasMore && isLongMessage && visibleWords > 30 && (
                                    <button
                                        onClick={handleSeeLess}
                                        className="ml-1 text-[#00a884] font-bold hover:underline text-[12px] flex-shrink-0"
                                    >
                                        See less
                                    </button>
                                )}
                            </p>
                        )}

                        <div className="flex items-center gap-1 ml-auto pt-1 h-5">
                            <span className="text-[11px] text-[#667781] whitespace-nowrap">
                                {message.isPinned && <Pin size={10} className="inline-block mr-1" />}
                                {formatTimestamp(message.timestamp)}
                            </span>
                            {message.isEdited && (
                                <span className="text-[10px] text-[#667781] italic">
                                    (edited)
                                </span>
                            )}
                            {isMe && message.status && (
                                <span className={`flex items-center text-[12px] transition-colors
                             ${message.status === 'read' && recipientOnline ? 'text-[#53bdeb]'
                                        : message.status === 'delivered' && recipientOnline ? 'text-[#667781]'
                                            : message.status === 'sent' && recipientOnline ? 'text-[#667781]'
                                                : message.status === 'sent' && !recipientOnline ? 'text-[#667781]'
                                                    : message.status === 'delivered' && !recipientOnline ? 'text-[#667781]'
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
                                        <span className="flex items-center">
                                            {message.status === 'read' && recipientOnline ? (
                                                <Fragment>
                                                    <CheckCheck size={12} color="#53bdeb" className="ml-0.5" />
                                                </Fragment>
                                            ) : message.status === 'delivered' && recipientOnline ? (
                                                <Fragment>
                                                    <CheckIcon color="#667781" />
                                                    <CheckIcon color="#667781" className="ml-0.5" />
                                                </Fragment>
                                            ) : message.status === 'sent' && recipientOnline ? (
                                                <Fragment>
                                                    <CheckCheck size={14} />
                                                </Fragment>
                                            ) : (
                                                <Check size={12} />
                                            )}
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    {message.status === 'failed' && isMe && (failedMessagesCount || 0) === 1 && (
                        <button
                            onClick={() => onRetry?.(message)}
                            className="text-[10px] text-red-500 underline text-left mt-1 hover:text-red-600 transition-colors"
                        >
                            Failed to send. Click to retry.
                        </button>
                    )}
                    {message.status === 'failed' && isMe && (failedMessagesCount || 0) > 1 && (
                        <div className="text-[10px] text-orange-500 text-left mt-1">
                            Retrying failed messages automatically...
                        </div>
                    )}

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
