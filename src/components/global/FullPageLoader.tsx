'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createTypedInstance } from '../../utils/typed';

   const messageTexts = [
            { text: "👋 Hey bro! You online?", isMe: true },
            { text: "Yeah! Just came in. What’s up?", isMe: false },

            { text: "Nothing much, just opening the app.", isMe: true },
            { text: "Same here 😄 loading feels kinda smooth.", isMe: false },

            { text: "Right? Feels fast today ⚡", isMe: true },
            { text: "Hope it stays this fast 😂", isMe: false },

            { text: "By the way, how’s your day going?", isMe: true },
            { text: "Pretty good! Busy but productive.", isMe: false },

            { text: "Nice! Any plans for later?", isMe: true },
            { text: "Thinking of a call maybe 📞", isMe: false },

            { text: "Perfect, app supports video calls now 👀", isMe: true },
            { text: "No way! That’s awesome 🔥", isMe: false },

            { text: "Yeah, messages are instant too.", isMe: true },
            { text: "Finally! No more ‘seen but not delivered’ 😅", isMe: false },

            { text: "Haha exactly 😂 UI also looks clean.", isMe: true },
            { text: "Feels premium, not gonna lie 😍", isMe: false },

            { text: "Alright, looks like it’s done loading.", isMe: true },
            { text: "Great! Let’s start chatting properly 🚀", isMe: false },
        ];

export default function FullPageLoader() {
    const [messages, setMessages] = useState<Array<{
        id: number,
        text: string,
        isMe: boolean,
        visible: boolean,
        typedText: string
    }>>([]);
    const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(true);
    const [currentTypingMessage, setCurrentTypingMessage] = useState<{
        text: string,
        isMe: boolean,
        messageId: number
    } | null>(null);
    

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingRefs = useRef<{ [key: number]: HTMLElement | null }>({});
    
    const prevMessagesRef = useRef<Array<{
         id: number,
          text: string, 
          isMe: boolean, 
          visible: boolean, 
          typedText: string 
    }>>([]);

    useEffect(() => {
     
        let messageIndex = 0;

        const startTypingMessage = (messageIndex: number) => {
            const message = messageTexts[messageIndex];
            const newMessage = {
                id: messageIndex,
                text: message.text,
                isMe: message.isMe,
                visible: true,
                typedText: message.text
            };

            const allMessages = [...prevMessagesRef.current, newMessage];
            setMessages(allMessages);
            prevMessagesRef.current = allMessages;
            setShowTypingIndicator(false);

            setCurrentTypingMessage({
                text: message.text,
                isMe: message.isMe,
                messageId: messageIndex
            });

            setTimeout(() => {
                if (typingRefs.current[messageIndex]) {
                    const typed = createTypedInstance(typingRefs.current[messageIndex]!, {
                        strings: [message.text],
                        typeSpeed: 50,
                        showCursor: true,
                        cursorChar: '|',
                        loop: false,
                        onStringTyped: (arrayPos, self) => {
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === messageIndex
                                        ? { ...msg, typedText: message.text }
                                        : msg
                                )
                            );
                        },
                        onComplete: () => {
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === messageIndex
                                        ? { ...msg, typedText: message.text }
                                        : msg
                                )
                            );
                            setCurrentTypingMessage(null);
                            if (messageIndex < messageTexts.length - 1) {
                                setTimeout(() => {
                                    setShowTypingIndicator(true);
                                }, 800);
                            }
                        }
                    });

                    typed.start();
                }
            }, 100);

        };

        const interval = setInterval(() => {
            if (messageIndex < messageTexts.length) {
                startTypingMessage(messageIndex);
                messageIndex++;
            } else {
                setTimeout(() => {
                    setMessages([]);
                    setShowTypingIndicator(true);
                    setCurrentTypingMessage(null);
                    prevMessagesRef.current = [];
                    messageIndex = 0;
                }, 4000);
            }
        }, 350);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#f0f2f5] overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00a884]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00a884]/5 rounded-full blur-3xl animate-pulse delay-700"></div>
            <div className="relative z-10 w-full max-w-md h-[410px] bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-[#00a884] text-white p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold">Chat Loading</h3>
                        <p className="text-xs text-white/80">Setting up your conversation...</p>
                    </div>
                </div>

                <div className="flex-1 p-4 space-y-3 bg-[#e5ddd5] bg-opacity-50 h-[350px] overflow-y-auto">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex w-full mb-1 transition-all duration-300 ease-out ${message.visible
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-4'
                                } ${message.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex flex-col max-w-[85%] ${message.isMe ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`flex flex-col px-3 py-2 shadow-sm relative ${message.isMe
                                        ? 'rounded-l-lg rounded-br-lg bg-[#d9fdd3] text-[#111b21] ml-10'
                                        : 'rounded-r-lg rounded-bl-lg bg-white text-[#111b21] mr-10'
                                        }`}
                                >
                                    <p className="text-[15px] leading-[20px] break-words select-text">
                                        {currentTypingMessage?.messageId === message.id ? (
                                            <span
                                                ref={(el) => {
                                                    typingRefs.current[message.id] = el;
                                                }}
                                            />
                                        ) : (
                                            message.typedText
                                        )}
                                        {currentTypingMessage?.messageId === message.id && (
                                            <span className="inline-block w-2 h-4 bg-[#111b21] animate-pulse ml-1"></span>
                                        )}
                                    </p>

                                    {message.typedText && message.typedText === message.text && (
                                        <div className="flex items-center gap-1 ml-auto pt-1 h-5">
                                            <span className="text-[11px] text-[#667781] whitespace-nowrap">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {message.isMe && (
                                                <span className="text-[#53bdeb] text-[12px]">✓✓</span>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className={`absolute top-0 w-2 h-3 ${message.isMe
                                            ? '-right-1.5 bg-[#d9fdd3]'
                                            : '-left-1.5 bg-white'
                                            }`}
                                        style={{
                                            clipPath: message.isMe
                                                ? 'polygon(0 0, 0 100%, 100% 0)'
                                                : 'polygon(100% 0, 100% 100%, 0 0)'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {showTypingIndicator && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2 bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>
    );
}
