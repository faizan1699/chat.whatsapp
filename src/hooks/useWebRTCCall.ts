'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { recordCall } from '@/services/callService';
import { getIceServers } from '@/config/webrtcConfig';
import { frontendAuth } from '@/utils/frontendAuth';

export interface IncomingCallPayload {
  from: string;
  to: string;
  offer: RTCSessionDescriptionInit;
  isAudioOnly?: boolean;
}

export interface UseWebRTCCallOptions {
  socket: Socket | null;
  username: string;
  selectedUser: string | null;
  onCallEnded?: () => void;
  onCallRejected?: (from: string) => void;
}

export function useWebRTCCall(opts: UseWebRTCCallOptions) {
  const { socket, username, selectedUser, onCallEnded, onCallRejected } = opts;

  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [showEndCallButton, setShowEndCallButton] = useState(false);
  const [showRemoteVideo, setShowRemoteVideo] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [callParticipant, setCallParticipant] = useState('');

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);
  const callerRef = useRef<string[]>([]);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const isAudioOnlyRef = useRef(false);
  isAudioOnlyRef.current = isAudioOnly;

  useEffect(() => {
    if (!isCallActive) return;
    const id = setInterval(() => setCallTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isCallActive]);

  const playRingtone = useCallback(() => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio('/assets/ringtones/ringtone.mp3');
      ringtoneRef.current.loop = true;
    }
    ringtoneRef.current.play().catch(() => {});
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

  const resetPeer = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  const processBufferedIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (iceCandidatesBuffer.current.length > 0) {
      const c = iceCandidatesBuffer.current.shift();
      if (c) await pc.addIceCandidate(new RTCIceCandidate(c));
    }
  }, []);

  const createPeerConnection = useCallback((stream: MediaStream, otherUser?: string) => {
    resetPeer();
    const pc = new RTCPeerConnection({ iceServers: getIceServers() });
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (!e.candidate || !socket) return;
      const to = otherUser ?? callerRef.current.find(u => u !== username) ?? selectedUser ?? callParticipant;
      socket.emit('icecandidate', to ? { candidate: e.candidate, to } : e.candidate);
    };
    pc.ontrack = e => { if (e.streams[0]) { setRemoteStream(e.streams[0]); setShowRemoteVideo(true); } };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'connected') setConnectionState('connected'); };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, resetPeer]);

  const endCallInternal = useCallback(async (durationSeconds: number, audioOnly: boolean) => {
    resetPeer();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setShowEndCallButton(false);
    setShowRemoteVideo(false);
    setCallTimer(0);
    setCallParticipant('');
    setConnectionState('disconnected');
    stopRingtone();

    // Record call to API
    const caller = callerRef.current[0] ?? username;
    const callee = callerRef.current.find(u => u !== username) ?? selectedUser ?? callParticipant;
    if (durationSeconds > 0 && caller && callee) {
      try {
        const token = frontendAuth.getAccessToken();
        if (token) {
          await recordCall({
            callerUsername: caller,
            calleeUsername: callee,
            callType: audioOnly ? 'audio' : 'video',
            durationSeconds,
            accessToken: token
          });
        }
      } catch (e) {
        console.warn('Failed to record call:', e);
      }
    }
    callerRef.current = [];
    onCallEnded?.();
  }, [username, selectedUser, callParticipant, resetPeer, stopRingtone, onCallEnded]);

  const startCall = useCallback(async (audioOnly: boolean) => {
    if (!selectedUser || !socket) return;
    setIsAudioOnly(audioOnly);
    setCallParticipant(selectedUser);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: !audioOnly, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(stream, selectedUser);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('offer', { from: username, to: selectedUser, offer, isAudioOnly: audioOnly });
      callerRef.current = [username, selectedUser];
      callStartTimeRef.current = Date.now();
      setShowEndCallButton(true);
      setIsCallActive(true);
      setConnectionState('connecting');
    } catch (e) {
      console.error('Media error:', e);
      throw e;
    }
  }, [selectedUser, socket, username, createPeerConnection]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;
    stopRingtone();
    const audioOnly = incomingCall.isAudioOnly === true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: !audioOnly, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(stream, incomingCall.from);
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      await processBufferedIceCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('answer', { from: username, to: incomingCall.from, answer });
      callStartTimeRef.current = Date.now();
      setIsAudioOnly(audioOnly);
      setIsCallActive(true);
      setShowRemoteVideo(!audioOnly);
      setShowEndCallButton(true);
      setCallParticipant(incomingCall.from);
      setConnectionState('connected');
      setIncomingCall(null);
    } catch (e) {
      console.error('Accept call error:', e);
      throw e;
    }
  }, [incomingCall, socket, username, createPeerConnection, processBufferedIceCandidates, stopRingtone]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    stopRingtone();
    socket?.emit('call-rejected', { from: username, to: incomingCall.from });
    setIncomingCall(null);
    onCallRejected?.(incomingCall.from);
  }, [incomingCall, socket, username, stopRingtone, onCallRejected]);

  const endCall = useCallback(() => {
    const other = callerRef.current.find(u => u !== username) ?? selectedUser ?? callParticipant;
    if (other) socket?.emit('call-ended', { from: username, to: other });
    const duration = callStartTimeRef.current > 0 ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) : callTimer;
    endCallInternal(duration, isAudioOnlyRef.current);
  }, [socket, username, selectedUser, callParticipant, callTimer, isAudioOnly, endCallInternal]);

  /** Caller: when answer received from callee */
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    await processBufferedIceCandidates(pc);
  }, [processBufferedIceCandidates]);

  /** Add ICE candidate from remote peer */
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      iceCandidatesBuffer.current.push(candidate);
    }
  }, []);

  /** When remote peer ends the call (socket 'call-ended' event) */
  const handleRemoteEndCall = useCallback(() => {
    const duration = callStartTimeRef.current > 0 ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) : callTimer;
    endCallInternal(duration, isAudioOnlyRef.current);
  }, [callTimer, endCallInternal]);

  return {
    isCallActive,
    incomingCall,
    setIncomingCall,
    showEndCallButton,
    showRemoteVideo,
    localStream,
    remoteStream,
    callTimer,
    setCallTimer,
    isMuted,
    setIsMuted,
    connectionState,
    isAudioOnly,
    callParticipant,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    handleRemoteEndCall,
    handleAnswer,
    handleIceCandidate,
    playRingtone,
    iceCandidatesBuffer,
    processBufferedIceCandidates,
    createPeerConnection
  };
}
