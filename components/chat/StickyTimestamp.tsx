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

        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const isWithinWeek = messageDate >= weekAgo && !isToday && !isYesterday;

        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const isOlderThanMonth = messageDate < monthAgo;

        if (isToday) return 'Today';
        if (isYesterday) return 'Yesterday';
        if (isWithinWeek) return messageDate.toLocaleDateString([], { weekday: 'long' });
        if (isOlderThanMonth) return '1 month ago';

        return messageDate.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

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

    const updateVisibleDate = () => {
        if (!messageList) return;

        const containerRect = messageList.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;

        let visibleDateKey = '';
        let foundAny = false;
        let firstVisibleFromTop: { dateKey: string; top: number } | null = null;

        dateElementsRef.current.forEach((element, dateKey) => {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const elementTop = rect.top;
            const elementBottom = rect.bottom;

            const isVisible = elementTop < containerBottom && elementBottom > containerTop;

            if (isVisible) {
                foundAny = true;

                if (firstVisibleFromTop === null || elementTop < firstVisibleFromTop.top) {
                    firstVisibleFromTop = { dateKey, top: elementTop };
                }
            }
        });

        if (firstVisibleFromTop && firstVisibleFromTop?.top <= containerTop + 50) {
            setVisibleDate('');
            setIsSticky(false);
            return;
        }

        if (!foundAny) {
            const dates = getUniqueDates();
            if (dates.length > 0) {
                visibleDateKey = dates[dates.length - 1];
            }
        } else if (firstVisibleFromTop) {
            visibleDateKey = firstVisibleFromTop.dateKey;
        }

        if (visibleDateKey) {
            const date = new Date(visibleDateKey);
            setVisibleDate(formatDateLabel(date));
            setIsSticky(foundAny);
        } else {
            setVisibleDate('');
            setIsSticky(false);
        }
    };

    useEffect(() => {
        const messageListElement = document.querySelector('.chat-messages-container') as HTMLDivElement;
        if (messageListElement) {
            setMessageList(messageListElement);

            const dateSeparators = messageListElement.querySelectorAll('[data-date-separator]');
            dateElementsRef.current.clear();

            dateSeparators.forEach((separator) => {
                const dateKey = separator.getAttribute('data-date-separator');
                if (dateKey) {
                    dateElementsRef.current.set(dateKey, separator as HTMLElement);
                }
            });

            const handleScroll = () => updateVisibleDate();
            messageListElement.addEventListener('scroll', handleScroll);
            updateVisibleDate();

            return () => {
                messageListElement.removeEventListener('scroll', handleScroll);
            };
        }
    }, [messages, username, selectedUser]);

    useEffect(() => {
        const timer = setTimeout(() => {
            updateVisibleDate();
        }, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    if (!visibleDate) return null;

    return (
        <div className={`sticky top-0 z-20 bg-[#efeae2] py-2 px-4 transition-all duration-200 ${isSticky ? 'shadow-sm border-b border-[#d9d9d9]' : ''
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
