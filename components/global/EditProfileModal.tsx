'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, User, Loader2, Lock } from 'lucide-react';
import api from '@/utils/api';

const profileSchema = z.object({
    username: z.string().min(2, 'Username must be at least 2 characters'),
    avatar: z.union([z.string().url(), z.literal('')]).optional(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (username?: string) => void;
}

export default function EditProfileModal({ isOpen, onClose, onSuccess }: EditProfileModalProps) {
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [profileLoading, setProfileLoading] = useState(false);

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
    });
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        if (isOpen) {
            api.get('/auth/profile').then((res) => {
                const d = res.data;
                profileForm.reset({
                    username: d?.username || '',
                    avatar: d?.avatar || '',
                });
            }).catch(() => {});
        }
    }, [isOpen]);

    const onProfileSubmit = async (data: ProfileFormData) => {
        setProfileLoading(true);
        profileForm.clearErrors('root');
        try {
            const res = await api.patch('/auth/profile', {
                username: data.username,
                avatar: data.avatar || undefined,
            });
            onSuccess(res.data?.username);
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Update failed';
            profileForm.setError('root', { type: 'manual', message: msg });
        } finally {
            setProfileLoading(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordFormData) => {
        try {
            await api.post('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            passwordForm.reset();
            onClose();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed';
            passwordForm.setError('root', { message: msg });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5]">
                    <h2 className="text-lg font-bold text-[#111b21]">Edit Profile</h2>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-[#f0f2f5]">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'profile' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#667781]'}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === 'password' ? 'text-[#00a884] border-b-2 border-[#00a884]' : 'text-[#667781]'}`}
                    >
                        Change Password
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'profile' && (
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            {profileForm.formState.errors.root && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded">
                                    {profileForm.formState.errors.root.message}
                                </div>
                            )}
                            <div>
                                <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Username</label>
                                <div className="relative mt-1">
                                    <User className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                                    <input
                                        {...profileForm.register('username')}
                                        className="w-full rounded-lg border border-[#e9edef] px-10 py-2.5 outline-none focus:border-[#00a884]"
                                    />
                                </div>
                                {profileForm.formState.errors.username && (
                                    <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.username.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Avatar URL (optional)</label>
                                <input
                                    {...profileForm.register('avatar')}
                                    placeholder="https://..."
                                    className="w-full rounded-lg border border-[#e9edef] px-3 py-2.5 outline-none focus:border-[#00a884] mt-1"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {profileLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            {passwordForm.formState.errors.root && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded">
                                    {passwordForm.formState.errors.root.message}
                                </div>
                            )}
                            <div>
                                <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Current Password</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                                    <input
                                        {...passwordForm.register('currentPassword')}
                                        type="password"
                                        className="w-full rounded-lg border border-[#e9edef] px-10 py-2.5 outline-none focus:border-[#00a884]"
                                    />
                                </div>
                                {passwordForm.formState.errors.currentPassword && (
                                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">New Password</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                                    <input
                                        {...passwordForm.register('newPassword')}
                                        type="password"
                                        className="w-full rounded-lg border border-[#e9edef] px-10 py-2.5 outline-none focus:border-[#00a884]"
                                    />
                                </div>
                                {passwordForm.formState.errors.newPassword && (
                                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Confirm Password</label>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                                    <input
                                        {...passwordForm.register('confirmPassword')}
                                        type="password"
                                        className="w-full rounded-lg border border-[#e9edef] px-10 py-2.5 outline-none focus:border-[#00a884]"
                                    />
                                </div>
                                {passwordForm.formState.errors.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={passwordForm.formState.isSubmitting}
                                className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {passwordForm.formState.isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Change Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
