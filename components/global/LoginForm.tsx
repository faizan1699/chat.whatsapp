'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, Check } from 'lucide-react';
import { useAuthHook } from '@/hooks/useAuthHook';
import FormErrorMessage from './FormErrorMessage';

const schema = z.object({
    identifier: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
    termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

type FormData = z.infer<typeof schema>;

interface LoginFormProps {
    onSuccess: (user: { username: string; userId?: string }) => void;
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
}

export default function LoginForm({ 
    onSuccess, 
    onSwitchToRegister, 
    onForgotPassword 
}: LoginFormProps) {

    const {
        loginWithProfile,
        loading,
        error
    } = useAuthHook();

    const {
        register,
        handleSubmit,
        formState: {
            errors
        } } = useForm<FormData>({
            resolver: zodResolver(schema),
            defaultValues: {
                termsAccepted: true,
            },
        });

    const onSubmit = async (data: FormData) => {
        try {
            const { loginResponse } = await loginWithProfile({
                identifier: data.identifier,
                password: data.password,
                termsAccepted: data.termsAccepted,
            });

            const user = loginResponse?.user;

            if (user?.username) {
                onSuccess({ username: user.username, userId: user.id });
            } else {
                onSuccess({ username: data.identifier });
            }
        } catch (err: any) {
            console.error('Login failed:', err.message);
        }
    };

    return (
        <div className="z-10 w-full md:w-[95%] max-w-[500px] bg-white shadow-2xl rounded-lg p-8">
            <h1 className="text-2xl font-bold text-[#111b21] mb-2">Welcome back</h1>
            <p className="text-[#667781] mb-6">Sign in to continue to NexChat</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 text-red-700 text-sm rounded">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-[13px] font-medium text-[#00a884] uppercase tracking-wider">Email or Username</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                        <input
                            {...register('identifier')}
                            className="w-full rounded-lg border border-[#e9edef] bg-white px-10 py-2.5 outline-none focus:border-[#00a884] transition-all"
                            placeholder="your@email.com or username"
                        />
                    </div>
                    {errors.identifier && <FormErrorMessage error={errors.identifier} />}
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
                    {errors.password && <FormErrorMessage error={errors.password} />}
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-xs text-[#00a884] hover:underline"
                    >
                        Forgot password?
                    </button>
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
                    {errors.termsAccepted && <FormErrorMessage error={errors.termsAccepted} />}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                </button>

                <p className="text-center text-sm text-[#667781]">
                    Don&apos;t have an account?{' '}
                    <button type="button" onClick={onSwitchToRegister} className="text-[#00a884] font-medium hover:underline">
                        Register
                    </button>
                </p>
            </form>
        </div>
    );
}
