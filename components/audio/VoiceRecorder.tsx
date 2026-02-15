import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Trash2, Play, Pause, Square, X } from 'lucide-react';

interface VoiceRecorderProps {
    onSendVoice: (audioBlob: Blob, duration: number) => void;
    onCancel: () => void;
}

export default function VoiceRecorder({ onSendVoice, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Trimming State
    const [trimRange, setTrimRange] = useState({ start: 0, end: 1 }); // Normalized 0-1
    const [currentTime, setCurrentTime] = useState(0); // Normalized 0-1

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // Draw Waveform
    useEffect(() => {
        if (!audioBuffer || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.clearRect(0, 0, width, height);

        // Draw background inactive waveform
        ctx.fillStyle = '#e9edef';
        ctx.fillRect(0, 0, width, height);

        // Draw active waveform
        ctx.beginPath();
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.fillStyle = '#00a884';
            const y = (1 + min) * amp;
            const h = Math.max(1, (max - min) * amp);
            ctx.fillRect(i, y, 1, h);
        }

        // Draw dimming overlay for trimmed definitions
        const startX = trimRange.start * width;
        const endX = trimRange.end * width;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        // Left dimmed
        ctx.fillRect(0, 0, startX, height);
        // Right dimmed
        ctx.fillRect(endX, 0, width - endX, height);

        // Draw Playhead
        const playX = currentTime * width;
        if (playX >= startX && playX <= endX) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(playX, 0, 2, height);
        }

    }, [audioBuffer, trimRange, currentTime]);


    // Live Recording Visualizer State
    const analyserRef = useRef<AnalyserNode | null>(null);
    const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const recordingRafRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (recordingRafRef.current) cancelAnimationFrame(recordingRafRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(e => console.error("Error closing audio context", e));
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Set up Audio Context for Visualizer
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyserRef.current = analyser;

            // Start Visualizer Loop
            const drawRecording = () => {
                if (!recordingCanvasRef.current || !analyser) return;
                const canvas = recordingCanvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyser.getByteFrequencyData(dataArray);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw mirrored visualizer
                const barWidth = (canvas.width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                // Center line
                const centerY = canvas.height / 2;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (dataArray[i] / 255) * canvas.height; // Scale to height

                    ctx.fillStyle = `rgb(${dataArray[i] + 100}, 50, 50)`; // Reddish color based on volume

                    // Draw bars extending from center
                    ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);

                    x += barWidth + 1;
                }

                recordingRafRef.current = requestAnimationFrame(drawRecording);
            };
            drawRecording();

            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);

                // Clean up visualizer
                if (recordingRafRef.current) cancelAnimationFrame(recordingRafRef.current);

                // Decode for trimming (reuse context if possible or make new one)
                // Note: We used context for visualizer, we can reuse it for decoding if it's not closed?
                // Actually safer to assume we might need a clean context or just decode on the existing one.
                // But for simplicity/robustness, let's just use the current one if active.

                if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }

                const arrayBuffer = await blob.arrayBuffer();
                const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                setAudioBuffer(decodedBuffer);
                setTrimRange({ start: 0, end: 1 });
                setCurrentTime(0);

                // Stop inputs
                stream.getTracks().forEach(track => track.stop());

                // Stop visualizer context if strictly needed, but we used it for decoding. 
                // We keep it open for playback.
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 59) {
                        stopRecording();
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Microphone access denied.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const playAudio = () => {
        if (!audioBuffer || !audioContextRef.current) return;

        // If playing, stop
        if (isPlaying) {
            stopAudio();
            return;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        sourceNodeRef.current = source;

        // Calculate start time based on trim or current pause position
        // If current time is exactly at start or end, restart from trim start
        let startOffset = currentTime * audioBuffer.duration;
        const trimStartProps = trimRange.start * audioBuffer.duration;
        const trimEndProps = trimRange.end * audioBuffer.duration;

        if (startOffset < trimStartProps || startOffset >= trimEndProps) {
            startOffset = trimStartProps;
        }

        source.start(0, startOffset, trimEndProps - startOffset);
        startTimeRef.current = audioContextRef.current.currentTime - startOffset;

        setIsPlaying(true);

        const updateProgress = () => {
            if (!audioContextRef.current) return;
            const now = audioContextRef.current.currentTime;
            const current = now - startTimeRef.current;
            const normalized = current / audioBuffer.duration;

            if (current >= trimEndProps) {
                stopAudio();
                setCurrentTime(trimRange.start); // Reset to start
            } else {
                setCurrentTime(normalized);
                rafRef.current = requestAnimationFrame(updateProgress);
            }
        };
        rafRef.current = requestAnimationFrame(updateProgress);

        source.onended = () => {
            setIsPlaying(false);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    };

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    const deleteRecording = () => {
        stopAudio();
        setAudioBlob(null);
        setAudioBuffer(null);
        setRecordingTime(0);
    };

    const encodeWAV = (buffer: AudioBuffer) => {
        const numChannels = 1; // force mono for smaller size
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const data = buffer.getChannelData(0); // get mono channel

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const dataSize = data.length * bytesPerSample;
        const headerSize = 44;
        const totalSize = headerSize + dataSize;

        const arrayBuffer = new ArrayBuffer(totalSize);
        const view = new DataView(arrayBuffer);

        const writeString = (view: DataView, offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Write PCM samples
        let offset = 44;
        for (let i = 0; i < data.length; i++) {
            const s = Math.max(-1, Math.min(1, data[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([view], { type: 'audio/wav' });
    };

    const sendVoiceMessage = async () => {
        if (!audioBuffer) return;

        // Slice logic
        const startSample = Math.floor(trimRange.start * audioBuffer.length);
        const endSample = Math.floor(trimRange.end * audioBuffer.length);
        const length = endSample - startSample;

        if (length <= 0) return;

        // Create new buffer
        const offlineCtx = new OfflineAudioContext(1, length, audioBuffer.sampleRate);
        const newBuffer = offlineCtx.createBuffer(1, length, audioBuffer.sampleRate);
        const channelData = audioBuffer.getChannelData(0); // Take first channel (mono)
        const newChannelData = newBuffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            newChannelData[i] = channelData[startSample + i];
        }

        // Encode to WAV
        const wavBlob = encodeWAV(newBuffer);
        const duration = length / audioBuffer.sampleRate;

        onSendVoice(wavBlob, duration);
        deleteRecording();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Range slider helper
    const handleRangeChange = (type: 'start' | 'end', val: number) => {
        setTrimRange(prev => {
            let newStart = prev.start;
            let newEnd = prev.end;
            if (type === 'start') {
                newStart = Math.min(val, prev.end - 0.05); // min 5% duration
            } else {
                newEnd = Math.max(val, prev.start + 0.05);
            }
            return { start: newStart, end: newEnd };
        });
        stopAudio();
    };

    return (
        <div className="flex flex-col w-full h-full">
            {/* If recording, simple view */}
            {isRecording ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-[#e9edef] w-full">

                    {/* Recording Indicator & Visualizer */}
                    <div className="flex-1 flex items-center gap-3 overflow-hidden">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                        <span className="text-red-500 font-medium text-sm tabular-nums flex-shrink-0">
                            {formatTime(recordingTime)} <span className="text-[10px] opacity-70">(Max 1:00)</span>
                        </span>

                        <div className="flex-1 h-8 bg-gray-50 rounded overflow-hidden relative">
                            <canvas
                                ref={recordingCanvasRef}
                                width={200}
                                height={32}
                                className="w-full h-full object-cover opacity-80"
                            />
                        </div>
                    </div>

                    <button
                        onClick={stopRecording}
                        className="bg-[#00a884] hover:bg-[#008069] text-white p-2 rounded-full transition-colors flex-shrink-0"
                    >
                        <Square size={20} className="fill-current" />
                    </button>
                </div>
            ) : audioBuffer ? (
                // Playback and Trim View
                <div className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-[#e9edef] w-full">

                    {/* Visualizer Area */}
                    <div
                        className="relative h-16 w-full bg-[#f0f2f5] rounded overflow-hidden select-none group touch-none"
                        ref={(el) => {
                            // Combine refs if needed, or just use this for the container bounding rect
                        }}
                        onMouseDown={(e) => {
                            // Optional: Click to seek?
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={64}
                            className="w-full h-full object-cover pointer-events-none"
                        />

                        {/* Interactive Area Layer */}
                        <div
                            className="absolute inset-0 w-full h-full z-10"
                            onMouseDown={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percent = Math.min(Math.max(0, x / rect.width), 1);

                                // If clicked near start or end handle, start dragging that
                                // specific handle. Otherwise, maybe seek or ignore.
                                // For simplicity, let's just implement the handles themselves as draggable targets.
                            }}
                        >
                            {/* Start Handle */}
                            <div
                                className="absolute top-0 bottom-0 w-4 bg-[#00a884] opacity-50 cursor-ew-resize hover:opacity-80 transition-opacity"
                                style={{ left: `calc(${trimRange.start * 100}% - 0px)` }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const parent = e.currentTarget.parentElement;
                                    if (!parent) return;

                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                        const rect = parent.getBoundingClientRect();
                                        const x = moveEvent.clientX - rect.left;
                                        const p = Math.min(Math.max(0, x / rect.width), 1);
                                        handleRangeChange('start', p);
                                    };

                                    const onMouseUp = () => {
                                        window.removeEventListener('mousemove', onMouseMove);
                                        window.removeEventListener('mouseup', onMouseUp);
                                    };

                                    window.addEventListener('mousemove', onMouseMove);
                                    window.addEventListener('mouseup', onMouseUp);
                                }}
                            >
                                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-white/0 flex items-center justify-center">
                                    <div className="w-1 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>

                            {/* End Handle */}
                            <div
                                className="absolute top-0 bottom-0 w-4 bg-[#00a884] opacity-50 cursor-ew-resize hover:opacity-80 transition-opacity"
                                style={{ left: `calc(${trimRange.end * 100}% - 16px)` }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    const parent = e.currentTarget.parentElement;
                                    if (!parent) return;

                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                        const rect = parent.getBoundingClientRect();
                                        const x = moveEvent.clientX - rect.left;
                                        const p = Math.min(Math.max(0, x / rect.width), 1);
                                        handleRangeChange('end', p);
                                    };

                                    const onMouseUp = () => {
                                        window.removeEventListener('mousemove', onMouseMove);
                                        window.removeEventListener('mouseup', onMouseUp);
                                    };

                                    window.addEventListener('mousemove', onMouseMove);
                                    window.addEventListener('mouseup', onMouseUp);
                                }}
                            >
                                <div className="absolute top-1/2 left-full -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-white/0 flex items-center justify-center">
                                    <div className="w-1 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={deleteRecording}
                            className="text-[#ef4444] p-2 hover:bg-[#ffebee] rounded-full transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={playAudio}
                                className="text-[#54656f] hover:bg-black/5 p-2 rounded-full transition-colors"
                            >
                                {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current" />}
                            </button>
                            <span className="text-sm font-medium text-[#54656f]">
                                {formatTime((trimRange.end - trimRange.start) * audioBuffer.duration)}
                            </span>
                        </div>

                        <button
                            onClick={sendVoiceMessage}
                            className="bg-[#00a884] hover:bg-[#008069] text-white p-2 rounded-full transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-[#e9edef] w-full">
                    <button
                        onClick={onCancel}
                        className="text-[#667781] hover:text-[#111b21] transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="flex-1 text-[#667781] text-sm text-center font-medium">
                        Tap microphone to record
                    </div>
                    <button
                        onClick={startRecording}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors shadow-sm"
                    >
                        <Mic size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
