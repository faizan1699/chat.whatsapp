'use client';

import React, { Fragment, useEffect, useRef, useState } from 'react';
import MessageItem from './MessageItem';
import DateSeparator from './DateSeparator';
import MessageSkeleton from './MessageSkeleton';
import { Message, ReplyTo } from '@/types/message';

interface MessageListProps {
    messages: Message[];
    username: string;
    onRetry: (msg: Message) => void;
    onReply: (msg: Message) => void;
    onDelete: (id: string, type: 'me' | 'everyone') => void;
    onPin: (msg: Message) => void;
    onEdit: (msg: Message) => void;
    onHide?: (id: string) => void;
    onUnhide?: (id: string) => void;
    onReact?: (messageId: string, emoji: string) => void;
    highlightedMessageId?: string | null;
    loading?: boolean;
}

export default function MessageList({
    messages,
    username,
    onRetry,
    onReply,
    onDelete,
    onPin,
    onEdit,
    onHide,
    onUnhide,
    onReact,
    highlightedMessageId,
    loading
}: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageListRef = useRef<HTMLDivElement>(null);
    const [highlightKey, setHighlightKey] = useState<number>(0);
    const [autoScroll, setAutoScroll] = useState<boolean>(true);

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

    const handleScroll = () => {
        if (!messageListRef.current) return;
        
        const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
        
        setAutoScroll(isAtBottom);
    };

    useEffect(() => {
        if (autoScroll) {
            scrollToBottom();
        }
    }, [messages, autoScroll]);

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

    messages?.forEach((msg, idx) => {
        let msgDate: Date;
        
        try {
            msgDate = new Date(msg.timestamp);
            
            // Check if date is invalid
            if (isNaN(msgDate.getTime())) {
                console.warn('Invalid timestamp for message:', msg.id, msg.timestamp);
                // Use current date as fallback
                msgDate = new Date();
            }
        } catch (error) {
            console.error('Error parsing date for message:', msg.id, error);
            msgDate = new Date();
        }
        
        if (!lastDate || msgDate.toDateString() !== lastDate.toDateString()) {
            messagesWithSeparators.push(
                <DateSeparator key={`date-${msgDate.toDateString()}`} date={msgDate} />
            );
            lastDate = msgDate;
        }

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
            <div 
                className="relative z-10 flex h-full flex-col overflow-y-auto overflow-hidden p-4 space-y-2"
                onScroll={handleScroll}
            >
                {loading ? (
                    <MessageSkeleton count={8} />
                ) : (
                    <Fragment>
                        {messagesWithSeparators}
                        <div ref={messagesEndRef} />
                    </Fragment>
                )}
            </div>
        </div>
    );
}
