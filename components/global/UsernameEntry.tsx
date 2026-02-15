import { useRef, useState } from 'react';
import UserSVG from '../../assets/svg/user';

interface UsernameEntryProps {
    onUsernameCreated: (username: string) => void;
}

export default function UsernameEntry({ onUsernameCreated }: UsernameEntryProps) {
    const usernameInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateUser = () => {
        if (!usernameInputRef.current) return;

        const usernameValue = usernameInputRef.current.value.trim();

        if (usernameValue === "") {
            alert('Please enter a username to continue');
            return;
        }

        if (usernameValue.length < 2) {
            alert('Username must be at least 2 characters long');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            onUsernameCreated(usernameValue);
        }, 800);
    };

    return (
        <div className="z-10 w-full md:w-[95%] max-w-[1000px] h-screen md:h-auto md:min-h-[500px] bg-white shadow-2xl md:rounded-sm flex flex-col md:flex-row overflow-y-auto">
            <div className="flex-1 p-8 md:p-16 flex flex-col">
                <h1 className="text-2xl md:text-3xl font-light text-[#41525d] mb-6 md:mb-10">Use NexChat on your device:</h1>
                <ol className="list-decimal list-inside space-y-4 md:space-y-6 text-[#41525d] text-base md:text-lg">
                    <li>Launch the app and enter a username</li>
                    <li>Connect with friends in real-time</li>
                    <li>Enjoy high-quality video and audio calls</li>
                    <li className="text-[#00a884] font-medium">Type your name below to begin</li>
                </ol>
                <div className="mt-8 md:mt-auto pt-6 md:pt-10 border-t border-[#f0f2f5] hidden md:block">
                    <button className="text-[#00a884] hover:underline font-medium">Need help to get started?</button>
                </div>
            </div>
            <div className="w-full md:w-[400px] bg-white md:border-l border-[#f0f2f5] flex flex-col items-center justify-center p-8 md:p-10 shrink-0">
                <div className="relative p-4 bg-white border border-[#e9edef] rounded-lg shadow-sm mb-8 w-full">
                    <div className="aspect-square bg-[#f9f9f9] rounded flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#00a884]/20">
                        <div className="w-20 h-20 bg-[#00a884]/10 rounded-full flex items-center justify-center mb-4">
                            <UserSVG width="40" height="40" stroke="#00a884" />
                        </div>
                        <input
                            ref={usernameInputRef}
                            type="text"
                            placeholder="Enter your name"
                            className="w-full text-center py-2 bg-transparent border-b-2 border-[#00a884] focus:outline-none text-xl font-medium text-[#111b21] placeholder:text-[#667781]/40 disabled:opacity-50"
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleCreateUser()}
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <button
                    onClick={handleCreateUser}
                    disabled={isLoading}
                    className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-4 rounded-lg transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Connecting...</span>
                        </>
                    ) : (
                        "Get Started"
                    )}
                </button>
                <p className="mt-4 text-xs text-[#8696a0]">Version 1.0.0 — Stable</p>
            </div>
        </div>
    );
}
