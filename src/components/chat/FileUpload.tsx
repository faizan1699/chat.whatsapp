'use client';

import { useState, useRef } from 'react';
import { Paperclip, X, File, Image } from 'lucide-react';
import api from '@/utils/api';

interface FileUploadProps {
    onFileSelect: (file: {
        url: string;
        filename: string;
        size: number;
        type: string;
        isImage: boolean;
    }) => void;
    disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled = false }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        // Check file type
        const allowedTypes = [
            'image/jpeg',
            'image/png', 
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
            setError('File type not supported');
            return;
        }

        setError('');
        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/upload/file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                },
            });

            const fileInfo = response.data.file;
            onFileSelect(fileInfo);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to upload file';
            setError(errorMessage);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="relative">
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                disabled={disabled}
            />

            <button
                onClick={handleClick}
                disabled={disabled || uploading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file (max 10MB)"
            >
                {uploading ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <Paperclip size={20} className="text-gray-600" />
                )}
            </button>

            {/* Upload Progress Modal */}
            {uploading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Uploading File</h3>
                        
                        <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 text-center">
                                {uploadProgress}%
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500">
                                Uploading file... (max 10MB)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="absolute bottom-full left-0 mb-2 bg-red-50 border border-red-200 rounded-lg p-2 min-w-max">
                    <div className="flex items-center gap-2">
                        <X size={16} className="text-red-600" />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
