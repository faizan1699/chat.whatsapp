'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Phone, Lock, Loader2, CheckCircle } from 'lucide-react';
import api from '@/utils/api';

const schema = z.object({
    username: z.string().min(2, 'Username must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phoneNumber: z.string().min(10, 'Invalid phone number').optional().or(z.literal('')),
    password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.email || data.phoneNumber, {
    message: "Either email or phone number is required",
    path: ["email"]
});

type FormData = z.infer<typeof schema>;

interface RegistrationFormProps {
    onSuccess: (user: any) => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/register', data);
            setIsSuccess(true);
            setTimeout(() => {
                onSuccess(response.data);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
                <CheckCircle size={64} className="text-[#00a884] mb-4" />
                <h2 className="text-2xl font-bold text-[#111b21]">Success!</h2>
                <p className="text-[#667781] mt-2">Account created. OTP sent to your email (check inbox & spam).</p>
                <p className="text-[#00a884] mt-4 font-medium italic">Redirecting to chat...</p>
            </div>
        );
    }

    return (
        <div className="z-10 w-full md:w-[95%] max-w-[1000px] bg-white shadow-2xl md:rounded-sm flex flex-col md:flex-row overflow-hidden min-h-[600px]">
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
                        <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Email (Optional)</label>
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
                        <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Phone Number (Required for OTP)</label>
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

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3.5 rounded-lg transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            "Register & Verify"
                        )}
                    </button>

                    <p className="text-center text-xs text-[#8696a0] mt-6">
                        By registering, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </form>
            </div>
        </div>
    );
}
