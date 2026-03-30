'use client';

import React, { useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import DateSeparator from './DateSeparator';
import StickyTimestamp from './StickyTimestamp';
import { ChatSkeleton } from '../skeletons';
import { Message, ReplyTo } from '@/types/message';

interface MessageListProps {
    messages: Message[];
    username: string;
    selectedUser: string;
    isLoading?: boolean;
    onRetry: (msg: Message) => void;
    onReply: (msg: Message) => void;
    onDelete: (id: string, type: 'me' | 'everyone') => void;
    onPin: (msg: Message) => void;
    onEdit: (msg: Message) => void;
    onReact?: (messageId: string, emoji: string) => void;
    onHide?: (id: string) => void;
    onUnhide?: (id: string) => void;
    highlightedMessageId?: string | null;
    onScrollToMessage?: (messageId: string) => void;
}

export default function MessageList({
    messages,
    username,
    selectedUser,
    isLoading = false,
    onRetry,
    onReply,
    onDelete,
    onPin,
    onEdit,
    onReact,
    onHide,
    onUnhide,
    highlightedMessageId,
    onScrollToMessage
}: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageListRef = useRef<HTMLDivElement>(null);
    const [highlightKey, setHighlightKey] = useState(0);
    const [autoScroll, setAutoScroll] = useState(true);

    // Calculate failed messages count
    const failedMessagesCount = messages.filter(m => m.status === 'failed').length;

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

    // Handle scroll events to detect user scrolling
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; // 50px threshold
        
        setAutoScroll(isAtBottom);
    };

    // Auto-scroll to bottom when new messages arrive (only if auto-scroll is enabled)
    useEffect(() => {
        if (autoScroll) {
            scrollToBottom();
        }
    }, [messages, autoScroll]);

    // Scroll to bottom on initial load when container is ready
    useEffect(() => {
        const timer = setTimeout(() => {
            if (messages.length > 0) {
                scrollToBottom();
            }
        }, 100); // Small delay to ensure container is rendered
        return () => clearTimeout(timer);
    }, [messages.length]);

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
                onScrollToMessage={onScrollToMessage}
            />
        );
    });

    return (
        <div className="relative flex-1 overflow-hidden">
            {isLoading && messages.length === 0 ? (
                <ChatSkeleton />
            ) : (
                <>
                    <StickyTimestamp 
                        messages={messages}
                        username={username}
                        selectedUser={selectedUser}
                    />
                    <div 
                        className="chat-messages-container relative z-10 flex h-full flex-col overflow-y-auto p-4 space-y-2"
                        onScroll={handleScroll}
                    >
                        {messagesWithSeparators}
                        <div ref={messagesEndRef} />
                    </div>
                </>
            )}
        </div>
    );
}
