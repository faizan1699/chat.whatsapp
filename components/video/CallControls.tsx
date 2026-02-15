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
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-6 z-30">
            <button
                onClick={onToggleMute}
                className={`p-4 rounded-full shadow-xl transition-all border backdrop-blur-sm ${isMuted ? 'bg-red-500/90 border-red-500 text-white' : 'bg-white/90 border-transparent text-[#54656f] hover:bg-white'
                    }`}
            >
                {isMuted ? <MicOffSVG size={24} /> : <MicSVG size={24} />}
            </button>

            <button
                onClick={onEndCall}
                className="p-4 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl transition-all shadow-red-500/30 hover:shadow-red-500/50 active:scale-95 backdrop-blur-sm"
            >
                <EndCallSVG size={24} />
            </button>

            <button className="p-4 bg-white/90 border-transparent text-[#54656f] hover:bg-white rounded-full transition-all shadow-lg backdrop-blur-sm">
                <VideoSVG size={24} />
            </button>
        </div>
    );
}
