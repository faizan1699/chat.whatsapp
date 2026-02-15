'use client';

import React from 'react';
import { Smile, Paperclip, Send, Mic, X } from 'lucide-react';
import { Message } from './MessageItem';

interface ChatFooterProps {
    inputMessage: string;
    setInputMessage: (msg: string) => void;
    onSendMessage: (e: React.FormEvent) => void;
    replyingTo?: Message | null;
    onCancelReply?: () => void;
}

export default function ChatFooter({
    inputMessage,
    setInputMessage,
    onSendMessage,
    replyingTo,
    onCancelReply
}: ChatFooterProps) {
    return (
        <div className="flex flex-col w-full bg-[#f0f2f5]">
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

            <footer className={`z-20 flex min-h-[62px] w-full flex-shrink-0 items-center gap-2 px-4 py-2 ${replyingTo ? 'rounded-b-lg' : ''}`}>
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
        </div>
    );
}
