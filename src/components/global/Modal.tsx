import React from 'react';

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, title, children }) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] animate-in fade-in duration-200 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 max-w-sm w-full mx-auto animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-[#111b21] mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
};

export default Modal;
