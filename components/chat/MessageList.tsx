'use client';

import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import DateSeparator from './DateSeparator';
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

    // Group messages by date and add date separators
    const messagesWithSeparators: React.ReactNode[] = [];
    let lastDate: Date | null = null;

    messages?.forEach((msg, idx) => {
        const msgDate = new Date(msg.timestamp);
        
        // Add date separator if date changed
        if (!lastDate || msgDate.toDateString() !== lastDate.toDateString()) {
            messagesWithSeparators.push(
                <DateSeparator key={`date-${msgDate.toDateString()}`} date={msgDate} />
            );
            lastDate = msgDate;
        }

        // Add message
        messagesWithSeparators.push(
            <MessageItem
                key={msg.id || idx}
                message={msg}
                isMe={msg.from === username}
                onRetry={onRetry}
                onReply={onReply}
                onDelete={(id: string) => onDelete?.(id, 'me')}
                onPin={onPin}
                onEdit={onEdit}
                isHighlighted={highlightedMessageId === msg.id}
            />
        );
    });

    return (
        <div className="relative flex-1 overflow-hidden">
            <div className="chat-bg-pattern absolute inset-0 z-0 opacity-10"></div>
            <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4 space-y-2">
                {messagesWithSeparators}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
