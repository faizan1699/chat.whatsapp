'use client';

import React from 'react';

interface SimpleMessageProps {
    message: any;
    isOwn: boolean;
}

export default function SimpleWhatsAppMessage({ message, isOwn }: SimpleMessageProps) {
    const formatTime = (timestamp: string | Date) => {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getStatusIcon = () => {
        switch (message.status) {
            case 'pending':
                return <span className="text-gray-400 text-xs">⏳</span>;
            case 'sent':
                return <span className="text-gray-400 text-xs">✓</span>;
            case 'delivered':
                return <span className="text-gray-400 text-xs">✓✓</span>;
            case 'read':
                return <span className="text-blue-500 text-xs">✓✓</span>;
            case 'failed':
                return <span className="text-red-500 text-xs">✗</span>;
            default:
                return null;
        }
    };

    return (
        <div className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
            {/* Message Container */}
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg relative`}>
                {!isOwn && (
                    <div className="flex items-end mb-1">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium">
                                {message.from?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        </div>
                        <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">
                                {message.from}
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleDateString()}
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
                            <span>📌</span>
                            <span className="ml-1">Pinned</span>
                        </div>
                    )}

                    {/* Reply Reference */}
                    {message.replyTo && (
                        <div className="mb-2 p-2 bg-gray-100 rounded-lg text-xs text-gray-600 border-l-2 border-blue-500">
                            <div className="font-medium">Replying to {message.replyTo.from}</div>
                            <div className="truncate">{message.replyTo.message}</div>
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
                                    {message.message}
                                </div>
                            )}

                            {/* Voice Message */}
                            {message.isVoiceMessage && message.audioUrl && (
                                <div className="flex items-center space-x-3 bg-gray-900 rounded-lg px-3 py-2">
                                    <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                                        <span className="text-white">🎤</span>
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
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Reply">
                                <span>↩️</span>
                            </button>
                            {isOwn && (
                                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Delete">
                                    <span>🗑️</span>
                                </button>
                            )}
                        </div>
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
        </div>
    );
}
