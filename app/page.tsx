'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import UserList from '@/components/UserList';
import VideoCall from '@/components/VideoCall';

interface PeerConnectionManager {
  getInstance: () => RTCPeerConnection;
  reset: () => void;
}

export default function Home() {

  const [username, setUsername] = useState('');
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  const [showEndCallButton, setShowEndCallButton] = useState<boolean>(false);
  const [caller, setCaller] = useState<string[]>([]);
  const [incomingCall, setIncomingCall] = useState<{ from: string; to: string; offer: RTCSessionDescriptionInit } | null>(null);
  const [callNotification, setCallNotification] = useState<{ message: string; type: 'start' | 'end' } | null>(null);
  const [showRemoteVideo, setShowRemoteVideo] = useState<boolean>(false);
  const [remoteDescriptionSet, setRemoteDescriptionSet] = useState<boolean>(false);
  const [startCamera, setStartCamera] = useState<boolean>(false);
  const [callTimer, setCallTimer] = useState(0);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteVideoElementRef = useRef<HTMLVideoElement | null>(null);
  const [remoteVideoElement, setRemoteVideoElement] = useState<HTMLVideoElement | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  // Periodic ICE candidate processing
  useEffect(() => {
    const interval = setInterval(() => {
      processBufferedCandidatesPeriodically();
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isCallActive]);

  useEffect(() => {
    // Check for existing user in localStorage first
    const savedUsername = localStorage.getItem('webrtc-username');
    if (savedUsername) {
      console.log('Found existing user in localStorage:', savedUsername);
      setUsername(savedUsername);
    }

    // Initialize Socket.io server first
    fetch('http://192.168.100.242:3000/api/socket')
      .then(() => {
        console.log('Socket.io server initialized');

        // Connect to Socket.io server with proper configuration
        socketRef.current = io('http://192.168.100.242:3000', {
          path: '/api/socket',
          addTrailingSlash: false,
          transports: ['polling'], // Use only polling to avoid WebSocket issues
          timeout: 20000, // Increase timeout to 20 seconds
        });

        socketRef.current.on('connect', () => {
          console.log('Connected to server with ID:', socketRef.current?.id);

          // If we have a saved username, automatically rejoin
          const savedUsername = localStorage.getItem('webrtc-username');
          if (savedUsername) {
            console.log('Auto-rejoining with saved username:', savedUsername);
            socketRef.current?.emit('join-user', savedUsername);
          }
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Connection error:', error);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Disconnected from server');
        });

        socketRef.current.on('joined', (allUsers: { [key: string]: string }) => {
          console.log('All users joined:', allUsers);
          setUsers(allUsers);
        });

        socketRef.current.on('offer', async ({ from, to, offer }: { from: string; to: string; offer: RTCSessionDescriptionInit }) => {
          console.log('=== OFFER RECEIVED ===');
          console.log('Offer from:', from, 'to:', to);
          console.log('Offer type:', offer.type);
          console.log('Incoming call from:', from);
          // Show incoming call notification instead of auto-accepting
          setIncomingCall({ from, to, offer });
        });

        const handleAnswer = async ({ from, to, answer }: { from: string; to: string; answer: RTCSessionDescriptionInit }) => {
          console.log('=== ANSWER RECEIVED ===');
          console.log('Answer from:', from, 'to:', to);
          console.log('Answer type:', answer.type);

          const pc = peerConnectionRef.current || PeerConnection.getInstance();
          console.log('Current peer connection state:', pc.signalingState);
          console.log('Current remote description:', pc.remoteDescription);

          // Check connection state before setting remote description
          // Valid states for setting remote answer: have-local-offer or stable (in some rollback scenarios)
          if (pc.signalingState === "have-local-offer" || pc.signalingState === "stable") {
            try {
              await pc.setRemoteDescription(answer);
              setRemoteDescriptionSet(true);
              console.log('✅ Remote description set successfully, state:', pc.signalingState);

              // Process buffered ICE candidates immediately after setting remote description
              await processBufferedIceCandidates(pc);
            } catch (error) {
              console.error('❌ Failed to set remote description:', error);
              return;
            }
          } else {
            console.error('❌ Cannot set remote description: Connection not in valid state, current state:', pc.signalingState);
            return;
          }

          setShowEndCallButton(true);
          setShowRemoteVideo(true);
          setIsCallActive(true);
          setCallTimer(0);
          setConnectionState('connected');

          // Show call accepted notification to caller
          if (from === username) {
            setCallNotification({
              message: `${to} accepted your call`,
              type: 'start'
            });

            setTimeout(() => {
              setCallNotification(null);
            }, 3000);
          }
        };

        // Remove existing answer listener and add new one to prevent duplicates
        socketRef.current.off('answer');
        socketRef.current.on('answer', handleAnswer);

        socketRef.current.on('icecandidate', async (candidate: RTCIceCandidateInit) => {
          console.log('Received ICE candidate:', candidate);
          const pc = peerConnectionRef.current || PeerConnection.getInstance();

          // Check if peer connection is ready for ICE candidates
          // ICE candidates can be added when remoteDescription is set OR when in stable state
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('ICE candidate added successfully');
            } catch (error) {
              console.error('Error adding ICE candidate:', error);
              // If adding fails, buffer it for later
              iceCandidatesBuffer.current.push(candidate);
              console.log('ICE candidate buffered due to error');
            }
          } else {
            console.log('Remote description not set yet, buffering ICE candidate. Current state:', pc.signalingState);
            // Buffer the candidate to add later
            iceCandidatesBuffer.current.push(candidate);
          }
        });

        socketRef.current.on('end-call', ({ from, to }: { from: string; to: string }) => {
          setShowEndCallButton(true);
        });

        socketRef.current.on('call-ended', () => {
          setShowRemoteVideo<boolean>(false);
          endCall();
        });

        socketRef.current.on('call-rejected', ({ from, to }: { from: string; to: string }) => {
          // Show call rejected notification to caller
          if (to === username) {
            setCallNotification({
              message: `${from} rejected your call`,
              type: 'end'
            });

            setTimeout(() => {
              setCallNotification(null);
            }, 3000);
          }
        });

        socketRef.current.on('username-taken', ({ message }: { message: string }) => {
          console.log('Username taken:', message);
          setCallNotification({
            message: message,
            type: 'end'
          });

          setTimeout(() => {
            setCallNotification(null);
          }, 3000);
        });
      })
      .catch(error => {
        console.error('Failed to initialize Socket.io server:', error);
      });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const PeerConnection: PeerConnectionManager = (() => {
    let peerConnection: RTCPeerConnection | null = null;

    const createPeerConnection = () => {
      const config = {
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302'
          }
        ]
      };
      peerConnection = new RTCPeerConnection(config);

      // Clear ICE candidates buffer when creating new connection
      iceCandidatesBuffer.current = [];

      if (localStreamRef.current) {
        console.log('Local stream tracks:', localStreamRef.current.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted })));
        localStreamRef.current.getTracks().forEach(track => {
          // Check if sender already exists for this track
          if (!peerConnection!.getSenders().some(sender => sender.track === track)) {
            console.log('Adding track to peer connection:', track.kind);
            peerConnection!.addTrack(track, localStreamRef.current!);
          } else {
            console.log('Track already exists in peer connection:', track.kind);
          }
        });
      } else {
        console.log('No local stream available when creating peer connection');
      }

      peerConnection.ontrack = function (event) {
        console.log('=== ONTRACK EVENT ===');
        console.log('Track kind:', event.track.kind);
        console.log('Track enabled:', event.track.enabled);
        console.log('Track state:', event.track.readyState);
        console.log('Number of streams:', event.streams.length);
        console.log('Stream IDs:', event.streams.map(s => s.id));
        console.log('Remote video element available:', !!(remoteVideoElementRef.current || remoteVideoElement));

        const videoElement = remoteVideoElementRef.current || remoteVideoElement;
        if (videoElement && event.streams[0]) {
          console.log('Setting remote video stream:', event.streams[0].getTracks().length, 'tracks');
          console.log('Stream active:', event.streams[0].active);
          console.log('Stream tracks:', event.streams[0].getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted, readyState: t.readyState })));

          videoElement.srcObject = event.streams[0];
          videoElement.play().catch(error => {
            console.error('Error playing remote video:', error);
          });
        } else {
          console.warn('No remote video element or streams available. Video element:', !!videoElement, 'Streams:', event.streams.length);
        }
      };

      peerConnection.onicecandidate = function (event) {
        if (event.candidate) {
          socketRef.current?.emit('icecandidate', event.candidate);
        }
      };

      peerConnection.onconnectionstatechange = function (event) {
        console.log('Connection state changed:', peerConnection?.connectionState);
        if (peerConnection?.connectionState === 'connected') {
          setConnectionState('connected');
          console.log('WebRTC connection established successfully');
        } else if (peerConnection?.connectionState === 'disconnected' || peerConnection?.connectionState === 'failed') {
          setConnectionState('disconnected');
          console.log('WebRTC connection lost or failed');
        } else if (peerConnection?.connectionState === 'connecting') {
          console.log('WebRTC connection establishing...');
        }
      };

      peerConnection.oniceconnectionstatechange = function () {
        console.log('ICE connection state changed:', peerConnection?.iceConnectionState);
        if (peerConnection?.iceConnectionState === 'connected' || peerConnection?.iceConnectionState === 'completed') {
          console.log('ICE connection established');
        } else if (peerConnection?.iceConnectionState === 'failed' || peerConnection?.iceConnectionState === 'disconnected') {
          console.log('ICE connection failed');
        }
      };

      return peerConnection;
    };

    return {
      getInstance: () => {
        // Always create a new connection for each call
        if (peerConnection) {
          peerConnection.close();
        }
        peerConnection = createPeerConnection();
        peerConnectionRef.current = peerConnection; // Store reference
        return peerConnection;
      },
      reset: () => {
        if (peerConnection) {
          peerConnection.close();
          peerConnection = null;
        }
        // Clear ICE candidates buffer on reset
        iceCandidatesBuffer.current = [];
      }
    };
  })();

  const handleUsernameCreated = (newUsername: string) => {
    console.log('Creating user:', newUsername);
    setUsername(newUsername);

    // Save to localStorage
    localStorage.setItem('webrtc-username', newUsername);

    // Add current user to local list immediately for better UX
    setUsers(prev => {
      const updatedUsers = { ...prev, [newUsername]: newUsername };
      console.log('Local users updated:', updatedUsers);
      return updatedUsers;
    });

    // Emit to server to sync with other devices
    if (socketRef.current) {
      socketRef.current.emit('join-user', newUsername);
      console.log('Emitted join-user event for:', newUsername);
    }
  };

  const startMyVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      console.log({ stream });
      localStreamRef.current = stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const endCall = () => {
    PeerConnection.reset();
    setShowEndCallButton<boolean>(false);
    setShowRemoteVideo<boolean>(false);
    setRemoteDescriptionSet<boolean>(false);
    setStartCamera<boolean>(false);
    setIsCallActive<boolean>(false);
    setCallTimer(0);
    setConnectionState('disconnected');
    iceCandidatesBuffer.current = [];
  };

  const processBufferedIceCandidates = async (pc: RTCPeerConnection) => {
    while (iceCandidatesBuffer.current.length > 0) {
      try {
        const candidate = iceCandidatesBuffer.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('Buffered ICE candidate added successfully');
        }
      } catch (error) {
        console.error('Error adding buffered ICE candidate:', error);
        // Put it back in the buffer if it failed
        const failedCandidate = iceCandidatesBuffer.current.pop();
        if (failedCandidate) {
          iceCandidatesBuffer.current.unshift(failedCandidate);
        }
        break; // Stop processing on first error
      }
    }
  };

  // Periodic check to process buffered candidates
  const processBufferedCandidatesPeriodically = () => {
    const pc = peerConnectionRef.current;
    if (pc && pc.remoteDescription && pc.remoteDescription.type && iceCandidatesBuffer.current.length > 0) {
      console.log('Periodic check: Processing buffered ICE candidates');
      processBufferedIceCandidates(pc);
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    console.log('=== ACCEPTING CALL ===');
    console.log('Incoming call from:', incomingCall.from);
    console.log('Incoming call offer type:', incomingCall.offer.type);

    // Start camera when accepting a call
    setStartCamera(true);

    // Wait a bit for camera to start
    setTimeout(async () => {
      const pc = peerConnectionRef.current || PeerConnection.getInstance();
      console.log('Peer connection state before setting remote description:', pc.signalingState);

      // Add local stream to peer connection BEFORE setting remote description
      if (localStreamRef.current) {
        console.log('Adding local stream to peer connection in handleAcceptCall');
        localStreamRef.current.getTracks().forEach(track => {
          if (!pc.getSenders().some(sender => sender.track === track)) {
            pc.addTrack(track, localStreamRef.current!);
          }
        });
      } else {
        console.log('❌ No local stream available in handleAcceptCall');
      }

      // Check connection state before setting remote description
      if (pc.signalingState === 'stable') {
        try {
          console.log('Setting remote description from incoming call...');
          await pc.setRemoteDescription(incomingCall.offer);
          setRemoteDescriptionSet(true);
          console.log('✅ Remote offer set successfully in handleAcceptCall');

          // Process buffered ICE candidates immediately after setting remote description
          await processBufferedIceCandidates(pc);
        } catch (error) {
          console.error('❌ Failed to set remote offer in handleAcceptCall:', error);
          return;
        }
      } else {
        console.error('❌ Cannot set remote offer: Connection not in stable state, current state:', pc.signalingState);
        // Try to reset the connection and try again
        try {
          PeerConnection.reset();
          const newPc = PeerConnection.getInstance();
          peerConnectionRef.current = newPc; // Update reference

          // Add local stream to new peer connection
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
              if (!newPc.getSenders().some(sender => sender.track === track)) {
                newPc.addTrack(track, localStreamRef.current!);
              }
            });
          }

          await newPc.setRemoteDescription(incomingCall.offer);
          setRemoteDescriptionSet(true);
          console.log('✅ Remote offer set successfully after connection reset');

          // Process buffered ICE candidates after reset
          await processBufferedIceCandidates(newPc);
        } catch (resetError) {
          console.error('❌ Failed to set remote offer even after reset:', resetError);
          return;
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('answer', {
        from: incomingCall.to,
        to: incomingCall.from,
        answer: pc.localDescription
      });

      setCaller([incomingCall.from, incomingCall.to]);
      setIncomingCall(null);
      setShowEndCallButton(true);
      setShowRemoteVideo(true);
      setIsCallActive(true);
      setCallTimer(0);
      setConnectionState('connected');

      // Show call start notification
      setCallNotification({
        message: `Call started with ${incomingCall.from}`,
        type: 'start'
      });

      // Hide notification after 3 seconds
      setTimeout(() => {
        setCallNotification(null);
      }, 3000);
    }, 1000);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;

    // Notify the caller that call was rejected
    socketRef.current?.emit('call-rejected', {
      from: incomingCall.to,
      to: incomingCall.from
    });

    setIncomingCall(null);
  };

  const handleEndCall = () => {
    socketRef.current?.emit('call-ended', caller);

    // Show call end notification
    const otherUser = caller.find(user => user !== username);
    setCallNotification({
      message: `Call ended with ${otherUser}`,
      type: 'end'
    });

    // Hide notification after 3 seconds
    setTimeout(() => {
      setCallNotification(null);
    }, 3000);
  };

  const handleRemoteVideoRef = (ref: HTMLVideoElement | null) => {
    setRemoteVideoElement(ref);
    remoteVideoElementRef.current = ref;
    console.log('Remote video element set:', !!ref);

    // If we already have a peer connection, update its ontrack handler
    if (peerConnectionRef.current && ref) {
      console.log('Updating ontrack handler for existing peer connection');
      peerConnectionRef.current.ontrack = function (event) {
        console.log('Received remote track (updated handler):', event.track.kind, event.streams.length, 'streams');
        if (ref && event.streams[0]) {
          console.log('Setting remote video stream (updated handler):', event.streams[0].getTracks().length, 'tracks');
          ref.srcObject = event.streams[0];
          ref.play().catch(error => {
            console.error('Error playing remote video (updated handler):', error);
          });
        }
      };
    }
  };

  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const isEnabled = audioTracks[0].enabled;
        audioTracks[0].enabled = !isEnabled; // Toggle
        setIsMuted(isEnabled); // If it WAS enabled (true), it is NOW muted (true)
        console.log('Microphone', isEnabled ? 'muted' : 'unmuted');
      }
    }
  };

  const handleStreamReady = (stream: MediaStream) => {
    console.log('📤 Parent component received stream');
    console.log('Stream tracks in parent:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted, readyState: t.readyState })));
    localStreamRef.current = stream;
  };

  const handleUsernameChange = (newUsername: string) => {
    // Update localStorage
    localStorage.setItem('webrtc-username', newUsername);

    // Update state
    setUsername(newUsername);

    // Emit to server with new username
    if (socketRef.current) {
      socketRef.current.emit('join-user', newUsername);
      console.log('Username changed to:', newUsername);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async (user: string) => {
    console.log({ user });

    // Validate that current user is authenticated
    if (!username || username.trim() === '') {
      console.error('Cannot make call: User not authenticated');
      setCallNotification({
        message: 'Please create a username first',
        type: 'start'
      });
      setTimeout(() => setCallNotification(null), 3000);
      return;
    }

    // Validate that target user exists
    if (!users[user]) {
      console.error('Cannot make call: Target user not found');
      setCallNotification({
        message: `User ${user} is not available`,
        type: 'start'
      });
      setTimeout(() => setCallNotification(null), 3000);
      return;
    }

    // Set connection state to connecting
    setConnectionState('connecting');

    // Start camera when making a call
    setStartCamera(true);

    // Wait a bit for camera to start
    setTimeout(async () => {
      const pc = peerConnectionRef.current || PeerConnection.getInstance();

      // Add local stream to peer connection BEFORE creating offer
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (!pc.getSenders().some(sender => sender.track === track)) {
            pc.addTrack(track, localStreamRef.current!);
          }
        });
      }

      const offer = await pc.createOffer();
      console.log({ offer });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('offer', { from: username, to: user, offer: pc.localDescription });
    }, 1000);
  };

  const handleEditUser = () => {
    // This will trigger the edit modal in VideoCall component
    // We'll use a state to communicate between components
    const event = new CustomEvent('openEditModal');
    window.dispatchEvent(event);
  };

  const clearUserData = () => {
    localStorage.removeItem('webrtc-username');
    setUsername('');
    setUsers({});
    if (socketRef.current) {
      // Clear all users from server
      socketRef.current.emit('clear-all-users');
      socketRef.current.disconnect();
      // Reconnect after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <main className="h-screen flex flex-col md:flex-row">
      <UserList
        users={users}
        currentUser={username}
        onStartCall={startCall}
        onEditUser={handleEditUser}
      />
      <VideoCall
        username={username}
        onUsernameCreated={handleUsernameCreated}
        onEndCall={handleEndCall}
        showEndCallButton={showEndCallButton}
        incomingCall={incomingCall}
        onAcceptCall={handleAcceptCall}
        onRejectCall={handleRejectCall}
        callNotification={callNotification}
        onRemoteVideoRef={handleRemoteVideoRef}
        showRemoteVideo={showRemoteVideo}
        startCamera={startCamera}
        onStreamReady={handleStreamReady}
        callTimer={callTimer}
        isCallActive={isCallActive}
        onUsernameChange={handleUsernameChange}
        onClearData={clearUserData}
        connectionState={connectionState}
        onToggleMute={handleToggleMute}
        isMuted={isMuted}
      />
    </main>
  );
}
