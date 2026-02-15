'use client';

import React, { useEffect, useRef } from 'react';
import Typed from 'typed.js';

export default function FullPageLoader() {
    const el = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const typed = new Typed(el.current, {
            strings: [
                'Initializing NexChat...',
                'Connecting to servers...',
                'Securing your connection...',
                'Preparing your workspace...',
                'Loading...'
            ],
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 1000,
            loop: true,
            showCursor: true,
            cursorChar: '|',
        });

        return () => {
            typed.destroy();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#00a884] overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/5 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo or Icon */}
                <div className="mb-8 relative">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#00a884" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    {/* Ring animation around logo */}
                    <div className="absolute inset-[-10px] border-4 border-white/30 rounded-full animate-ping"></div>asdfadsfasdfa
                </div>

                {/* Typed Text */}
                <div className="h-12 flex items-center">
                    <span
                        ref={el}
                        className="text-white text-xl md:text-2xl font-medium tracking-wide drop-shadow-md"
                    ></span>
                </div>

                {/* Progress bar simulation */}
                <div className="mt-8 w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full animate-progress-indeterminate"></div>
                </div>

                <p className="mt-4 text-white/60 text-xs font-bold uppercase tracking-[0.2em]">
                    Version 1.0.0
                </p>
            </div>
        </div>
    );
}
