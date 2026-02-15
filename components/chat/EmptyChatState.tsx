'use client';

import React from 'react';

export default function EmptyChatState() {
    return (
        <div className="flex h-full flex-col bg-[#f0f2f5]">

            {/* CENTER CONTENT */}
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mb-10 w-[400px]">
                    <img
                        src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa69ar96s3m.png"
                        alt="WhatsApp Web"
                        className="mx-auto"
                    />
                </div>

                <h1 className="mb-4 text-3xl font-light text-[#41525d]">
                    WhatsApp Web
                </h1>

                <p className="max-w-[500px] text-sm leading-relaxed text-[#667781]">
                    Send and receive messages without keeping your phone online.
                    <br />
                    Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                </p>
            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-center gap-1 pb-6 text-sm text-[#8696a0]">
                <svg viewBox="0 0 24 24" height="14" width="14" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                </svg>
                <span>End-to-end encrypted</span>
            </div>

        </div>
    );
}
