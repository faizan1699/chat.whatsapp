'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import api from '@/utils/api';

const schema = z.object({
    otp: z.string().length(6, 'Enter 6-digit code'),
});

type FormData = z.infer<typeof schema>;

interface VerifyEmailFormProps {
    email: string;
    onVerified: () => void;
    onResend?: () => void;
}

export default function VerifyEmailForm({ email, onVerified }: VerifyEmailFormProps) {
    const [resendSuccess, setResendSuccess] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { otp: '' },
    });

    const onSubmit = async (data: FormData) => {
        try {
            await api.post('/auth/verify-email', { email, otp: data.otp });
            onVerified();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid OTP';
            setError('otp', { message });
        }
    };

    const handleResend = async () => {
        setResendSuccess(false);
        try {
            await api.post('/auth/resend-otp', { email });
            setResendSuccess(true);
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to resend';
            setError('root', { message });
        }
    };

    return (
        <div className="z-10 w-full max-w-[400px] bg-white shadow-2xl rounded-lg p-8">
            <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-[#00a884]/10 flex items-center justify-center">
                    <Mail className="text-[#00a884]" size={32} />
                </div>
            </div>
            <h2 className="text-xl font-bold text-[#111b21] text-center mb-2">Verify your email</h2>
            <p className="text-[#667781] text-center text-sm mb-6">
                We sent a 6-digit code to <strong>{email}</strong>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {(errors.otp || errors.root) && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded">
                        {errors.otp?.message || errors.root?.message}
                    </div>
                )}
                {resendSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-3 text-green-700 text-sm rounded">
                        Code sent! Check your email.
                    </div>
                )}

                <div>
                    <input
                        {...register('otp', {
                            setValueAs: (v) => (v || '').replace(/\D/g, '').slice(0, 6),
                        })}
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        placeholder="000000"
                        className="w-full text-center text-2xl font-mono tracking-[0.5em] rounded-lg border border-[#e9edef] py-3 outline-none focus:border-[#00a884]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle size={20} /> Verify</>}
                </button>

                <p className="text-center text-sm text-[#667781]">
                    Didn&apos;t receive?{' '}
                    <button type="button" onClick={handleResend} className="text-[#00a884] font-medium hover:underline">
                        Resend code
                    </button>
                </p>
            </form>
        </div>
    );
}
