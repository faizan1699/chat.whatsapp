'use client';

import React, { useEffect, useRef, useState } from 'react';
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
    onHide?: (id: string) => void;
    onUnhide?: (id: string) => void;
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
    onHide,
    onUnhide,
    highlightedMessageId
}: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageListRef = useRef<HTMLDivElement>(null);
    const [highlightKey, setHighlightKey] = useState(0);

    // Scroll to bottom and/or highlighted message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToMessage = (messageId: string) => {
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (messageElement && messageListRef.current) {
            const messageRect = messageElement.getBoundingClientRect();
            const containerRect = messageListRef.current.getBoundingClientRect();
            
            // Check if message is visible in viewport
            const isVisible = messageRect.top >= containerRect.top && 
                            messageRect.bottom <= containerRect.bottom;
            
            if (!isVisible) {
                // Scroll message into view with some padding
                messageElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Scroll to highlighted message when it changes
    useEffect(() => {
        if (highlightedMessageId) {
            // Increment highlight key to re-trigger animation
            setHighlightKey(prev => prev + 1);
            // Small delay to ensure message is rendered
            setTimeout(() => {
                scrollToMessage(highlightedMessageId);
            }, 100);
            
            // Clear highlight after animation completes (2.5 seconds)
            const clearTimer = setTimeout(() => {
                // This will be handled by parent component
            }, 2500);
            
            return () => clearTimeout(clearTimer);
        }
    }, [highlightedMessageId]);

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
                onHide={onHide}
                onUnhide={onUnhide}
                isHighlighted={highlightedMessageId === msg.id}
                highlightKey={highlightKey}
            />
        );
    });

    return (
        <div className="relative flex-1 overflow-hidden">
            <div ref={messageListRef} className="chat-bg-pattern absolute inset-0 z-0 opacity-10"></div>
            <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4 space-y-2">
                {messagesWithSeparators}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
