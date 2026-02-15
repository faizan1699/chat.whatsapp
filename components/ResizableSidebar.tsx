'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ResizableSidebarProps {
    children: React.ReactNode;
    selectedUser: string | null;
    initialWidth?: number;
    minWidth?: number;
    maxWidth?: number;
}

export default function ResizableSidebar({
    children,
    selectedUser,
    initialWidth = 400,
    minWidth = 280,
    maxWidth = 600
}: ResizableSidebarProps) {
    const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
    const isResizing = useRef(false);

    const startResizing = (e: React.MouseEvent) => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const stopResizing = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;

        let newWidth = e.clientX;
        const mdBreakpoint = 768;
        if (window.innerWidth < mdBreakpoint) return;

        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxWidth) newWidth = maxWidth;

        setSidebarWidth(newWidth);
    };

    return (
        <>
            <div
                style={{
                    width: selectedUser
                        ? (typeof window !== 'undefined' && window.innerWidth >= 768 ? `${sidebarWidth}px` : undefined)
                        : (typeof window !== 'undefined' && window.innerWidth >= 768 ? `${sidebarWidth}px` : '100%')
                }}
                className={`flex flex-col border-r border-[#e9edef] bg-white transition-all duration-0 ${selectedUser ? 'hidden md:flex w-full' : 'w-full'}`}
            >
                {children}
            </div>
            {/* Resize Handle */}
            <div
                onMouseDown={startResizing}
                className="hidden md:block w-[4px] h-full cursor-col-resize hover:bg-[#00a884] transition-colors bg-transparent z-30 -ml-[2px]"
            />
        </>
    );
}
