'use client';

import React from 'react';
import toast, { Toaster, Toast, resolveValue } from 'react-hot-toast';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

interface CustomToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning' | 'default';
    duration?: number;
    showClose?: boolean;
    icon?: React.ReactNode;
    id?: string;
}

export const showCustomToast = ({
    message,
    type = 'default',
    duration = 4000,
    showClose = true,
    icon,
}: CustomToastProps) => {
    toast.custom(
        (t) => (
            <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}
            >
                <div className="flex-1 w-0 p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                            {icon || (
                                <>
                                    {type === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
                                    {type === 'error' && <AlertCircle className="h-6 w-6 text-red-500" />}
                                    {type === 'info' && <Info className="h-6 w-6 text-blue-500" />}
                                    {type === 'warning' && <AlertCircle className="h-6 w-6 text-yellow-500" />}
                                    {type === 'default' && <Bell className="h-6 w-6 text-gray-400" />}
                                </>
                            )}
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                {showClose && (
                    <div className="flex border-l border-gray-200">
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                        >
                            <X size={18} className="text-gray-400 hover:text-gray-600" />
                        </button>
                    </div>
                )}
            </div>
        ),
        { duration }
    );
};

export default function CustomToaster() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 4000,
            }}
        />
    );
}
