'use client';

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { screenWidthChecker } from '../../utils/window';

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
    initialWidth = 300,
    minWidth = 250,
    maxWidth = 550
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
        if (!screenWidthChecker(768)) return;

        if (newWidth < minWidth) newWidth = minWidth;
        if (newWidth > maxWidth) newWidth = maxWidth;

        setSidebarWidth(newWidth);
    };

    return (
        <Fragment>
            <div
                style={{
                    width: selectedUser
                        ? (screenWidthChecker(768) ? `${sidebarWidth}px` : undefined)
                        : (screenWidthChecker(768) ? `${sidebarWidth}px` : '100%')
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
        </Fragment>
    );
}
