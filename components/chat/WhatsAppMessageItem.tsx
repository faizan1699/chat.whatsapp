'use client';

import React, { useState } from 'react';
import { Check, CheckCheck, Clock, Reply, MoreVertical, Smile, Paperclip, Mic, X, Edit2, Trash2, Forward, Star, Pin } from 'lucide-react';

interface MessageProps {
    message: {
        id: string;
        content: string;
        from: string;
        to: string;
        timestamp: string | Date;
        status: 'pending' | 'sent' | 'delivered' | 'read';
        isVoiceMessage?: boolean;
        audioUrl?: string;
        audioDuration?: number;
        isDeleted?: boolean;
        isEdited?: boolean;
        isPinned?: boolean;
        replyTo?: any;
        reactions?: Record<string, string[]>;
    };
    isOwn: boolean;
    onReply?: (message: any) => void;
    onEdit?: (message: any) => void;
    onDelete?: (messageId: string) => void;
    onForward?: (message: any) => void;
    onPin?: (messageId: string) => void;
    onReact?: (messageId: string, emoji: string) => void;
}

export default function WhatsAppMessageItem({
    message,
    isOwn,
    onReply,
    onEdit,
    onDelete,
    onForward,
    onPin,
    onReact
}: MessageProps) {
    const [showActions, setShowActions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const formatTime = (timestamp: string | Date) => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const formatDate = (timestamp: string | Date) => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    };

    const getStatusIcon = () => {
        switch (message.status) {
            case 'pending':
                return <Clock className="w-3 h-3 text-gray-400" />;
            case 'sent':
                return <Check className="w-3 h-3 text-gray-400" />;
            case 'delivered':
                return <CheckCheck className="w-3 h-3 text-gray-400" />;
            case 'read':
                return <CheckCheck className="w-3 h-3 text-blue-500" />;
            default:
                return null;
        }
    };

    const handlePlayPause = () => {
        if (message.audioUrl) {
            setIsPlaying(!isPlaying);
            // Audio play/pause logic here
        }
    };

    const emojis = ['❤️', '👍', '😂', '😮', '😢', '😡'];

    return (
        <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
            {/* Message Container */}
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg relative`}>
                {!isOwn && (
                    <div className="flex items-end mb-1">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium">
                                {message.from.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">
                                {message.from}
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatDate(message.timestamp)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Bubble */}
                <div className={`relative px-4 py-2 rounded-2xl ${
                    isOwn 
                        ? 'bg-[#dcf8c6] text-gray-800 rounded-br-2xl' 
                        : 'bg-white text-gray-800 rounded-bl-2xl shadow-sm'
                } ${message.isDeleted ? 'opacity-60' : ''}`}>
                    
                    {/* Pinned Indicator */}
                    {message.isPinned && (
                        <div className="absolute -top-6 left-2 flex items-center text-xs text-gray-500">
                            <Pin className="w-3 h-3 fill-current" />
                            <span className="ml-1">Pinned</span>
                        </div>
                    )}

                    {/* Reply Reference */}
                    {message.replyTo && (
                        <div className="mb-2 p-2 bg-gray-100 rounded-lg text-xs text-gray-600 border-l-2 border-blue-500">
                            <div className="font-medium">Replying to {message.replyTo.from}</div>
                            <div className="truncate">{message.replyTo.content}</div>
                        </div>
                    )}

                    {/* Deleted Message */}
                    {message.isDeleted ? (
                        <div className="italic text-gray-500 text-sm">
                            This message was deleted
                        </div>
                    ) : (
                        <>
                            {/* Text Message */}
                            {!message.isVoiceMessage && (
                                <div className="text-sm break-words">
                                    {message.content}
                                </div>
                            )}

                            {/* Voice Message */}
                            {message.isVoiceMessage && message.audioUrl && (
                                <div className="flex items-center space-x-3 bg-gray-900 rounded-lg px-3 py-2">
                                    <button
                                        onClick={handlePlayPause}
                                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                                    >
                                        {isPlaying ? (
                                            <X className="w-4 h-4 text-white" />
                                        ) : (
                                            <Mic className="w-4 h-4 text-white" />
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <div className="text-white text-sm">Voice Message</div>
                                        {message.audioDuration && (
                                            <div className="text-xs text-gray-400">
                                                {Math.floor(message.audioDuration / 60)}:{(message.audioDuration % 60).toString().padStart(2, '0')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-white text-xs">
                                        {formatTime(message.timestamp)}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Message Actions */}
                    <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <div className="bg-white rounded-lg shadow-lg p-1 flex space-x-1">
                            {onReply && (
                                <button
                                    onClick={() => onReply(message)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Reply"
                                >
                                    <Reply className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                            {onForward && (
                                <button
                                    onClick={() => onForward(message)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Forward"
                                >
                                    <Forward className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                            {isOwn && onEdit && (
                                <button
                                    onClick={() => onEdit(message)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                            {isOwn && onDelete && (
                                <button
                                    onClick={() => onDelete(message.id)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                            {onPin && (
                                <button
                                    onClick={() => onPin(message.id)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title={message.isPinned ? "Unpin" : "Pin"}
                                >
                                    <Pin className={`w-4 h-4 text-gray-600 ${message.isPinned ? 'fill-current' : ''}`} />
                                </button>
                            )}
                            {onReact && (
                                <button
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    title="React"
                                >
                                    <Smile className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Emoji Picker */}
                    {showEmojiPicker && onReact && (
                        <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg p-2">
                            <div className="grid grid-cols-6 gap-1">
                                {emojis.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            onReact(message.id, emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message Reactions */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                                <div
                                    key={emoji}
                                    className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-xs"
                                >
                                    <span>{emoji}</span>
                                    <span className="ml-1 text-gray-600">{users.length}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status and Time for Own Messages */}
                {isOwn && (
                    <div className="flex items-center justify-end mt-1 space-x-2">
                        {message.isEdited && (
                            <span className="text-xs text-gray-500">edited</span>
                        )}
                        <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                                {formatTime(message.timestamp)}
                            </span>
                            {getStatusIcon()}
                        </div>
                    </div>
                )}

                {/* Time for Received Messages */}
                {!isOwn && (
                    <div className="flex items-center justify-start mt-1 space-x-2">
                        <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                        </span>
                        {getStatusIcon()}
                    </div>
                )}
            </div>
        </div>
    );
}
