'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
    onSendVoice: (audioBlob: Blob, duration: number) => void;
    onCancel: () => void;
}

export default function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Microphone access denied. Please allow microphone access to record voice messages.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const deleteRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioBlob(null);
        setAudioUrl('');
        setRecordingTime(0);
        setIsPlaying(false);
    };

    const sendVoiceMessage = () => {
        if (audioBlob) {
            onSendVoice(audioBlob, recordingTime);
            deleteRecording();
        }
    };

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-[#e9edef]">
            {/* Cancel Button */}
            <button
                onClick={onCancel}
                className="text-[#667781] hover:text-[#111b21] transition-colors"
            >
                <Trash2 size={20} />
            </button>

            {/* Recording Time / Audio Wave */}
            <div className="flex-1 flex items-center gap-2">
                {isRecording ? (
                    <>
                        <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-full animate-pulse"
                                    style={{
                                        height: `${20 + Math.random() * 10}px`,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                />
                            ))}
                        </div>
                        <span className="text-red-500 text-sm font-medium">
                            {formatTime(recordingTime)}
                        </span>
                    </>
                ) : audioBlob ? (
                    <>
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                        <button
                            onClick={togglePlayback}
                            className="text-[#00a884] hover:text-[#008069] transition-colors"
                        >
                            <Mic size={20} />
                        </button>
                        <span className="text-[#111b21] text-sm">
                            {formatTime(recordingTime)}
                        </span>
                    </>
                ) : (
                    <span className="text-[#667781] text-sm">
                        Tap to start recording
                    </span>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                {!isRecording && !audioBlob && (
                    <button
                        onClick={startRecording}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                    >
                        <Mic size={20} />
                    </button>
                )}
                
                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="bg-[#00a884] hover:bg-[#008069] text-white p-2 rounded-full transition-colors"
                    >
                        <div className="w-5 h-5 bg-white rounded-sm" />
                    </button>
                )}
                
                {audioBlob && (
                    <>
                        <button
                            onClick={deleteRecording}
                            className="text-[#667781] hover:text-[#111b21] transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button
                            onClick={sendVoiceMessage}
                            className="bg-[#00a884] hover:bg-[#008069] text-white p-2 rounded-full transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
