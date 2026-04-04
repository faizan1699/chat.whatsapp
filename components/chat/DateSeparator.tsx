'use client';

import React from 'react';

interface DateSeparatorProps {
    date: Date;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
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

    return (
        <div 
            className="flex items-center justify-center"
            data-date-separator={date.toDateString()}
        >
            <div className="px-3 py-1 rounded-full">
                <span className="text-[12px] font-medium text-[#667781]">
                    {formatDateLabel(date)}
                </span>
            </div>
        </div>
    );
}
