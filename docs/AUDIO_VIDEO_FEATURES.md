# 📹 Audio & Video Call Features Documentation

## 📋 Overview

This document covers the audio/video calling capabilities of the Next.js WebRTC Chat Application, including WebRTC implementation, call controls, and advanced features.

## 🎯 Core WebRTC Architecture

### WebRTC Connection Setup

```typescript
// WebRTC Service
class WebRTCService {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: Socket;
  
  constructor(socket: Socket) {
    this.socket = socket;
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
      ],
    });
    
    this.setupPeerConnection();
  }
  
  async initializeCall(type: 'audio' | 'video') {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });
      
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream!);
      });
      
      return this.localStream;
    } catch (error) {
      throw new Error(`Failed to access media: ${error.message}`);
    }
  }
  
  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }
  
  async handleOffer(offer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }
  
  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(answer);
  }
  
  async handleIceCandidate(candidate: RTCIceCandidate) {
    await this.peerConnection.addIceCandidate(candidate);
  }
}
```

### Call State Management

```typescript
// Call Slice
interface CallState {
  isCallActive: boolean;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callData: CallData | null;
  callTimer: number;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  participants: Participant[];
  error: string | null;
}

// Call Actions
const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startCall: (state, action) => {
      state.isOutgoingCall = true;
      state.isCallActive = true;
      state.connectionState = 'connecting';
      state.callData = {
        id: `call-${Date.now()}`,
        ...action.payload,
        status: 'INITIATING',
        startTime: new Date(),
      };
    },
    
    acceptCall: (state) => {
      state.isIncomingCall = false;
      state.connectionState = 'connected';
      if (state.callData) {
        state.callData.status = 'CONNECTED';
        state.callData.startTime = new Date();
      }
    },
    
    endCall: (state) => {
      state.isCallActive = false;
      state.connectionState = 'disconnected';
      state.callTimer = 0;
      if (state.callData) {
        state.callData.status = 'ENDED';
        state.callData.endTime = new Date();
      }
    },
    
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach(track => {
          track.enabled = !state.isMuted;
        });
      }
    },
    
    toggleVideo: (state) => {
      state.isVideoOn = !state.isVideoOn;
      if (state.localStream) {
        state.localStream.getVideoTracks().forEach(track => {
          track.enabled = state.isVideoOn;
        });
      }
    },
  },
});
```

## 🎮 Call Controls Component

```typescript
// CallControls.tsx
interface CallControlsProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  isGroupCall?: boolean;
}

const CallControls: React.FC<CallControlsProps> = ({
  isMuted,
  isVideoOn,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  onToggleChat,
  onToggleParticipants,
  isGroupCall = false,
}) => {
  return (
    <div className="call-controls bg-gray-900 bg-opacity-90 p-4 rounded-lg">
      <div className="flex items-center justify-center space-x-4">
        {/* Mute/Unmute */}
        <button
          onClick={onToggleMute}
          className={`p-4 rounded-full transition-colors ${
            isMuted 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
        </button>
        
        {/* Video On/Off */}
        <button
          onClick={onToggleVideo}
          className={`p-4 rounded-full transition-colors ${
            !isVideoOn 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {isVideoOn ? <VideoIcon className="w-6 h-6" /> : <VideoOffIcon className="w-6 h-6" />}
        </button>
        
        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`p-4 rounded-full transition-colors ${
            isScreenSharing 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <ScreenShareIcon className="w-6 h-6" />
        </button>
        
        {/* Participants (Group Call) */}
        {isGroupCall && (
          <button
            onClick={onToggleParticipants}
            className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
          >
            <UsersIcon className="w-6 h-6" />
          </button>
        )}
        
        {/* Chat */}
        <button
          onClick={onToggleChat}
          className="p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
        >
          <ChatIcon className="w-6 h-6" />
        </button>
        
        {/* End Call */}
        <button
          onClick={onEndCall}
          className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
        >
          <PhoneOffIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
```

## 📱 Video Grid Layout

```typescript
// VideoGrid.tsx
interface VideoGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  onParticipantClick?: (participantId: string) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  localStream,
  onParticipantClick,
}) => {
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };
  
  const totalParticipants = participants.length + 1; // +1 for local user
  
  return (
    <div className={`video-grid grid ${getGridClass(totalParticipants)} gap-2 p-4 h-full`}>
      {/* Local Video */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden">
        <video
          ref={(ref) => {
            if (ref && localStream) {
              ref.srcObject = localStream;
            }
          }}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          You
        </div>
      </div>
      
      {/* Remote Videos */}
      {participants.map((participant) => (
        <VideoParticipant
          key={participant.id}
          participant={participant}
          onClick={() => onParticipantClick?.(participant.id)}
        />
      ))}
    </div>
  );
};

// VideoParticipant Component
const VideoParticipant: React.FC<{
  participant: Participant;
  onClick?: () => void;
}> = ({ participant, onClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
    if (audioRef.current && participant.audioStream) {
      audioRef.current.srcObject = participant.audioStream;
    }
  }, [participant.stream, participant.audioStream]);
  
  return (
    <div 
      className="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
      onClick={onClick}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <audio ref={audioRef} autoPlay playsInline />
      
      {/* Participant Info */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {participant.username}
        {participant.isMuted && <MicOffIcon className="w-3 h-3 inline ml-1" />}
        {!participant.isVideoOn && <VideoOffIcon className="w-3 h-3 inline ml-1" />}
      </div>
      
      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};
```

## 📞 Call Management

### Incoming Call Modal

```typescript
// IncomingCallModal.tsx
interface IncomingCallModalProps {
  caller: User;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  caller,
  callType,
  onAccept,
  onReject,
}) => {
  const [ringtone] = useState(() => new Audio('/ringtones/incoming-call.mp3'));
  
  useEffect(() => {
    ringtone.loop = true;
    ringtone.play().catch(console.error);
    
    return () => {
      ringtone.pause();
      ringtone.currentTime = 0;
    };
  }, [ringtone]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          {/* Caller Avatar */}
          <Avatar
            src={caller.avatar}
            alt={caller.username}
            size="xl"
            className="mx-auto mb-4"
          />
          
          {/* Call Info */}
          <h2 className="text-2xl font-bold mb-2">{caller.username}</h2>
          <p className="text-gray-600 mb-6">
            {callType === 'video' ? 'Video' : 'Audio'} call incoming...
          </p>
          
          {/* Call Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onReject}
              className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            >
              <PhoneOffIcon className="w-6 h-6" />
            </button>
            <button
              onClick={onAccept}
              className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
            >
              {callType === 'video' ? (
                <VideoIcon className="w-6 h-6" />
              ) : (
                <PhoneIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Call Timer

```typescript
// CallTimer.tsx
interface CallTimerProps {
  startTime: Date | null;
  isCallActive: boolean;
}

const CallTimer: React.FC<CallTimerProps> = ({ startTime, isCallActive }) => {
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    if (!isCallActive || !startTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setDuration(diff);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isCallActive, startTime]);
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="call-timer text-white text-sm font-medium">
      {formatDuration(duration)}
    </div>
  );
};
```

## 🔧 Advanced Features

### Screen Sharing

```typescript
// ScreenShareService.ts
class ScreenShareService {
  private screenStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection;
  
  constructor(peerConnection: RTCPeerConnection) {
    this.peerConnection = peerConnection;
  }
  
  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      // Replace video track
      const videoTrack = this.screenStream.getVideoTracks()[0];
      const sender = this.peerConnection.getSenders().find(
        s => s.track && s.track.kind === 'video'
      );
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }
      
      // Handle screen share end
      videoTrack.addEventListener('ended', () => {
        this.stopScreenShare();
      });
      
      return this.screenStream;
    } catch (error) {
      throw new Error(`Failed to start screen share: ${error.message}`);
    }
  }
  
  async stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
      
      // Restore camera video
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(
          s => s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      } catch (error) {
        console.error('Failed to restore camera:', error);
      }
    }
  }
}
```

### Call Recording

```typescript
// CallRecordingService.ts
class CallRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  
  async startRecording(stream: MediaStream): Promise<void> {
    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
    } catch (error) {
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }
  
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: 'video/webm',
        });
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
```

### Call Quality Monitoring

```typescript
// CallQualityMonitor.ts
class CallQualityMonitor {
  private peerConnection: RTCPeerConnection;
  private statsInterval: NodeJS.Timeout | null = null;
  
  constructor(peerConnection: RTCPeerConnection) {
    this.peerConnection = peerConnection;
  }
  
  startMonitoring(callback: (stats: CallStats) => void) {
    this.statsInterval = setInterval(async () => {
      try {
        const stats = await this.peerConnection.getStats();
        const callStats = this.processStats(stats);
        callback(callStats);
      } catch (error) {
        console.error('Failed to get stats:', error);
      }
    }, 1000);
  }
  
  stopMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }
  
  private processStats(stats: RTCStatsReport): CallStats {
    let bytesReceived = 0;
    let bytesSent = 0;
    let packetsLost = 0;
    let packetsReceived = 0;
    let roundTripTime = 0;
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        bytesReceived += report.bytesReceived || 0;
        packetsReceived += report.packetsReceived || 0;
        packetsLost += report.packetsLost || 0;
      }
      
      if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
        bytesSent += report.bytesSent || 0;
      }
      
      if (report.type === 'remote-candidate') {
        roundTripTime = report.roundTripTime || 0;
      }
    });
    
    const packetLossRate = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;
    
    return {
      bytesReceived,
      bytesSent,
      packetLossRate,
      roundTripTime,
      quality: this.calculateQuality(packetLossRate, roundTripTime),
    };
  }
  
  private calculateQuality(packetLossRate: number, rtt: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (packetLossRate < 1 && rtt < 50) return 'excellent';
    if (packetLossRate < 3 && rtt < 100) return 'good';
    if (packetLossRate < 5 && rtt < 200) return 'fair';
    return 'poor';
  }
}

interface CallStats {
  bytesReceived: number;
  bytesSent: number;
  packetLossRate: number;
  roundTripTime: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}
```

## 🎨 UI Components

### Call Quality Indicator

```typescript
// CallQualityIndicator.tsx
interface CallQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  packetLoss?: number;
  rtt?: number;
}

const CallQualityIndicator: React.FC<CallQualityIndicatorProps> = ({
  quality,
  packetLoss,
  rtt,
}) => {
  const getQualityColor = () => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
    }
  };
  
  const getQualityIcon = () => {
    switch (quality) {
      case 'excellent': return <WifiIcon className="w-4 h-4" />;
      case 'good': return <WifiIcon className="w-4 h-4" />;
      case 'fair': return <WifiIcon className="w-4 h-4" />;
      case 'poor': return <WifiOffIcon className="w-4 h-4" />;
    }
  };
  
  return (
    <div className={`call-quality-indicator flex items-center space-x-1 ${getQualityColor()}`}>
      {getQualityIcon()}
      <span className="text-xs font-medium">
        {quality.charAt(0).toUpperCase() + quality.slice(1)}
      </span>
      {(packetLoss !== undefined || rtt !== undefined) && (
        <div className="absolute bottom-full left-0 mb-2 bg-black bg-opacity-75 text-white text-xs rounded p-2 hidden group-hover:block">
          {packetLoss !== undefined && (
            <div>Packet Loss: {packetLoss.toFixed(1)}%</div>
          )}
          {rtt !== undefined && (
            <div>RTT: {rtt}ms</div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Participant List

```typescript
// ParticipantList.tsx
interface ParticipantListProps {
  participants: Participant[];
  onMuteParticipant?: (participantId: string) => void;
  onRemoveParticipant?: (participantId: string) => void;
  isHost?: boolean;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  onMuteParticipant,
  onRemoveParticipant,
  isHost = false,
}) => {
  return (
    <div className="participant-list bg-white rounded-lg shadow-lg p-4">
      <h3 className="font-semibold mb-4">
        Participants ({participants.length + 1})
      </h3>
      
      <div className="space-y-2">
        {/* Host (Local User) */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-3">
            <Avatar src="/current-user-avatar.jpg" size="sm" />
            <div>
              <div className="font-medium">You</div>
              <div className="text-xs text-gray-500">Host</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <MicIcon className="w-4 h-4 text-gray-400" />
            <VideoIcon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        {/* Other Participants */}
        {participants.map((participant) => (
          <div key={participant.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <Avatar src={participant.avatar} size="sm" />
              <div>
                <div className="font-medium">{participant.username}</div>
                <div className="text-xs text-gray-500">
                  {participant.isSpeaking ? 'Speaking...' : 'Listening'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {participant.isMuted ? (
                <MicOffIcon className="w-4 h-4 text-red-500" />
              ) : (
                <MicIcon className="w-4 h-4 text-gray-400" />
              )}
              
              {!participant.isVideoOn && (
                <VideoOffIcon className="w-4 h-4 text-red-500" />
              )}
              
              {isHost && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => onMuteParticipant?.(participant.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <MicOffIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemoveParticipant?.(participant.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

This comprehensive audio/video calling documentation provides the foundation for implementing WhatsApp-like calling features with WebRTC technology.
