'use client';

import React from 'react';

interface DateSeparatorProps {
    date: Date;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
    const formatDateLabel = (date: Date) => {
        try {
            const now = new Date();
            const messageDate = new Date(date);
            
            // Check if date is invalid
            if (isNaN(messageDate.getTime())) {
                console.warn('Invalid date in DateSeparator:', date);
                return 'Unknown Date';
            }
            
            const isToday = messageDate.toDateString() === now.toDateString();
            const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === messageDate.toDateString();
            
            if (isToday) return 'Today';
            if (isYesterday) return 'Yesterday';
            return messageDate.toLocaleDateString([], {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Unknown Date';
        }
    };

    return (
        <div className="flex items-center justify-center my-4 sticky top-0 z-20">
            <div className="bg-gray-100 px-3 py-1 rounded-full shadow-soft">
                <span className="text-[12px] font-medium text-gray-600">
                    {formatDateLabel(date)}
                </span>
            </div>
        </div>
    );
}
