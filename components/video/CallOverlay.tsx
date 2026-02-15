'use client';

import React from 'react';
import VideoCall from './VideoCall';
import AudioCall from '../audio/AudioCall';

interface CallOverlayProps {
    username: string;
    remoteUser: string;
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
    onClearData: () => void;
    remoteStream?: MediaStream | null;
}

export default function CallOverlay({
    username,
    remoteUser,
    isCallActive,
    onEndCall,
    callNotification,
    remoteVideoRef,
    isAudioOnly,
    localStream,
    remoteStream,
    callTimer,
    connectionState,
    isMuted,
    setIsMuted,
    onClearData
}: CallOverlayProps) {
    if (!isCallActive) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            {isAudioOnly ? (
                <AudioCall
                    username={username}
                    remoteUser={remoteUser}
                    callTimer={callTimer}
                    isMuted={isMuted}
                    onToggleMute={() => {
                        if (localStream) {
                            const audio = localStream.getAudioTracks()[0];
                            if (audio) {
                                audio.enabled = !audio.enabled;
                                setIsMuted(!audio.enabled);
                            }
                        }
                    }}
                    onEndCall={onEndCall}
                    connectionState={connectionState}
                />
            ) : (
                <VideoCall
                    username={username}
                    onUsernameCreated={() => { }}
                    onEndCall={onEndCall}
                    showEndCallButton={true}
                    onRemoteVideoRef={(ref) => { remoteVideoRef.current = ref; }}
                    showRemoteVideo={!isAudioOnly}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    callTimer={callTimer}
                    isCallActive={isCallActive}
                    onClearData={onClearData}
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
            )}
        </div>
    );
}
