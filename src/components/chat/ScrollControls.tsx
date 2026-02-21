'use client';

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function ScrollControls() {
    const handleScrollToTop = () => {
        if (typeof window !== 'undefined' && (window as any).scrollToTop) {
            (window as any).scrollToTop();
        }
    };

    const handleScrollToBottom = () => {
        if (typeof window !== 'undefined' && (window as any).scrollToBottom) {
            (window as any).scrollToBottom();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            <button
                onClick={handleScrollToTop}
                className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full shadow-lg transition-colors"
                title="Scroll to top"
            >
                <ArrowUp size={20} />
            </button>
            <button
                onClick={handleScrollToBottom}
                className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full shadow-lg transition-colors"
                title="Scroll to bottom"
            >
                <ArrowDown size={20} />
            </button>
        </div>
    );
}
