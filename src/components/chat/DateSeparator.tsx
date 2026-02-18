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
        
        if (isToday) return 'Today';
        if (isYesterday) return 'Yesterday';
        return messageDate.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="flex items-center justify-center my-4">
            <div className="bg-[#e9edef] px-3 py-1 rounded-full">
                <span className="text-[12px] font-medium text-[#667781]">
                    {formatDateLabel(date)}
                </span>
            </div>
        </div>
    );
}
