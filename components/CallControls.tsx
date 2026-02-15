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
        <div className="mt-8 flex items-center justify-center gap-6 pb-4">
            <button
                onClick={onToggleMute}
                className={`p-5 rounded-full shadow-xl transition-all border ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-white/90 border-transparent text-[#54656f] hover:bg-white'
                    }`}
            >
                {isMuted ? <MicOffSVG size={28} /> : <MicSVG size={28} />}
            </button>

            <button
                onClick={onEndCall}
                className="p-5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl transition-all shadow-red-500/30 hover:shadow-red-500/50 active:scale-95"
            >
                <EndCallSVG size={28} />
            </button>

            <button className="p-5 bg-white/90 border-transparent text-[#54656f] hover:bg-white rounded-full transition-all shadow-lg">
                <VideoSVG size={28} />
            </button>
        </div>
    );
}
