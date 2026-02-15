import RegistrationForm from './RegistrationForm';

interface AuthOverlayProps {
    username: string;
    onUsernameCreated: (username: string) => void;
    onClearData: () => void;
}

export default function AuthOverlay({ username, onUsernameCreated, onClearData }: AuthOverlayProps) {
    if (username !== "") return null;

    const handleSuccess = (user: any) => {
        onUsernameCreated(user.username);
        // You might want to store more than just username now, like userId
        localStorage.setItem('webrtc-userId', user.id);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#f0f2f5] md:bg-black/60 md:backdrop-blur-sm">
            <RegistrationForm onSuccess={handleSuccess} />
        </div>
    );
}
