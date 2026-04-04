'use client';

import React, { useState, useRef } from 'react';
import { X, Send, Download, File, Image as ImageIcon } from 'lucide-react';

interface FilePreviewModalProps {
    isOpen: boolean;
    file: {
        url: string;
        filename: string;
        size: number;
        type: string;
        isImage: boolean;
    } | null;
    onClose: () => void;
    onSend: (caption: string) => void;
    loading?: boolean;
}

export default function FilePreviewModal({ 
    isOpen, 
    file, 
    onClose, 
    onSend, 
    loading = false 
}: FilePreviewModalProps) {
    const [caption, setCaption] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    if (!isOpen || !file) return null;

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = () => {
        if (file.isImage) {
            return <ImageIcon size={24} className="text-blue-500" />;
        }
        return <File size={24} className="text-gray-500" />;
    };

    const handleSend = () => {
        onSend(caption);
        setCaption('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {getFileIcon()}
                        <div>
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                {file.filename}
                            </p>
                            <p className="text-sm text-gray-500">
                                {formatFileSize(file.size)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {file.isImage ? (
                        <div className="flex justify-center">
                            <img
                                src={file.url}
                                alt={file.filename}
                                className="max-w-full max-h-[400px] object-contain rounded-lg"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                {getFileIcon()}
                            </div>
                            <p className="text-gray-600 text-center">{file.filename}</p>
                            <button
                                onClick={() => window.open(file.url, '_blank')}
                                className="mt-3 text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
                            >
                                <Download size={16} />
                                Download
                            </button>
                        </div>
                    )}

                    {/* Caption Input */}
                    <div className="mt-4">
                        <textarea
                            ref={textareaRef}
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Add a caption..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent"
                            rows={3}
                            maxLength={1000}
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                            {caption.length}/1000
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="flex-1 py-2 px-4 bg-[#00a884] hover:bg-[#008069] text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Send size={16} />
                        )}
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
