'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import api from '@/utils/api';

const schema = z.object({
    email: z.string().email('Valid email required'),
});

type FormData = z.infer<typeof schema>;

interface ForgotPasswordFormProps {
    onSuccess: () => void;
    onBack: () => void;
}

export default function ForgotPasswordForm({ onSuccess, onBack }: ForgotPasswordFormProps) {
    const [sentEmail, setSentEmail] = useState<string>('');
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        try {
            await api.post('/auth/forgot-password', { email: data.email.trim() });
            setSentEmail(data.email);
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Something went wrong';
            setError('root', { message });
        }
    };

    if (sentEmail) {
        return (
            <div className="z-10 w-full max-w-[400px] bg-white shadow-2xl rounded-lg p-8">
                <h2 className="text-xl font-bold text-[#111b21] text-center mb-4">Check your email</h2>
                <p className="text-[#667781] text-center text-sm mb-6">
                    If an account exists with <strong>{sentEmail}</strong>, you will receive a password reset link.
                </p>
                <button
                    onClick={onBack}
                    className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} /> Back to Login
                </button>
            </div>
        );
    }

    return (
        <div className="z-10 w-full max-w-[400px] bg-white shadow-2xl rounded-lg p-8">
            <button onClick={onBack} className="text-[#667781] hover:text-[#111b21] mb-4 flex items-center gap-2">
                <ArrowLeft size={18} /> Back
            </button>
            <h2 className="text-xl font-bold text-[#111b21] mb-2">Forgot password?</h2>
            <p className="text-[#667781] text-sm mb-6">Enter your email and we&apos;ll send you a reset link.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errors.root && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded">{errors.root.message}</div>
                )}
                <div>
                    <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Email</label>
                    <div className="relative mt-1">
                        <Mail className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="your@email.com"
                            className="w-full rounded-lg border border-[#e9edef] bg-white px-10 py-2.5 outline-none focus:border-[#00a884]"
                        />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Send reset link'}
                </button>
            </form>
        </div>
    );
}
