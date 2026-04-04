import React from 'react';
import { EyeOff, Trash2 } from 'lucide-react';
import Modal from '@/components/global/Modal';

interface DeleteMessageModalProps {
  onClose: () => void;
  onDelete: (type: 'me' | 'everyone') => void;
  isMe: boolean;
}

const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  onClose,
  onDelete,
  isMe
}) => {
  return (
    <Modal
      onClose={onClose}
      title="Delete Message"
    >
      <p className="text-[#667781] text-sm mb-6">
        Choose how you want to delete this message:
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            onDelete('me');
            onClose();
          }}
          className="w-full px-4 py-4 text-left text-[13px] text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 min-h-[48px]"
        >
          <EyeOff size={16} />
          <div>
            <div className="font-medium">Hide for me</div>
            <div className="text-xs text-gray-500">Message will be hidden only for you</div>
          </div>
        </button>
        {isMe && (
          <button
            onClick={() => {
              onDelete('everyone');
              onClose();
            }}
            className="w-full px-4 py-4 text-left text-[13px] text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3 min-h-[48px]"
          >
            <Trash2 size={16} />
            <div>
              <div className="font-medium">Delete for everyone</div>
              <div className="text-xs text-red-500">This action cannot be undone</div>
            </div>
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full px-4 py-4 text-left text-[13px] text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mt-2 min-h-[48px]"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default DeleteMessageModal;
