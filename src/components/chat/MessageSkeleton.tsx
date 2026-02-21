'use client';

interface MessageSkeletonProps {
    count?: number;
}

export default function MessageSkeleton({ count = 3 }: MessageSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => {
                const isReceived = index % 2 === 0;
                
                return (
                    <div key={index} className={`flex gap-3 mb-4 animate-pulse ${isReceived ? '' : 'flex-row-reverse'}`}>
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                        
                        <div className="flex-1 space-y-2">
                            <div className={`bg-gray-200 rounded-2xl ${isReceived ? 'rounded-tl-none' : 'rounded-tr-none'} px-4 py-3 max-w-[70%] ${isReceived ? '' : 'ml-auto'}`}>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    {index % 3 === 0 && <div className="h-4 bg-gray-300 rounded w-1/2"></div>}
                                    {index % 4 === 0 && <div className="h-4 bg-gray-300 rounded w-5/6"></div>}
                                </div>
                            </div>
                            
                            <div className={`h-3 bg-gray-300 rounded w-16 ${isReceived ? 'ml-2' : 'mr-2'}`}></div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}
