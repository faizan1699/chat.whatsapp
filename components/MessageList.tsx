'use client';

import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

interface Message {
    id?: string;
    from: string;
    to: string;
    message: string;
    timestamp: Date;
    status?: 'pending' | 'sent' | 'failed';
}

interface MessageListProps {
    messages: Message[];
    username: string;
    onRetry: (msg: Message) => void;
}

export default function MessageList({ messages, username, onRetry }: MessageListProps) {
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
                    <MessageItem
                        key={msg.id || idx}
                        message={msg}
                        isMe={msg.from === username}
                        onRetry={onRetry}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
