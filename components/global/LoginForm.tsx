'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2 } from 'lucide-react';
import api from '@/utils/api';

const schema = z.object({
    identifier: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

interface LoginFormProps {
    onSuccess: (user: { username: string; userId?: string }) => void;
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', {
                identifier: data.identifier,
                password: data.password,
            });
            const user = response.data?.user;
            if (user?.username) {
                onSuccess({ username: user.username, userId: user.id });
            } else {
                onSuccess({ username: data.identifier });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setIsLoading(false);
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
                    {errors.identifier && <p className="text-xs text-red-500">{errors.identifier.message}</p>}
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
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-xs text-[#00a884] hover:underline"
                    >
                        Forgot password?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#00a884] hover:bg-[#008069] text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
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
