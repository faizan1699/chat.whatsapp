'use client';

import React from 'react';
import { Smile, Paperclip, Send, Mic } from 'lucide-react';

interface ChatFooterProps {
    inputMessage: string;
    setInputMessage: (msg: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
}

export default function ChatFooter({ inputMessage, setInputMessage, onSendMessage }: ChatFooterProps) {
    return (
        <footer className="z-20 flex min-h-[62px] items-center gap-2 bg-[#f0f2f5] px-4 py-2">
            <div className="flex gap-2 text-[#54656f]">
                <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                    <Smile size={24} />
                </button>
                <button className="hover:bg-black/5 p-2 rounded-full transition-colors">
                    <Paperclip size={24} />
                </button>
            </div>
            <form onSubmit={onSendMessage} className="flex flex-1 items-center gap-2">
                <input
                    type="text"
                    placeholder="Type a message"
                    className="w-full rounded-lg bg-white px-4 py-2.5 text-[15px] text-[#111b21] outline-none placeholder:text-[#667781]"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="text-[#54656f] hover:bg-black/5 p-2 rounded-full transition-colors disabled:opacity-50"
                >
                    {inputMessage.trim() ? (
                        <Send size={24} />
                    ) : (
                        <Mic size={24} />
                    )}
                </button>
            </form>
        </footer>
    );
}
