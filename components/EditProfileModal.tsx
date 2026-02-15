import { useRef } from 'react';

interface EditProfileModalProps {
    username: string;
    onClose: () => void;
    onUsernameChange: (newUsername: string) => void;
}

export default function EditProfileModal({ username, onClose, onUsernameChange }: EditProfileModalProps) {
    const editUsernameRef = useRef<HTMLInputElement>(null);

    const handleEditUser = () => {
        if (editUsernameRef.current && editUsernameRef.current.value.trim() !== '') {
            const newUsername = editUsernameRef.current.value.trim();
            if (newUsername !== username) {
                onUsernameChange(newUsername);
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold text-[#111b21] mb-4">Update Profile</h3>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-[#00a884] uppercase mb-1">Your Name</label>
                    <input
                        ref={editUsernameRef}
                        type="text"
                        defaultValue={username}
                        className="w-full py-2 bg-transparent border-b-2 border-[#00a884] focus:outline-none text-lg text-[#111b21]"
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-[#667781] font-bold hover:bg-[#f0f2f5] rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleEditUser} className="flex-1 py-2.5 bg-[#00a884] text-white font-bold rounded-lg shadow-md hover:bg-[#008069] transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
}
