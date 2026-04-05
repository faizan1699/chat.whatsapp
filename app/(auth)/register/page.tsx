'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, Mail, User, Camera } from 'lucide-react';
import { frontendAuth } from '@/utils/frontendAuth';
import { useImageCropper } from '@/hooks/useImageCropper';
import GlobalImageCropper from '@/components/global/GlobalImageCropper';
import Link from 'next/link';

import { useAuthHook } from '@/hooks/useAuthHook';

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
    termsAccepted: boolean;
    confirmPassword?: string;
    avatar?: string;
    verificationCode?: string;
    dateOfBirth?: string;
    fatherName?: string;
    address?: string;
    cnic?: string;
    gender?: string;
    hobbies?: string[];
}

const RegisterForm = () => {
    
    const [passwordVisibility, setPasswordVisibility] = useState({
        password: false,
        confirmPassword: false
    });
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [verificationSent, setVerificationSent] = useState(false);
    const [step, setStep] = useState(1);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register: registerUser, loading, error } = useAuthHook();
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        termsAccepted: false
    });

    const {
        selectedImage,
        croppedImage,
        showCropper,
        crop,
        zoom,
        setCrop,
        setZoom,
        handleImageSelect,
        handleCropComplete,
        handleCropConfirm,
        handleCropCancel,
    } = useImageCropper();

    useEffect(() => {
        if (frontendAuth.isAuthenticated()) {
            router.push('/chat');
            router.refresh();
        }
    }, [router]);

    const {
        register: formRegister,
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
            handleImageSelect(file);
        }
    };

    const handleChange = (event: any) => {
        const { name, value } = event.target;
        setValue(name, value);
        trigger(name);
    };

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerUser(data);
            const returnTo = searchParams?.get('returnTo') || '/chat';
            router.push(returnTo);
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    const handleResendOTP = async () => {
        console.log('Resend OTP clicked');
    };

      useEffect(() => {
        if (croppedImage) {
            setAvatarPreview(croppedImage);
            setValue('avatar', croppedImage);
        }
    }, [croppedImage, setValue]);

    const renderStep1 = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        {...formRegister('username', {
                            required: 'Username is required',
                            minLength: {
                                value: 3,
                                message: 'Username must be at least 3 characters',
                            },
                            pattern: {
                                value: /^[a-zA-Z0-9_]+$/,
                                message: 'Username can only contain letters, numbers, and underscores',
                            },
                            onChange: (e) => handleChange(e)
                        })}
                        type="text"
                        className={`block w-full pl-10 pr-3 py-3 bg-gray-50 border ${errors.username ? 'border-red-300' : 'border-gray-300'
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
                        {...formRegister('email', {
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address',
                            },
                            onChange: (e) => handleChange(e)
                        })}
                        type="email"
                        className={`block w-full pl-10 pr-3 py-3 bg-gray-50 border ${errors.email ? 'border-red-300' : 'border-gray-300'
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
                        {...formRegister('phoneNumber', {
                            pattern: {
                                value: /^[+]?[\d\s-()]+$/,
                                message: 'Invalid phone number format',
                            },
                            onChange: (e) => handleChange(e)
                        })}
                        type="tel"
                        className={`block w-full pl-10 pr-3 py-3 bg-gray-50 border ${errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="+1234567890"
                    />
                </div>
                {errors.phoneNumber && (
                    <p className="mt-2 text-sm text-red-600">{errors.phoneNumber.message}</p>
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
                        {...formRegister('password', {
                            required: 'Password is required',
                            minLength: {
                                value: 6,
                                message: 'Password must be at least 6 characters',
                            },
                            onChange: (e) => handleChange(e)
                        })}
                        type={passwordVisibility.password ? 'text' : 'password'}
                        className={`block w-full pl-10 pr-10 py-3 bg-gray-50 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Create a password"
                    />
                    <button
                        type="button"
                        onClick={() => setPasswordVisibility(prev => ({ ...prev, password: !prev.password }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        {passwordVisibility.password ? (
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

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        {...formRegister('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: (value) => value === password || 'Passwords do not match',
                            onChange: (e) => handleChange(e)
                        })}
                        type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                        className={`block w-full pl-10 pr-10 py-3 bg-gray-50 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                        placeholder="Confirm your password"
                    />
                    <button
                        type="button"
                        onClick={() => setPasswordVisibility(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        {passwordVisibility.confirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{errors.confirmPassword?.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth (Optional)
                </label>
                <input
                    {...formRegister('dateOfBirth', {
                        onChange: (e) => handleChange(e)
                    })}
                    type="date"
                    className={`block w-full px-3 py-3 bg-gray-50 border ${errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && (
                    <p className="mt-2 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender (Optional)
                </label>
                <select
                    {...formRegister('gender', {
                        onChange: (e) => handleChange(e)
                    })}
                    className={`block w-full px-3 py-3 bg-gray-50 border ${errors.gender ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
                {errors.gender && (
                    <p className="mt-2 text-sm text-red-600">{errors.gender.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father Name (Optional)
                </label>
                <input
                    {...formRegister('fatherName', {
                        onChange: (e) => handleChange(e)
                    })}
                    type="text"
                    className={`block w-full px-3 py-3 bg-gray-50 border ${errors.fatherName ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="Enter father's name"
                />
                {errors.fatherName && (
                    <p className="mt-2 text-sm text-red-600">{errors.fatherName.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNIC (Optional - Unique)
                </label>
                <input
                    {...formRegister('cnic', {
                        pattern: {
                            value: /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/,
                            message: 'CNIC format: XXXXX-XXXXXXX-X',
                        },
                        onChange: (e) => handleChange(e)
                    })}
                    type="text"
                    className={`block w-full px-3 py-3 bg-gray-50 border ${errors.cnic ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    placeholder="XXXXX-XXXXXXX-X"
                    maxLength={15}
                />
                {errors.cnic && (
                    <p className="mt-2 text-sm text-red-600">{errors.cnic.message}</p>
                )}
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address (Optional)
                </label>
                <textarea
                    {...formRegister('address', {
                        onChange: (e) => handleChange(e)
                    })}
                    rows={1}
                    className={`block w-full px-3 py-3 bg-gray-50 border ${errors.address ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none`}
                    placeholder="Enter your address"
                />
                {errors.address && (
                    <p className="mt-2 text-sm text-red-600">{errors.address.message}</p>
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
                    {...formRegister('verificationCode', {
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
                        onChange: (e) => handleChange(e)
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full  max-w-[1000px] bg-white rounded-xl shadow-lg p-8 max-sm:px-2">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Create Account</h2>
                        <div className="flex items-center space-x-2">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                                        s <= step
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}

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
                                    Creating Account...
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            🔒 Secured with HTTP-only cookies
                        </p>
                    </div>
                </div>

                {showCropper && selectedImage && (
                    <GlobalImageCropper
                        image={selectedImage}
                        crop={crop}
                        zoom={zoom}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={handleCropComplete}
                        onConfirm={handleCropConfirm}
                        onCancel={handleCropCancel}
                        title="Crop Profile Picture"
                        aspectRatio={1}
                    />
                )}
            </div>
    );
}


export default RegisterForm;