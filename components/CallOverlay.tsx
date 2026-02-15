'use client';

import React from 'react';
import VideoCall from './VideoCall';

interface CallOverlayProps {
    username: string;
    isCallActive: boolean;
    onEndCall: () => void;
    callNotification: any;
    remoteVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
    isAudioOnly: boolean;
    localStream: MediaStream | null;
    callTimer: number;
    connectionState: 'connecting' | 'connected' | 'disconnected';
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
}

export default function CallOverlay({
    username,
    isCallActive,
    onEndCall,
    callNotification,
    remoteVideoRef,
    isAudioOnly,
    localStream,
    callTimer,
    connectionState,
    isMuted,
    setIsMuted
}: CallOverlayProps) {
    if (!isCallActive) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <VideoCall
                username={username}
                onUsernameCreated={() => { }}
                onEndCall={onEndCall}
                showEndCallButton={true}
                incomingCall={null}
                onAcceptCall={() => { }}
                onRejectCall={() => { }}
                callNotification={callNotification}
                onRemoteVideoRef={(ref) => { remoteVideoRef.current = ref; }}
                showRemoteVideo={!isAudioOnly}
                localStream={localStream}
                callTimer={callTimer}
                isCallActive={isCallActive}
                onUsernameChange={() => { }}
                onClearData={() => { }}
                connectionState={connectionState}
                onToggleMute={() => {
                    if (localStream) {
                        const audio = localStream.getAudioTracks()[0];
                        if (audio) {
                            audio.enabled = !audio.enabled;
                            setIsMuted(!audio.enabled);
                        }
                    }
                }}
                isMuted={isMuted}
            />
        </div>
    );
}
