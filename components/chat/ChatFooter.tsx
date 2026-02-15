'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Mic, X, Check } from 'lucide-react';
import { Message } from './MessageItem';
import VoiceRecorder from '../audio/VoiceRecorder';
import dynamic from 'next/dynamic';
import { EmojiStyle, Theme, PickerProps } from 'emoji-picker-react';

const EmojiPicker = dynamic<PickerProps>(() => import('emoji-picker-react'), {
    ssr: false,
    loading: () => <div className="w-[300px] h-[400px] bg-white flex items-center justify-center border rounded-lg shadow-lg">Loading...</div>
});

interface ChatFooterProps {
    inputMessage: string;
    setInputMessage: (msg: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
    onSendVoice: (audioBlob: Blob, duration: number) => void;
    replyingTo?: Message | null;
    editingMessage?: Message | null;
    onCancelReply?: () => void;
    onCancelEdit?: () => void;
}

export default function ChatFooter({
    inputMessage,
    setInputMessage,
    onSendMessage,
    onSendVoice,
    replyingTo,
    editingMessage,
    onCancelReply,
    onCancelEdit
}: ChatFooterProps) {

    const [isVoiceRecording, setIsVoiceRecording] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    const handleEmojiClick = (emojiData: any) => {
        setInputMessage(inputMessage + emojiData.emoji);
        // Optional: Keep picker open or close it
        // setShowEmojiPicker(false); 
    };

    return (
        <div className="flex flex-col w-full bg-[#f0f2f5] relative">
            {/* Reply Preview */}
            {replyingTo && (
                <div className="mx-4 mt-2 px-3 py-2 bg-white rounded-t-lg border-l-4 border-[#06cf9c] flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[12px] font-bold text-[#06cf9c]">
                            Replying to {replyingTo.from}
                        </span>
                        <span className="text-[13px] text-[#54656f] truncate">
                            {replyingTo.message}
                        </span>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-black/5 rounded-full text-[#667781] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Edit Preview */}
            {editingMessage && (
                <div className="mx-4 mt-2 px-3 py-2 bg-white rounded-t-lg border-l-4 border-blue-500 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[12px] font-bold text-blue-500">
                            Editing Message
                        </span>
                        <span className="text-[13px] text-[#54656f] truncate">
                            {editingMessage.message}
                        </span>
                    </div>
                    <button
                        onClick={onCancelEdit}
                        className="p-1 hover:bg-black/5 rounded-full text-[#667781] transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div
                    ref={emojiPickerRef}
                    className="absolute bottom-[70px] left-4 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200"
                >
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        autoFocusSearch={false}
                        theme={Theme.LIGHT}
                        emojiStyle={EmojiStyle.NATIVE}
                        previewConfig={{ showPreview: false }}
                        width={300}
                        height={400}
                    />
                </div>
            )}

            <footer className={`z-20 flex min-h-[62px] w-full flex-shrink-0 items-center gap-1 md:gap-2 px-2 md:px-4 py-2 ${(replyingTo || editingMessage) ? 'rounded-b-lg' : ''}`}>
                {isVoiceRecording ? (
                    <div className="w-full animate-in slide-in-from-bottom-2 duration-200">
                        <VoiceRecorder
                            onSendVoice={(audioBlob, duration) => {
                                onSendVoice(audioBlob, duration);
                                setIsVoiceRecording(false);
                            }}
                            onCancel={() => setIsVoiceRecording(false)}
                        />
                    </div>
                ) : (
                    <>
                        <div className="flex gap-1 md:gap-2 text-[#54656f]">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`hover:bg-black/5 p-1.5 md:p-2 rounded-full transition-colors ${showEmojiPicker ? 'text-[#00a884] bg-black/5' : ''}`}
                            >
                                <Smile className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <button className="hover:bg-black/5 p-1.5 md:p-2 rounded-full transition-colors">
                                <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            const wordCount = inputMessage.trim().split(/\s+/).length;
                            if (inputMessage.length > 800 || wordCount > 500) {
                                e.preventDefault();
                                alert('Limit exceeded: Max 800 characters or 500 words.');
                                return;
                            }
                            onSendMessage(e);
                        }} className="flex flex-1 items-center gap-1 md:gap-2 min-w-0 relative">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder={editingMessage ? "Edit message..." : "Type a message"}
                                    className={`w-full rounded-lg bg-white px-3 md:px-4 py-2 md:py-2.5 text-[14px] md:text-[15px] text-[#111b21] outline-none placeholder:text-[#667781] min-w-0 ${inputMessage.length > 750 ? 'border border-orange-400' : ''}`}
                                    value={inputMessage}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        const words = newValue.trim().split(/\s+/);
                                        if (newValue.length <= 800 && (newValue === '' || words.length <= 500)) {
                                            setInputMessage(newValue);
                                        }
                                    }}
                                    maxLength={800}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    onClick={() => setShowEmojiPicker(false)} // Close picker when typing
                                />
                                {inputMessage.length > 700 && (
                                    <span className={`absolute -top-5 right-2 text-[10px] font-bold ${inputMessage.length >= 800 ? 'text-red-500' : 'text-orange-500'}`}>
                                        {inputMessage.length}/800
                                    </span>
                                )}
                            </div>
                            {inputMessage.trim() ? (
                                <button
                                    type="submit"
                                    disabled={inputMessage.length > 800}
                                    className="text-[#54656f] hover:bg-black/5 p-2 rounded-full transition-colors disabled:opacity-50 shrink-0"
                                >
                                    {editingMessage ? <Check className="w-5 h-5 md:w-6 md:h-6 text-[#00a884]" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsVoiceRecording(true)}
                                    className="text-[#54656f] hover:bg-black/5 p-2 rounded-full transition-colors disabled:opacity-50 shrink-0"
                                >
                                    <Mic className="w-5 h-5 md:w-6 md:h-6" />
                                </button>)}
                        </form>
                    </>
                )}
            </footer>
        </div>
    );
}
