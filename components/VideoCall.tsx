import { useRef, useEffect, useState } from 'react';
import UsernameEntry from './UsernameEntry';
import EditProfileModal from './EditProfileModal';
import CallControls from './CallControls';

interface VideoCallProps {
  username: string;
  onUsernameCreated: (username: string) => void;
  onEndCall: () => void;
  showEndCallButton: boolean;
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

export default function VideoCall({
  username,
  onUsernameCreated,
  onEndCall,
  showEndCallButton,
  onRemoteVideoRef,
  showRemoteVideo = false,
  localStream,
  callTimer = 0,
  isCallActive = false,
  onUsernameChange,
  onClearData,
  connectionState,
  onToggleMute,
  isMuted = false
}: VideoCallProps) {

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
    const handleOpenEditModal = () => setShowEditModal(true);
    window.addEventListener('openEditModal', handleOpenEditModal);
    return () => window.removeEventListener('openEditModal', handleOpenEditModal);
  }, []);

  return (
    <section className={`flex-1 flex flex-col items-center ${username === "" ? 'justify-start md:justify-center min-h-screen overflow-y-auto py-8 md:py-0' : 'justify-center overflow-y-auto h-screen'} relative bg-[#f0f2f5]`}>

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

      {/* Username Entry */}
      {username === "" && <UsernameEntry onUsernameCreated={onUsernameCreated} />}

      {/* Edit Modal */}
      {showEditModal && (
        <EditProfileModal
          username={username}
          onClose={() => setShowEditModal(false)}
          onUsernameChange={onUsernameChange!}
        />
      )}

      {/* Video Call Interface */}
      {username !== "" && (
        <div className="w-full h-full flex flex-col p-4 md:p-8">
          <div className="relative flex-1 flex flex-col md:flex-row gap-4 h-full items-center justify-center">
            {/* Remote Video */}
            <div className={`relative bg-[#202124] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 border-4 border-white/5 ${showRemoteVideo ? 'flex-1 w-full h-full' : 'hidden'}`}>
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-md">
                Target Participant
              </div>
            </div>

            {/* Local Video */}
            <div className={`bg-[#202124] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 transition-all duration-500 ${showRemoteVideo ? 'absolute bottom-24 right-4 md:bottom-28 md:right-8 w-40 h-56 md:w-64 md:h-48 z-20 hover:scale-105' : 'flex-1 w-full h-full max-w-4xl'}`}>
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
              <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded-lg text-white text-sm backdrop-blur-md">
                You
              </div>
            </div>
          </div>

          {/* Control Bar */}
          {showEndCallButton && (
            <CallControls
              onToggleMute={onToggleMute!}
              isMuted={isMuted}
              onEndCall={onEndCall}
            />
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
