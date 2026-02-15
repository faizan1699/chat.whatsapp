'use client';

import React, { useEffect, useState } from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';

interface CallNotificationProps {
    message: string;
    type: 'start' | 'end' | 'error';
    onClose: () => void;
}

export default function CallNotification({ message, type, onClose }: CallNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for transition
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        start: 'bg-[#00a884] shadow-emerald-500/20',
        end: 'bg-red-500 shadow-red-500/20',
        error: 'bg-amber-500 shadow-amber-500/20'
    };

    const icons = {
        start: <Info size={18} />,
        end: <X size={18} />,
        error: <AlertTriangle size={18} />
    };

    return (
        <div className={`fixed top-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/20 px-6 py-2.5 text-white shadow-2xl transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'
            } ${colors[type]}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                {icons[type]}
            </span>
            <span className="text-sm font-semibold tracking-wide capitalize">{message}</span>
            <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="ml-2 rounded-full p-1 transition-colors hover:bg-white/20">
                <X size={14} />
            </button>
        </div>
    );
}
