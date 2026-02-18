'use client';

import React from 'react';

interface CallOverlayProps {
    call: any;
    callerName: string;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isVideoOff: boolean;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onEndCall: () => void;
    onToggleScreenShare: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    isPip: boolean;
    onTogglePip: () => void;
}

export default function CallOverlay({
    call,
    callerName,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    onToggleMute,
    onToggleVideo,
    onEndCall,
    onToggleScreenShare,
    isFullscreen,
    onToggleFullscreen,
    isPip,
    onTogglePip
}: CallOverlayProps) {
    if (!call) return null;

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
                {localStream && !isVideoOff && (
                    <video
                        autoPlay
                        playsInline
                        muted={true}
                        ref={(video) => {
                            if (video) video.srcObject = localStream;
                        }}
                        className={`absolute ${isPip ? 'bottom-4 right-4 w-32 h-24' : 'top-4 right-4 w-48 h-36'} object-cover rounded-lg border-2 border-white`}
                    />
                )}
                
                {/* Call Info */}
                <div className="absolute top-4 left-4 text-white">
                    <h2 className="text-xl font-semibold">{callerName}</h2>
                </div>
                
                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <button
                        onClick={onToggleMute}
                        className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} text-white`}
                    >
                        {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                    
                    <button
                        onClick={onToggleVideo}
                        className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-600'} text-white`}
                    >
                        {isVideoOff ? 'Video On' : 'Video Off'}
                    </button>
                    
                    <button
                        onClick={onEndCall}
                        className="p-4 rounded-full bg-red-600 text-white"
                    >
                        End Call
                    </button>
                    
                    <button
                        onClick={onToggleScreenShare}
                        className="p-4 rounded-full bg-gray-600 text-white"
                    >
                        Share Screen
                    </button>
                    
                    <button
                        onClick={onToggleFullscreen}
                        className="p-4 rounded-full bg-gray-600 text-white"
                    >
                        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </button>
                    
                    <button
                        onClick={onTogglePip}
                        className="p-4 rounded-full bg-gray-600 text-white"
                    >
                        PiP
                    </button>
                </div>
            </div>
        </div>
    );
}
