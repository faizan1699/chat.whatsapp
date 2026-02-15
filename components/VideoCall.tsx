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
  startCamera?: boolean;
  onStreamReady?: (stream: MediaStream) => void;
  callTimer?: number;
  isCallActive?: boolean;
  onUsernameChange?: (username: string) => void;
  onClearData?: () => void;
  connectionState?: 'connecting' | 'connected' | 'disconnected';
  onToggleMute?: () => void;
  isMuted?: boolean;
}

export default function VideoCall({ username, onUsernameCreated, onEndCall, showEndCallButton, incomingCall, onAcceptCall, onRejectCall, callNotification, onRemoteVideoRef, showRemoteVideo = false, startCamera = false, onStreamReady, callTimer = 0, isCallActive = false, onUsernameChange, onClearData, connectionState, onToggleMute, isMuted = false }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const editUsernameRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [localMuted, setLocalMuted] = useState(false);

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMutedState = !audioTracks[0].enabled;
        audioTracks[0].enabled = newMutedState;
        setLocalMuted(newMutedState);
        console.log('Microphone', newMutedState ? 'muted' : 'unmuted');
        onToggleMute?.();
      }
    }
  };

  useEffect(() => {
    if (startCamera) {
      startMyVideo();
    }
  }, [startCamera]);

  useEffect(() => {
    if (onRemoteVideoRef && remoteVideoRef.current) {
      onRemoteVideoRef(remoteVideoRef.current);
      console.log('Remote video ref provided to parent');
    }
  }, [onRemoteVideoRef, remoteVideoRef.current]);

  useEffect(() => {
    // Listen for custom event to open edit modal
    const handleOpenEditModal = () => {
      setShowEditModal(true);
    };

    window.addEventListener('openEditModal', handleOpenEditModal);
    
    return () => {
      window.removeEventListener('openEditModal', handleOpenEditModal);
    };
  }, []);

  useEffect(() => {
    if (!startCamera) {
      stopCamera();
    }
  }, [startCamera]);

  const startMyVideo = async () => {
    try {
      console.log('🎥 Requesting camera and microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      console.log('✅ Stream obtained successfully');
      console.log('Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted, readyState: t.readyState })));
      
      streamRef.current = stream;
      if (localVideoRef.current) {
        console.log('📹 Setting local video stream');
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.onloadedmetadata = () => {
          console.log('📹 Local video metadata loaded');
        };
      }
      // Notify parent component that stream is ready
      if (onStreamReady) {
        console.log('📤 Notifying parent component of stream readiness');
        onStreamReady(stream);
      }
    } catch (error : any) {
      console.error('❌ Error accessing media devices:', error);
      console.error('Error details:', error.name, error.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const handleCreateUser = () => {
    if (usernameInputRef.current && usernameInputRef.current.value !== "") {
      const username = usernameInputRef.current.value.trim();
      
      // Validate username
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

  const openEditModal = () => {
    setShowEditModal(true);
    // Pre-fill the input with current username
    setTimeout(() => {
      if (usernameInputRef.current) {
        usernameInputRef.current.value = username;
      }
    }, 100);
  };

  return (
    <section className="flex-1 flex flex-col items-center justify-center p-2 md:p-0 relative">
      {/* Call Timer */}
      {isCallActive && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 px-4 py-2 bg-black bg-opacity-75 text-white font-mono text-lg rounded-lg shadow-lg">
          {Math.floor(callTimer / 60).toString().padStart(2, '0')}:{(callTimer % 60).toString().padStart(2, '0')}
        </div>
      )}

      {/* Connection State Indicator */}
      {connectionState && (
        <div className={`absolute top-4 right-4 z-30 px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
          connectionState === 'connected' 
            ? 'bg-green-500 text-white' 
            : connectionState === 'connecting'
            ? 'bg-yellow-500 text-white animate-pulse'
            : 'bg-gray-500 text-white'
        }`}>
          {connectionState === 'connected' ? '🟢 Connected' : 
           connectionState === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
        </div>
      )}

      {/* Call Start/End Notification */}
      {callNotification && (
        <div className={`absolute top-16 left-1/2 transform -translate-x-1/2 z-40 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 ${
          callNotification.type === 'start' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {callNotification.message}
        </div>
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="absolute inset-0 min-w-[200px] bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h2 className="text-xl font-bold mb-4 text-center">Incoming Call</h2>
            <p className="text-lg mb-6 text-center">{incomingCall.from} is calling you...</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onAcceptCall}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 w-full sm:w-auto"
              >
                Accept
              </button>
              <button
                onClick={onRejectCall}
                className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 w-[200px] w-full sm:w-[200px]"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {username === "" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] m-4 md:m-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            {/* Close Button */}
            <button
              onClick={() => {
                // Clear any input and hide modal (optional: you could also redirect or show a different state)
                if (usernameInputRef.current) {
                  usernameInputRef.current.value = '';
                }
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Video Call</h2>
              <p className="text-gray-600">Enter your username to start</p>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <input
                  ref={usernameInputRef}
                  type="text"
                  placeholder="Choose a username"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg font-medium transition-colors bg-gray-50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateUser();
                    }
                  }}
                />
                <div className="absolute right-3 top-3.5 text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                </div>
              </div>
              
              <button
                onClick={handleCreateUser}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                  </svg>
                  Create Your User
                </span>
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By joining, you agree to our terms and privacy policy
              </p>
            </div>
          </div>
        </div>
      )}

      {username !== "" && !isCallActive && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            Edit Username
          </button>
          <button
            onClick={onClearData}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
            title="Clear all data and reset"
          >
            Clear Data
          </button>
        </div>
      )}
      
      {/* Edit Username Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Edit Username</h2>
              <p className="text-gray-600">Update your username</p>
            </div>
            
            <div className="space-y-4">
              <input
                ref={editUsernameRef}
                type="text"
                defaultValue={username}
                placeholder="Enter new username"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg font-medium transition-colors bg-gray-50"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEditUser();
                  }
                }}
              />
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full px-2">
        <div className={`${showRemoteVideo ? 'flex-1' : 'w-full'} min-h-[20rem] md:min-h-[40rem] md:max-h-[50rem] bg-black overflow-hidden rounded-lg`}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full"
          />
        </div>
        {showRemoteVideo && (
          <div className="remote-video flex-1 w-full min-h-[20rem] md:min-h-[40rem] md:w-[50rem] md:max-h-[50rem] bg-black overflow-hidden rounded-lg">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              onLoadStart={() => console.log('Remote video loading started')}
              onCanPlay={() => console.log('Remote video can play')}
              onError={(e) => console.error('Remote video error:', e)}
            />
          </div>
        )}
      </div>
      
      {showEndCallButton && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={toggleMute}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v10.5L7.5 17.5a3 3 0 0 0 4.242 4.242L12 19.5V13a3 3 0 0 0 3-3z"/>
                <path d="M17 11.305a3 3 0 0 0 0 4.242l-4.5 4.242V8.69a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11.5l6.5-6.5z"/>
              </svg>
            )}
          </button>
          <button
            onClick={onEndCall}
            className="w-[200px] h-16 md:h-20 text-red-500 text-bold bg-white shadow-[0_0_15px_15px_rgba(0,0,0,0.2)] rounded-lg m-4 md:m-8 cursor-pointer"
          >
End Call
          </button>
        </div>
      )}

      {/* Edit Username Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Edit Username</h2>
              <p className="text-gray-600">Update your username</p>
            </div>
            
            <div className="space-y-4">
              <input
                ref={editUsernameRef}
                type="text"
                defaultValue={username}
                placeholder="Enter new username"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg font-medium transition-colors bg-gray-50"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEditUser();
                  }
                }}
              />
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
                >
                  Update Username
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
