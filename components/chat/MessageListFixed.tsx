'use client';

import React, { useEffect, useRef } from 'react';
import WhatsAppMessageItem from './WhatsAppMessageItem';
import { Message } from '@/types/message';

interface MessageListProps {
    messages: Message[];
    username: string;
    onRetry: (msg: Message) => void;
    onReply: (msg: Message) => void;
    onDelete: (id: string, type: 'me' | 'everyone') => void;
    onPin: (msg: Message) => void;
    onEdit: (msg: Message) => void;
    onReact?: (messageId: string, emoji: string) => void;
    highlightedMessageId?: string | null;
}

export default function MessageList({
    messages,
    username,
    onRetry,
    onReply,
    onDelete,
    onPin,
    onEdit,
    onReact,
    highlightedMessageId
}: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="relative flex-1 overflow-hidden">
            <div className="chat-bg-pattern absolute inset-0 z-0 opacity-10"></div>
            <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4 space-y-2">
                {messages?.map((msg, idx) => (
                    <WhatsAppMessageItem
                        key={msg.id || idx}
                        message={{
                            id: msg.id || `msg-${idx}`,
                            content: msg.content || msg.message,
                            from: msg.from,
                            to: msg.to,
                            timestamp: msg.timestamp,
                            status: (msg.status === 'failed' || msg.status === 'sending') ? 'pending' : (msg.status || 'sent') as 'pending' | 'sent' | 'delivered' | 'read',
                            isVoiceMessage: msg.isVoiceMessage,
                            audioUrl: msg.audioUrl,
                            audioDuration: msg.audioDuration,
                            isDeleted: msg.isDeleted,
                            isEdited: msg.isEdited,
                            isPinned: msg.isPinned,
                            replyTo: msg.replyTo,
                            reactions: msg.reactions
                        }}
                        isOwn={msg.from === username}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={(id: string) => onDelete?.(id, 'me')}
                        onForward={undefined}
                        onPin={(msg: any) => onPin?.(msg)}
                        onReact={onReact}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
