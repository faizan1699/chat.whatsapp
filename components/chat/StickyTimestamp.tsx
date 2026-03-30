'use client';

import React, { useState, useEffect, useRef } from 'react';

interface StickyTimestampProps {
    messages: any[];
    username: string;
    selectedUser: string;
}

export default function StickyTimestamp({ messages, username, selectedUser }: StickyTimestampProps) {
    const [visibleDate, setVisibleDate] = useState<string>('');
    const [isSticky, setIsSticky] = useState(false);
    const [messageList, setMessageList] = useState<HTMLDivElement | null>(null);
    const dateElementsRef = useRef<Map<string, HTMLElement>>(new Map());

    const formatDateLabel = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const isToday = messageDate.toDateString() === now.toDateString();
        const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === messageDate.toDateString();
        
        // Check if within current week (last 7 days)
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const isWithinWeek = messageDate >= weekAgo && !isToday && !isYesterday;
        
        // Check if older than a month
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const isOlderThanMonth = messageDate < monthAgo;
        
        if (isToday) return 'Today';
        if (isYesterday) return 'Yesterday';
        if (isWithinWeek) return messageDate.toLocaleDateString([], { weekday: 'long' });
        if (isOlderThanMonth) return '1 month ago';
        
        // For dates between 1 week and 1 month ago
        return messageDate.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get unique dates for current chat messages
    const getUniqueDates = () => {
        const dates = new Set<string>();
        messages.forEach(msg => {
            const isCurrentChat = (msg.from === username && msg.to === selectedUser) || 
                                (msg.from === selectedUser && msg.to === username);
            if (isCurrentChat && msg.timestamp) {
                const dateKey = new Date(msg.timestamp).toDateString();
                dates.add(dateKey);
            }
        });
        return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    };

    // Check which date should be visible based on scroll position
    const updateVisibleDate = () => {
        if (!messageList) return;

        const containerRect = messageList.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;

        let visibleDateKey = '';
        let foundAny = false;

        dateElementsRef.current.forEach((element, dateKey) => {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const elementTop = rect.top;
            const elementBottom = rect.bottom;

            // Check if date separator is visible in viewport
            const isVisible = elementTop < containerBottom && elementBottom > containerTop;

            if (isVisible) {
                foundAny = true;
                // If this is the first visible date from top, use it
                if (!visibleDateKey || elementTop < containerTop + 100) {
                    visibleDateKey = dateKey;
                }
            }
        });

        // If no date separators are visible, show the most recent one
        if (!foundAny) {
            const dates = getUniqueDates();
            if (dates.length > 0) {
                visibleDateKey = dates[dates.length - 1];
            }
        }

        if (visibleDateKey) {
            const date = new Date(visibleDateKey);
            setVisibleDate(formatDateLabel(date));
            setIsSticky(foundAny);
        }
    };

    useEffect(() => {
        const messageListElement = document.querySelector('.chat-messages-container') as HTMLDivElement;
        if (messageListElement) {
            setMessageList(messageListElement);
            
            // Find all date separators
            const dateSeparators = messageListElement.querySelectorAll('[data-date-separator]');
            dateElementsRef.current.clear();
            
            dateSeparators.forEach((separator) => {
                const dateKey = separator.getAttribute('data-date-separator');
                if (dateKey) {
                    dateElementsRef.current.set(dateKey, separator as HTMLElement);
                }
            });

            // Update visible date on scroll
            const handleScroll = () => updateVisibleDate();
            messageListElement.addEventListener('scroll', handleScroll);
            
            // Initial update
            updateVisibleDate();

            return () => {
                messageListElement.removeEventListener('scroll', handleScroll);
            };
        }
    }, [messages, username, selectedUser]);

    // Update when messages change
    useEffect(() => {
        const timer = setTimeout(() => {
            updateVisibleDate();
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    if (!visibleDate) return null;

    return (
        <div className={`sticky top-0 z-20 bg-[#efeae2] py-2 px-4 transition-all duration-200 ${
            isSticky ? 'shadow-sm border-b border-[#d9d9d9]' : ''
        }`}>
            <div className="flex items-center justify-center">
                <div className="bg-[#e9edef] px-3 py-1 rounded-full">
                    <span className="text-[12px] font-medium text-[#667781]">
                        {visibleDate}
                    </span>
                </div>
            </div>
        </div>
    );
}
