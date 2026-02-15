import MicSVG from '../assets/svg/mic';
import MicOffSVG from '../assets/svg/mic-off';
import EndCallSVG from '../assets/svg/end-call';
import VideoSVG from '../assets/svg/video';

interface CallControlsProps {
    onToggleMute: () => void;
    isMuted: boolean;
    onEndCall: () => void;
}

export default function CallControls({ onToggleMute, isMuted, onEndCall }: CallControlsProps) {
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:relative md:bottom-0 md:left-0 md:translate-x-0 mt-8 flex items-center justify-center gap-6 pb-4 z-50">
            {/* Mute Button - 30px */}
            <button
                onClick={onToggleMute}
                className={`w-[30px] h-[30px] md:w-auto md:h-auto md:p-5 rounded-full shadow-xl transition-all border flex items-center justify-center ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-white/90 border-transparent text-[#54656f] hover:bg-white'
                    }`}
            >
                <div className="scale-75 md:scale-100">
                    {isMuted ? <MicOffSVG size={20} /> : <MicSVG size={20} />}
                </div>
            </button>

            {/* End Call Button - 50px */}
            <button
                onClick={onEndCall}
                className="w-[50px] h-[50px] md:w-auto md:h-auto md:p-5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl transition-all shadow-red-500/30 hover:shadow-red-500/50 active:scale-95 flex items-center justify-center"
            >
                <div className="md:scale-100">
                    <EndCallSVG size={24} />
                </div>
            </button>

            {/* Video Toggle Button - 30px */}
            <button className="w-[30px] h-[30px] md:w-auto md:h-auto md:p-5 bg-white/90 border-transparent text-[#54656f] hover:bg-white rounded-full transition-all shadow-lg flex items-center justify-center">
                <div className="scale-75 md:scale-100">
                    <VideoSVG size={20} />
                </div>
            </button>
        </div>
    );
}
