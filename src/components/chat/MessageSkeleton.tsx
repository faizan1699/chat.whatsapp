'use client';

interface MessageSkeletonProps {
    count?: number;
}

export default function MessageSkeleton({ count = 3 }: MessageSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => {
                const isMe = index % 2 === 1;
                
                return (
                    <div key={index} className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[85%] md:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`flex flex-col px-2 py-1 shadow-sm relative animate-pulse ${isMe
                                ? 'rounded-l-lg rounded-br-lg bg-gray-200 text-[#111b21] ml-10'
                                : 'rounded-r-lg rounded-bl-lg bg-gray-200 text-[#111b21] mr-10'
                                }`}
                            >
                                <div className="flex flex-col pr-2">
                                    <div className="relative">
                                        <div className="space-y-1">
                                            <div className="h-4 bg-gray-300 rounded w-32"></div>
                                            {index % 3 === 0 && <div className="h-4 bg-gray-300 rounded w-24"></div>}
                                            {index % 4 === 0 && <div className="h-4 bg-gray-300 rounded w-40"></div>}
                                        </div>
                                    </div>
                                </div>

                                {/* Meta data skeleton */}
                                <div className="flex items-center gap-1 ml-auto pt-1 h-5">
                                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                                    {isMe && (
                                        <div className="w-[12px] h-[12px] bg-gray-300 rounded-full"></div>
                                    )}
                                </div>
                            </div>

                            {/* Tail Decoration skeleton */}
                            <div className={`absolute top-0 w-2 h-3 ${isMe
                                ? '-right-1.5 bg-gray-200'
                                : '-left-1.5 bg-gray-200'
                                }`} style={{
                                    clipPath: isMe
                                        ? 'polygon(0 0, 0 100%, 100% 0)'
                                        : 'polygon(100% 0, 100% 100%, 0 0)'
                                }} />
                        </div>
                    </div>
                );
            })}
        </>
    );
}
