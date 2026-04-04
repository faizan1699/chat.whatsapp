'use client';

import React, { Fragment, useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import DateSeparator from './DateSeparator';
import StickyTimestamp from './StickyTimestamp';
import { ChatSkeleton } from '../skeletons';
import { Message, ReplyTo } from '@/types/message';

interface MessageListProps {
    messages: Message[];
    username: string;
    selectedUser: string;
    recipientOnline?: boolean;
    isLoading?: boolean;
    onRetry: (msg: Message) => void;
    onReply: (msg: Message) => void;
    onDelete: (id: string, type: 'me' | 'everyone') => void;
    onPin: (msg: Message) => void;
    onEdit: (msg: Message) => void;
    onReact?: (messageId: string, emoji: string) => void;
    highlightedMessageId?: string | null;
    onScrollToMessage?: (messageId: string) => void;
}

export default function MessageList({
    messages,
    username,
    selectedUser,
    recipientOnline = false,
    isLoading = false,
    onRetry,
    onReply,
    onDelete,
    onPin,
    onEdit,
    onReact,
    highlightedMessageId,
    onScrollToMessage
}: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageListRef = useRef<HTMLDivElement>(null);
    const [highlightKey, setHighlightKey] = useState(0);
    const [autoScroll, setAutoScroll] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToMessage = (messageId: string) => {
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (messageElement && messageListRef.current) {
            const messageRect = messageElement.getBoundingClientRect();
            const containerRect = messageListRef.current.getBoundingClientRect();
            
            const isVisible = messageRect.top >= containerRect.top && 
                            messageRect.bottom <= containerRect.bottom;
            
            if (!isVisible) {
                messageElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; 
        
        setAutoScroll(isAtBottom);
    };
    useEffect(() => {
        if (autoScroll) {
            scrollToBottom();
        }
    }, [messages, autoScroll]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (messages.length > 0) {
                scrollToBottom();
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [messages.length]);

    useEffect(() => {
        if (highlightedMessageId) {
            setHighlightKey(prev => prev + 1);
            setTimeout(() => {
                scrollToMessage(highlightedMessageId);
            }, 100);
            
            const clearTimer = setTimeout(() => {
            }, 2500);
            
            return () => clearTimeout(clearTimer);
        }
    }, [highlightedMessageId]);

    const messagesWithSeparators: React.ReactNode[] = [];
    let lastDate: Date | null = null;

    const sortedMessages = [...(messages || [])].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ).filter(msg => !msg.isHidden && !msg.hideFromAll);

    sortedMessages?.forEach((msg, idx) => {
        const msgDate = new Date(msg.timestamp);
        
        if (!lastDate || msgDate.toDateString() !== lastDate.toDateString()) {
            messagesWithSeparators.push(
                <DateSeparator key={`date-${msgDate.toDateString()}-${msg.id || idx}`} date={msgDate} />
            );
            lastDate = msgDate;
        }

        messagesWithSeparators.push(
            <MessageItem
                key={msg.id || idx}
                message={msg}
                isMe={msg.from === username}
                recipientOnline={recipientOnline}
                onRetry={onRetry}
                onReply={onReply}
                onDelete={(id: string) => onDelete?.(id, 'me')}
                onPin={onPin}
                onEdit={onEdit}
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
                <Fragment>
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
                </Fragment>
            )}
        </div>
    );
}
