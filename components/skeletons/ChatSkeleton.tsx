'use client';

import React from 'react';

export default function ChatSkeleton() {
    return (
        <div className="flex-1 overflow-hidden">
            <div className="sticky top-0 z-20 bg-[#efeae2] py-2 px-4">
                <div className="flex items-center justify-center">
                    <div className="bg-gray-200 h-6 w-20 rounded-full animate-pulse"></div>
                </div>
            </div>

            <div className="relative z-10 flex h-full flex-col overflow-y-auto p-4 space-y-2">
                <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 h-6 w-16 rounded-full animate-pulse"></div>
                </div>

                {[...Array(8)].map((_, index) => (
                    <div key={index} className={`group flex w-full mb-1 ${index % 3 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[85%] md:max-w-[65%] lg:max-w-[60%] xl:max-w-[55%] ${index % 3 === 0 ? 'items-end' : 'items-start'}`}>
                            <div className={`flex flex-col px-2 py-1 shadow-sm relative w-full min-w-0 ${
                                index % 3 === 0 
                                    ? 'rounded-l-lg rounded-br-lg bg-gray-100 ml-10' 
                                    : 'rounded-r-lg rounded-bl-lg bg-white mr-10 border border-gray-200'
                            }`}>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="space-y-1">
                                        {[...Array(index % 3 === 0 ? 1 : 2)].map((_, lineIndex) => (
                                            <div 
                                                key={lineIndex}
                                                className={`h-4 bg-gray-200 rounded animate-pulse ${
                                                    lineIndex === 0 ? 'w-32' : lineIndex === 1 ? 'w-48' : 'w-40'
                                                }`}
                                            ></div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 ml-auto pt-1 h-5">
                                        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-3 w-4 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>

                                <div className={`absolute top-0 w-2 h-3 ${
                                    index % 3 === 0
                                        ? '-right-1.5 bg-gray-100'
                                        : '-left-1.5 bg-white border-l border-t border-gray-200'
                                }`} style={{
                                    clipPath: index % 3 === 0
                                        ? 'polygon(0 0, 0 100%, 100% 0)'
                                        : 'polygon(100% 0, 100% 100%, 0 0)'
                                }} />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-center py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
