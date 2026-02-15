'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoCallProps {
  username: string;
  onUsernameCreated: (username: string) => void;
  onEndCall: () => void;
  showEndCallButton: boolean;
  incomingCall?: { from: string; to: string; offer: RTCSessionDescriptionInit } | null;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
  callNotification?: { message: string; type: 'start' | 'end' } | null;
  onRemoteVideoRef?: (ref: HTMLVideoElement | null) => void;
  showRemoteVideo?: boolean;
  localStream?: MediaStream | null;
  callTimer?: number;
  isCallActive?: boolean;
  onUsernameChange?: (username: string) => void;
  onClearData?: () => void;
  connectionState?: 'connecting' | 'connected' | 'disconnected';
  onToggleMute?: () => void;
  isMuted?: boolean;
}

export default function VideoCall({ username, onUsernameCreated, onEndCall, showEndCallButton, incomingCall, onAcceptCall, onRejectCall, callNotification, onRemoteVideoRef, showRemoteVideo = false, localStream, callTimer = 0, isCallActive = false, onUsernameChange, onClearData, connectionState, onToggleMute, isMuted = false }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const editUsernameRef = useRef<HTMLInputElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const toggleMute = () => {
    onToggleMute?.();
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    } else if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  useEffect(() => {
    if (onRemoteVideoRef && remoteVideoRef.current) {
      onRemoteVideoRef(remoteVideoRef.current);
    }
  }, [onRemoteVideoRef, remoteVideoRef.current]);

  useEffect(() => {
    const handleOpenEditModal = () => {
      setShowEditModal(true);
    };
    window.addEventListener('openEditModal', handleOpenEditModal);
    return () => {
      window.removeEventListener('openEditModal', handleOpenEditModal);
    };
  }, []);

  const handleCreateUser = () => {
    if (usernameInputRef.current && usernameInputRef.current.value !== "") {
      const username = usernameInputRef.current.value.trim();
      if (username.length < 2) {
        alert('Username must be at least 2 characters long');
        return;
      }
      onUsernameCreated(username);
    }
  };

  const handleEditUser = () => {
    if (editUsernameRef.current && editUsernameRef.current.value.trim() !== '') {
      const newUsername = editUsernameRef.current.value.trim();
      if (newUsername !== username) {
        onUsernameChange?.(newUsername);
        setShowEditModal(false);
      }
    }
  };

  return (
    <section className={`flex-1 flex flex-col items-center ${username === "" ? 'justify-start md:justify-center overflow-y-auto py-8 md:py-0' : 'justify-center overflow-hidden'} relative bg-[#f0f2f5]`}>

      {username === "" && !isCallActive && (
        <div className="absolute top-0 left-0 w-full h-[220px] bg-[#00a884] z-0"></div>
      )}

      {username !== "" && connectionState && (
        <div className={`absolute top-4 right-4 z-40 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border ${connectionState === 'connected' ? 'bg-[#d9fdd3] text-[#00a884] border-[#00a884]/20' :
          connectionState === 'connecting' ? 'bg-yellow-50 text-yellow-600 border-yellow-200 animate-pulse' :
            'bg-red-50 text-red-600 border-red-200'
          }`}>
          {connectionState}
        </div>
      )}

      {/* Call Timer Overlay */}
      {isCallActive && (
        <div className="absolute top-8 z-40 bg-black/60 backdrop-blur-md text-white px-5 py-2 rounded-full font-mono text-xl border border-white/20 shadow-2xl">
          {Math.floor(callTimer / 60).toString().padStart(2, '0')}:{(callTimer % 60).toString().padStart(2, '0')}
        </div>
      )}

      {/* Username Entry (Redesigned as WA Login) */}
      {username === "" && (
        <div className="z-10 w-[95%] max-w-[1000px] min-h-[500px] bg-white shadow-2xl rounded-sm flex flex-col md:flex-row overflow-auto">
          <div className="flex-1 p-6 md:p-16 flex flex-col">
            <h1 className="text-3xl font-light text-[#41525d] mb-10">To use WhatsApp Clone on your computer:</h1>
            <ol className="list-decimal list-inside space-y-6 text-[#41525d] text-lg">
              <li>Open WhatsApp on your phone</li>
              <li>Tap <span className="font-bold">Menu</span> or <span className="font-bold">Settings</span> and select <span className="font-bold">Linked Devices</span></li>
              <li>Tap on <span className="font-bold">Link a Device</span></li>
              <li className="text-[#00a884] font-medium">Point your phone to this screen to capture the code (Enter username)</li>
            </ol>
            <div className="mt-auto pt-10 border-t border-[#f0f2f5]">
              <button className="text-[#00a884] hover:underline font-medium">Need help to get started?</button>
            </div>
          </div>
          <div className="w-full md:w-[400px] bg-white border-l border-[#f0f2f5] flex flex-col items-center justify-center p-6 md:p-10">
            <div className="relative p-4 bg-white border border-[#e9edef] rounded-lg shadow-sm mb-8 w-full">
              <div className="aspect-square bg-[#f9f9f9] rounded flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#00a884]/20">
                <div className="w-20 h-20 bg-[#00a884]/10 rounded-full flex items-center justify-center mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00a884" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  ref={usernameInputRef}
                  type="text"
                  placeholder="Enter your name"
                  className="w-full text-center py-2 bg-transparent border-b-2 border-[#00a884] focus:outline-none text-xl font-medium text-[#111b21] placeholder:text-[#667781]/40"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateUser()}
                />
              </div>
            </div>
            <button
              onClick={handleCreateUser}
              className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-4 rounded-lg transition-all shadow-md active:scale-95"
            >
              Get Started
            </button>
            <p className="mt-4 text-xs text-[#8696a0]">Version 1.0.0 — Stable</p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-[#111b21] mb-4">Update Profile</h3>
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#00a884] uppercase mb-1">Your Name</label>
              <input
                ref={editUsernameRef}
                type="text"
                defaultValue={username}
                className="w-full py-2 bg-transparent border-b-2 border-[#00a884] focus:outline-none text-lg text-[#111b21]"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 text-[#667781] font-bold hover:bg-[#f0f2f5] rounded-lg transition-colors">Cancel</button>
              <button onClick={handleEditUser} className="flex-1 py-2.5 bg-[#00a884] text-white font-bold rounded-lg shadow-md hover:bg-[#008069] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Interface */}
      {username !== "" && (
        <div className="w-full h-full flex flex-col p-4 md:p-8">
          <div className={`relative flex-1 flex flex-col md:flex-row gap-4 h-full items-center justify-center`}>
            {/* Remote Video (Full Screen if active) */}
            <div className={`relative bg-[#202124] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 border-4 border-white/5 ${showRemoteVideo ? 'flex-1 w-full h-full' : 'hidden'
              }`}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-md">
                Target Participant
              </div>
            </div>

            {/* Local Video (Floating if remote is active) */}
            <div className={`bg-[#202124] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 transition-all duration-500 overflow-hidden ${showRemoteVideo
              ? 'absolute bottom-24 right-4 md:bottom-28 md:right-8 w-40 h-56 md:w-64 md:h-48 z-20 hover:scale-105'
              : 'flex-1 w-full h-full max-w-4xl'
              }`}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover -scale-x-100" // Mirror local video
              />
              <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-md">
                You
              </div>
            </div>
          </div>

          {/* Control Bar */}
          {showEndCallButton && (
            <div className="mt-8 flex items-center justify-center gap-6 pb-4">
              <button
                onClick={toggleMute}
                className={`p-5 rounded-full shadow-xl transition-all border ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-white/90 border-transparent text-[#54656f] hover:bg-white'
                  }`}
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V22h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"></path></svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"></path></svg>
                )}
              </button>

              <button
                onClick={onEndCall}
                className="p-5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl transition-all shadow-red-500/30 hover:shadow-red-500/50 active:scale-95"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.994.994 0 0 1 0-1.41C2.75 9.21 6.92 7 12 7s9.25 2.21 11.71 4.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29s-.53-.1-.7-.28c-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1c-1.45-.48-3-.73-4.6-.73z"></path></svg>
              </button>

              <button className="p-5 bg-white/90 border-transparent text-[#54656f] hover:bg-white rounded-full transition-all shadow-lg">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path></svg>
              </button>
            </div>
          )}

          {/* Settings/Logout shortcut */}
          {!isCallActive && (
            <div className="absolute bottom-6 right-6 flex gap-3 text-xs text-[#667781]">
              <button onClick={onClearData} className="hover:text-red-500 transition-colors uppercase font-bold tracking-widest">Reset Application</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
