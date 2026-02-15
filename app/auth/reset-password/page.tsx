'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import api from '@/utils/api';

const schema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [done, setDone] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        if (!token) {
            setError('root', { message: 'Invalid reset link' });
            return;
        }
        try {
            await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
            setDone(true);
            setTimeout(() => router.push('/chat'), 2000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to reset password';
            setError('root', { message: msg });
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
                <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-2">Invalid link</h1>
                    <p className="text-[#667781] mb-6">This password reset link is invalid or expired.</p>
                    <button onClick={() => router.push('/chat')} className="text-[#00a884] font-medium hover:underline">
                        Go to login
                    </button>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
                <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full text-center">
                    <CheckCircle size={64} className="text-[#00a884] mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-[#111b21] mb-2">Password reset!</h1>
                    <p className="text-[#667781]">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
            <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full">
                <h1 className="text-xl font-bold text-[#111b21] mb-2">Set new password</h1>
                <p className="text-[#667781] text-sm mb-6">Enter your new password below.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {errors.root && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded">
                            {errors.root.message}
                        </div>
                    )}
                    <div>
                        <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">New Password</label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                            <input
                                {...register('newPassword')}
                                type="password"
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-[#e9edef] bg-white px-10 py-2.5 outline-none focus:border-[#00a884]"
                            />
                        </div>
                        {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
                    </div>
                    <div>
                        <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Confirm Password</label>
                        <div className="relative mt-1">
                            <Lock className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                            <input
                                {...register('confirmPassword')}
                                type="password"
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-[#e9edef] bg-white px-10 py-2.5 outline-none focus:border-[#00a884]"
                            />
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Reset password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
