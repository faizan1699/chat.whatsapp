'use client';

import React from 'react';
import VideoCall from './VideoCall';

interface AuthOverlayProps {
    username: string;
    onUsernameCreated: (username: string) => void;
}

export default function AuthOverlay({ username, onUsernameCreated }: AuthOverlayProps) {
    if (username !== "") return null;

    return (
        <div className="fixed inset-0 z-[200]">
            <VideoCall
                username=""
                onUsernameCreated={onUsernameCreated}
                onEndCall={() => { }}
                showEndCallButton={false}
                onClearData={() => { }}
            />
        </div>
    );
}
