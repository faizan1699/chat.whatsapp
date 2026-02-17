import { useRef, useEffect, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import UsernameEntry from '../global/UsernameEntry';
import EditProfileModal from '../global/EditProfileModal';
import CallControls from './CallControls';

interface VideoCallProps {
  username: string;
  onUsernameCreated: (username: string) => void;
  onEndCall: () => void;
  showEndCallButton: boolean;
  onRemoteVideoRef?: (ref: HTMLVideoElement | null) => void;
  showRemoteVideo?: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
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
  remoteStream,
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
  const [localVideoPosition, setLocalVideoPosition] = useState('bottom-24 right-4');

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    } else if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  // Handle Remote Stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    } else if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [remoteStream]);


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
      <EditProfileModal
        isOpen={!!showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={(newUsername) => {
          if (newUsername) onUsernameChange?.(newUsername);
        }}
      />

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
            <motion.div
              drag={showRemoteVideo}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragMomentum={false}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (!showRemoteVideo) return;
                const { x, y } = info.point;
                const width = window.innerWidth;
                const height = window.innerHeight;

                // Determine quadrant
                const isLeft = x < width / 2;
                const isTop = y < height / 2;

                // Set position based on quadrant
                // Using standard classes for positioning
                if (isTop && isLeft) {
                  setLocalVideoPosition('top-24 left-4');
                } else if (isTop && !isLeft) {
                  setLocalVideoPosition('top-24 right-4');
                } else if (!isTop && isLeft) {
                  setLocalVideoPosition('bottom-24 left-4');
                } else {
                  setLocalVideoPosition('bottom-24 right-4');
                }
              }}
              layout
              className={`bg-[#202124] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 transition-shadow duration-300 ${showRemoteVideo
                ? `absolute ${localVideoPosition} w-32 h-44 md:w-48 md:h-36 z-50 cursor-grab active:cursor-grabbing hover:shadow-xl hover:scale-[1.02]`
                : 'flex-1 w-full h-full max-w-4xl transition-all duration-500'
                }`}
            >
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100 pointer-events-none" />
              <div className="absolute bottom-2 left-2 bg-black/40 px-2 py-0.5 rounded text-white text-xs backdrop-blur-md pointer-events-none">
                You
              </div>
            </motion.div>
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
