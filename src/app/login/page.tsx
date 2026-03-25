'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, MessageCircle, Lock, Mail, User } from 'lucide-react';
import { frontendAuth } from '@/utils/frontendAuth';
import { authToast } from '@/utils/toast';
import { hasCookieAcceptance } from '@/utils/cookieConsent';
import { conversationsManager } from '@/utils/conversationsManager';
import EmailVerificationModal from '@/components/auth/EmailVerificationModal';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import EmailField from '@/components/auth/EmailField';
import PasswordField from '@/components/auth/PasswordField';

interface LoginFormData {
    identifier: string;
    password: string;
}

function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [pendingUserEmail, setPendingUserEmail] = useState('');
    const router = useRouter();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<LoginFormData>();

    const onSubmit = async (data: LoginFormData) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            const responseData = await response.json();

            if (response.ok) {
                frontendAuth.setSession(
                    responseData.accessToken,
                    responseData.refreshToken,
                    responseData.user
                );
                                try {
                    await conversationsManager.loadConversations('login');
                    console.log('✅ Conversations pre-loaded after login');
                } catch (error) {
                    console.warn('⚠️ Failed to pre-load conversations after login:', error);
                }
                
                authToast.loginSuccess(responseData.user?.username);
                
                if (!hasCookieAcceptance()) {
                    setTimeout(() => {
                        authToast.cookieConsent();
                    }, 10000);
                }
                                
                router.push('/chat');
            } else if (responseData.requiresEmailVerification) {
                // Handle email verification requirement
                setPendingUserEmail(responseData.email);
                setShowEmailVerification(true);
                setError('');
            } else {
                setError(responseData.message || 'Login failed');
                authToast.loginError(responseData.message);
            }
        } catch (error) {
            setError('Network error. Please try again.');
            authToast.loginError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Video Calling App</h1>
                    <p className="text-gray-600">Connect with friends securely</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-sm text-gray-600">Sign in to continue to your account</p>
                    </div>

                    <form id="login-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        <EmailField
                            value={watch('identifier') || ''}
                            onChange={(value) => setValue('identifier', value)}
                            placeholder="Enter your username or email"
                            label="Username or Email"
                            required
                            disabled={loading}
                            error={errors.identifier?.message}
                        />

                        <PasswordField
                            value={watch('password') || ''}
                            onChange={(value) => setValue('password', value)}
                            placeholder="Enter your password"
                            label="Password"
                            required
                            disabled={loading}
                            error={errors.password?.message}
                            showForgotPassword={true}
                            onForgotPassword={() => setShowForgotPassword(true)}
                        />

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign up
                            </a>
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Secured with HTTP-only cookies
                    </p>
                </div>

                {/* Email Verification Modal */}
                <EmailVerificationModal
                    isOpen={showEmailVerification}
                    onClose={() => setShowEmailVerification(false)}
                    email={pendingUserEmail}
                    onSuccess={() => {
                        setShowEmailVerification(false);
                        // Re-attempt login after successful verification
                        const form = document.getElementById('login-form') as HTMLFormElement;
                        if (form) {
                            form.requestSubmit();
                        }
                    }}
                />

                {/* Forgot Password Modal */}
                <ForgotPasswordModal
                    isOpen={showForgotPassword}
                    onClose={() => setShowForgotPassword(false)}
                    onBackToLogin={() => setShowForgotPassword(false)}
                />
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
