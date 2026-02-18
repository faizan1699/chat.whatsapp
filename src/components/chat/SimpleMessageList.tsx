'use client';

import React, { useEffect, useRef } from 'react';
import SimpleWhatsAppMessage from './SimpleWhatsAppMessage';

interface SimpleMessageListProps {
    messages: any[];
    username: string;
    onRetry: (msg: any) => void;
    onReply: (msg: any) => void;
    onDelete: (id: string, type: 'me' | 'everyone') => void;
    onPin: (msg: any) => void;
    onEdit: (msg: any) => void;
    onReact?: (messageId: string, emoji: string) => void;
    highlightedMessageId?: string | null;
}

export default function SimpleMessageList({
    messages,
    username,
    onRetry,
    onReply,
    onDelete,
    onPin,
    onEdit,
    onReact,
    highlightedMessageId
}: SimpleMessageListProps) {
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
                    <SimpleWhatsAppMessage
                        key={msg.id || idx}
                        message={msg}
                        isOwn={msg.from === username}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
