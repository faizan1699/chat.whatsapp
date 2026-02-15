'use client';

import React from 'react';
import VideoCall from '../video/VideoCall';

interface AuthOverlayProps {
    username: string;
    onUsernameCreated: (username: string) => void;
    onClearData: () => void;
}

export default function AuthOverlay({ username, onUsernameCreated, onClearData }: AuthOverlayProps) {
    if (username !== "") return null;

    return (
        <div className="fixed inset-0 z-[200]">
            <VideoCall
                username=""
                onUsernameCreated={onUsernameCreated}
                onEndCall={() => { }}
                showEndCallButton={false}
                onClearData={onClearData}
            />
        </div>
    );
}
