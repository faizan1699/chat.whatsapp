'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, MessageCircle, Lock, Mail, User, Camera, Upload, Check } from 'lucide-react';
import { frontendAuth } from '@/utils/frontendAuth';
import api from '@/utils/api';
import ImageCropper from '@/components/global/ImageCropper';

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    avatar?: string;
    verificationCode?: string;
}

function RegisterForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [verificationSent, setVerificationSent] = useState(false);
    const [croppedAvatar, setCroppedAvatar] = useState<string>('');
    const [showCropper, setShowCropper] = useState(false);
    const [tempAvatar, setTempAvatar] = useState<string>('');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check if user is already logged in and redirect to chat
    useEffect(() => {
        if (frontendAuth.isAuthenticated()) {
            console.log('✅ User already logged in, redirecting to chat...');
            router.push('/chat');
            router.refresh();
        }
    }, [router]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        watch,
        setValue,
        trigger,
    } = useForm<RegisterFormData>();

    const password = watch('password');

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setFormError('avatar', { type: 'manual', message: 'Image size should be less than 5MB' });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setTempAvatar(result);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImage: string) => {
        setCroppedAvatar(croppedImage);
        setAvatarPreview(croppedImage);
        setValue('avatar', croppedImage);
        setShowCropper(false);
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setTempAvatar('');
    };

    const onBasicInfoSubmit = async (data: RegisterFormData) => {
        try {
            const response = await api.post('/auth/register', {
                username: data.username,
                email: data.email,
                password: data.password,
                phone: data.phone,
            });

            setVerificationSent(true);
            setStep(2);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Registration failed';
            setFormError('root', { type: 'manual', message: errorMessage });
        }
    };

    const onVerificationSubmit = async (data: RegisterFormData) => {
        try {
            const response = await api.post('/auth/verify-email', {
                email: data.email,
                code: data.verificationCode,
            });

            setStep(3);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Verification failed';
            setFormError('verificationCode', { type: 'manual', message: errorMessage });
        }
    };

    const handleResendOTP = async () => {
        try {
            const response = await api.post('/auth/resend-otp', {
                email: watch('email'),
            });

            // Show success message
            setFormError('verificationCode', { 
                type: 'manual', 
                message: 'New verification code sent to your email' 
            });
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to resend code';
            setFormError('verificationCode', { type: 'manual', message: errorMessage });
        }
    };

    const onFinalSubmit = async (data: RegisterFormData) => {
        try {
            const response = await api.post('/auth/complete-registration', {
                username: data.username,
                email: data.email,
                avatar: croppedAvatar || data.avatar,
            });

            const responseData = response.data;
            
            frontendAuth.setSession(
                responseData.accessToken,
                responseData.refreshToken,
                responseData.user
            );

            router.push('/chat');
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Registration completion failed';
            setFormError('root', { type: 'manual', message: errorMessage });
        }
    };

    const onSubmit = (data: RegisterFormData) => {
        if (step === 1) {
            onBasicInfoSubmit(data);
        } else if (step === 2) {
            onVerificationSubmit(data);
        } else if (step === 3) {
            onFinalSubmit(data);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        {...register('username', {
                            required: 'Username is required',
                            minLength: {
                                value: 3,
                                message: 'Username must be at least 3 characters',
                            },
                            pattern: {
                                value: /^[a-zA-Z0-9_]+$/,
                                message: 'Username can only contain letters, numbers, and underscores',
                            },
                        })}
                        type="text"
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.username ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Choose a username"
                    />
                </div>
                {errors.username && (
                    <p className="mt-2 text-sm text-red-600">{errors.username.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        {...register('email', {
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address',
                            },
                        })}
                        type="email"
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Enter your email"
                    />
                </div>
                {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (optional)
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        {...register('phone', {
                            pattern: {
                                value: /^[+]?[\d\s-()]+$/,
                                message: 'Invalid phone number format',
                            },
                        })}
                        type="tel"
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.phone ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="+1234567890"
                    />
                </div>
                {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        {...register('password', {
                            required: 'Password is required',
                            minLength: {
                                value: 6,
                                message: 'Password must be at least 6 characters',
                            },
                        })}
                        type={showPassword ? 'text' : 'password'}
                        className={`block w-full pl-10 pr-10 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Create a password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                    </button>
                </div>
                {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        {...register('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: (value) => value === password || 'Passwords do not match',
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`block w-full pl-10 pr-10 py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Confirm your password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-5">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
                <p className="text-gray-600 mb-4">
                    We've sent a verification code to {watch('email')}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                </label>
                <input
                    {...register('verificationCode', {
                        required: 'Verification code is required',
                        minLength: {
                            value: 6,
                            message: 'Code must be 6 digits',
                        },
                        maxLength: {
                            value: 6,
                            message: 'Code must be 6 digits',
                        },
                        pattern: {
                            value: /^\d{6}$/,
                            message: 'Code must be 6 digits',
                        },
                    })}
                    type="text"
                    className={`block w-full px-3 py-3 border ${errors.verificationCode ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-lg tracking-widest`}
                    placeholder="000000"
                    maxLength={6}
                />
                {errors.verificationCode && (
                    <p className="mt-2 text-sm text-red-600">{errors.verificationCode.message}</p>
                )}
            </div>

            <button
                type="button"
                onClick={handleResendOTP}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
                Resend verification code
            </button>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-5">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Profile Picture</h3>
                <p className="text-gray-600 mb-4">
                    This is optional - you can skip this step
                </p>
            </div>

            <div className="flex justify-center">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-gray-300">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User size={48} className="text-gray-400" />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="avatar-upload"
                    />
                    <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg cursor-pointer transition-colors"
                    >
                        <Camera size={20} />
                    </label>
                </div>
            </div>

            {errors.avatar && (
                <p className="mt-2 text-sm text-red-600 text-center">{errors.avatar.message}</p>
            )}

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                >
                    Skip this step
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Video Calling App</h1>
                    <p className="text-gray-600">Create your account</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {step === 1 && 'Create Account'}
                                {step === 2 && 'Verify Email'}
                                {step === 3 && 'Profile Picture'}
                            </h2>
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                            s <= step
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                        }`}
                                    >
                                        {s < step ? <Check size={16} /> : s}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {step === 1 && 'Fill in your details to get started'}
                            {step === 2 && 'Enter the 6-digit code sent to your email'}
                            {step === 3 && 'Add a profile picture (optional)'}
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}

                        {/* Error Message */}
                        {errors.root && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-600">{errors.root.message}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    {step === 1 && 'Creating Account...'}
                                    {step === 2 && 'Verifying...'}
                                    {step === 3 && 'Completing...'}
                                </div>
                            ) : (
                                <>
                                    {step === 1 && 'Create Account'}
                                    {step === 2 && 'Verify Email'}
                                    {step === 3 && 'Complete Registration'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign in
                            </a>
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Secured with HTTP-only cookies
                    </p>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {showCropper && (
                <ImageCropper
                    image={tempAvatar}
                    onCropComplete={handleCropComplete}
                    onClose={handleCropCancel}
                />
            )}
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterForm />
        </Suspense>
    );
}
