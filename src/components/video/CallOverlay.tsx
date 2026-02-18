'use client';

import React from 'react';

interface CallOverlayProps {
    username: string;
    remoteUser: string;
    isCallActive: boolean;
    onEndCall: () => void;
    callNotification: { message: string; type: "start" | "end"; } | null;
    remoteStream: MediaStream | null;
    remoteVideoRef: React.RefObject<HTMLVideoElement>;
    isAudioOnly: boolean;
    localStream: MediaStream | null;
    callTimer: number;
    connectionState: string;
    isMuted: boolean;
    setIsMuted: (muted: boolean) => void;
    onClearData: () => void;
}

export default function CallOverlay({
    username,
    remoteUser,
    isCallActive,
    onEndCall,
    callNotification,
    remoteStream,
    remoteVideoRef,
    isAudioOnly,
    localStream,
    callTimer,
    connectionState,
    isMuted,
    setIsMuted,
    onClearData
}: CallOverlayProps) {
    if (!isCallActive) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            <div className="relative w-full h-full">
                {/* Remote Video */}
                {remoteStream && (
                    <video
                        autoPlay
                        playsInline
                        muted={false}
                        ref={(video) => {
                            if (video) video.srcObject = remoteStream;
                        }}
                        className="w-full h-full object-cover"
                    />
                )}
                
                {/* Local Video (Picture-in-Picture style) */}
                {localStream && !isAudioOnly && (
                    <video
                        autoPlay
                        playsInline
                        muted={true}
                        ref={(video) => {
                            if (video) video.srcObject = localStream;
                        }}
                        className={`absolute bottom-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white`}
                    />
                )}
                
                {/* Call Info */}
                <div className="absolute top-4 left-4 text-white">
                    <h2 className="text-xl font-semibold">{remoteUser}</h2>
                </div>
                
                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} text-white`}
                    >
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    
                    <button
                        className="p-4 rounded-full bg-gray-600 text-white"
                    >
                        {isAudioOnly ? 'Video On' : 'Video Off'}
                    </button>
                    
                    <button
                        onClick={onEndCall}
                        className="p-4 rounded-full bg-red-600 text-white"
                    >
                        End Call
                    </button>
                    
                    <button
                        className="p-4 rounded-full bg-gray-600 text-white"
                    >
                        Share Screen
                    </button>
                    
                    <button
                        className="p-4 rounded-full bg-gray-600 text-white"
                    >
                        Fullscreen
                    </button>
                    
                    <button
                        className="p-4 rounded-full bg-gray-600 text-white"
                    >
                        PiP
                    </button>
                </div>
            </div>
        </div>
    );
}
