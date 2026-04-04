'use client';

import { useState } from 'react';
import { Download, File, Image, X, Eye } from 'lucide-react';

interface FileMessageProps {
    file: {
        url: string;
        filename: string;
        size: number;
        type: string;
        isImage: boolean;
    };
    removable?: boolean;
    onRemove?: () => void;
}

export default function FileMessage({ file, removable = false, onRemove }: FileMessageProps) {
    const [imageError, setImageError] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = () => {
        if (file.isImage && !imageError) {
            return <Image size={20} className="text-blue-600" />;
        }

        // File type icons
        if (file.type.includes('pdf')) {
            return <File size={20} className="text-red-600" />;
        }
        if (file.type.includes('word') || file.type.includes('document')) {
            return <File size={20} className="text-blue-700" />;
        }
        if (file.type.includes('text')) {
            return <File size={20} className="text-gray-600" />;
        }

        return <File size={20} className="text-gray-500" />;
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImageClick = () => {
        if (file.isImage && !imageError) {
            setShowImageModal(true);
        } else {
            handleDownload();
        }
    };

    const isImageFile = file.isImage && !imageError;

    return (
        <>
            <div className={`relative group ${isImageFile ? 'inline-block' : 'inline-flex items-center'}`}>
                {/* Remove Button */}
                {removable && onRemove && (
                    <button
                        onClick={onRemove}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <X size={12} />
                    </button>
                )}

                {/* Image Preview */}
                {isImageFile ? (
                    <div 
                        className="cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={handleImageClick}
                    >
                        <img
                            src={file.url}
                            alt={file.filename}
                            className="max-w-xs max-h-64 rounded-lg object-cover"
                            onError={() => setImageError(true)}
                        />
                        <div className="mt-1 text-xs text-gray-500">
                            {file.filename} • {formatFileSize(file.size)}
                        </div>
                    </div>
                ) : (
                    /* File Preview */
                    <div
                        className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={handleDownload}
                    >
                        <div className="flex-shrink-0">
                            {getFileIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {file.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatFileSize(file.size)}
                            </p>
                        </div>
                        <Download size={16} className="text-gray-400 flex-shrink-0" />
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {showImageModal && (
                <div 
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowImageModal(false);
                            }}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        
                        <img
                            src={file.url}
                            alt={file.filename}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg">
                            <p className="font-medium">{file.filename}</p>
                            <p className="text-sm opacity-80">{formatFileSize(file.size)}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
