'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Phone, Lock, Loader2, CheckCircle } from 'lucide-react';
import api from '@/utils/api';
import { hasCookieAcceptance, getCookiePreferences } from '@/utils/cookieConsent';

const schema = z.object({
    username: z.string().min(2, 'Username must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phoneNumber: z.string().min(10, 'Invalid phone number').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.email || data.phoneNumber, {
    message: "Either email or phone number is required",
    path: ["email"]
});

type FormData = z.infer<typeof schema>;

interface RegistrationFormProps {
    onSuccess: (user: { username: string; userId?: string }, email?: string) => void;
    onSwitchToLogin?: () => void;
}

export default function RegistrationForm({ onSuccess, onSwitchToLogin }: RegistrationFormProps) {
    const [error, setError] = useState<string | null>(null);
    const [successNoEmail, setSuccessNoEmail] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            termsAccepted: false,
        },
    });

    const onSubmit = async (data: FormData) => {
        setError(null);
        try {
            // Get cookie consent data if available
            const cookieConsent = hasCookieAcceptance() ? getCookiePreferences() : null;

            const response = await api.post('/auth/register', {
                ...data,
                cookieConsent: cookieConsent,
            });
            const userData = {
                username: data.username,
                userId: response.data?.userId,
            };
            if (data.email) {
                onSuccess(userData, data.email);
            } else {
                setSuccessNoEmail(true);
                setTimeout(() => onSuccess(userData), 2000);
            }
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed. Please try again.');
        }
    };

    if (successNoEmail) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
                <CheckCircle size={64} className="text-[#00a884] mb-4" />
                <h2 className="text-2xl font-bold text-[#111b21]">Success!</h2>
                <p className="text-[#667781] mt-2">Account created. Redirecting to chat...</p>
            </div>
        );
    }

    return (
        <div className="z-10 w-full md:w-[95%] max-w-[1000px] bg-white shadow-2xl md:rounded-sm flex flex-col md:flex-row overflow-auto min-h-[600px]">
            <div className="flex-1 p-8 md:p-16 flex flex-col bg-[#f0f2f5]">
                <h1 className="text-2xl md:text-3xl font-light text-[#41525d] mb-6">Create your NexChat account</h1>
                <p className="text-[#667781] mb-8">Secure, real-time messaging with your friends and family.</p>

                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-[#00a884]/10 flex items-center justify-center shrink-0">
                            <span className="text-[#00a884] font-bold text-sm">1</span>
                        </div>
                        <p className="text-[#41525d]">Register with your email or phone number</p>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-[#00a884]/10 flex items-center justify-center shrink-0">
                            <span className="text-[#00a884] font-bold text-sm">2</span>
                        </div>
                        <p className="text-[#41525d]">Verify your account via Email OTP</p>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-[#00a884]/10 flex items-center justify-center shrink-0">
                            <span className="text-[#00a884] font-bold text-sm">3</span>
                        </div>
                        <p className="text-[#41525d]">Start chatting and making calls</p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-[450px] bg-white border-l border-[#f0f2f5] p-8 md:p-10">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                            <input
                                {...register('username')}
                                className="w-full rounded-lg border border-[#e9edef] bg-white px-10 py-2.5 outline-none focus:border-[#00a884] transition-all"
                                placeholder="Enter username"
                            />
                        </div>
                        {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Email (OTP bhejenge - zaroori)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                            <input
                                {...register('email')}
                                className="w-full rounded-lg border border-[#e9edef] bg-white px-10 py-2.5 outline-none focus:border-[#00a884] transition-all"
                                placeholder="example@mail.com"
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Phone Number (Optional)</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                            <input
                                {...register('phoneNumber')}
                                className="w-full rounded-lg border border-[#e9edef] bg-white px-10 py-2.5 outline-none focus:border-[#00a884] transition-all"
                                placeholder="+92XXXXXXXXXX"
                            />
                        </div>
                        {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                            <input
                                type="password"
                                {...register('password')}
                                className="w-full rounded-lg border border-[#e9edef] bg-white px-10 py-2.5 outline-none focus:border-[#00a884] transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>

                <div className="space-y-1.5">
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="termsAccepted"
                            {...register('termsAccepted')}
                            className="mt-1 h-4 w-4 text-[#00a884] border-[#e9edef] rounded focus:ring-[#00a884]"
                        />
                        <label htmlFor="termsAccepted" className="text-xs text-[#667781] leading-relaxed">
                            I accept the{' '}
                            <a href="/legal/user-agreement" target="_blank" rel="noopener noreferrer" className="text-[#00a884] hover:underline">
                                Terms and Conditions
                            </a>
                            {' '}and{' '}
                            <a href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#00a884] hover:underline">
                                Privacy Policy
                            </a>
                        </label>
                    </div>
                    {errors.termsAccepted && <p className="text-xs text-red-500">{errors.termsAccepted.message}</p>}
                </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3.5 rounded-lg transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            "Register & Verify"
                        )}
                    </button>

                    {onSwitchToLogin && (
                        <p className="text-center text-sm text-[#667781] mt-4">
                            Already have an account?{' '}
                            <button type="button" onClick={onSwitchToLogin} className="text-[#00a884] font-medium hover:underline">
                                Login
                            </button>
                        </p>
                    )}
                    <p className="text-center text-xs text-[#8696a0] mt-2">
                        By registering, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </form>
            </div>
        </div>
    );
}
