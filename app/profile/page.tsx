'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, Shield, Edit2, Save, X, Camera, Tag } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { frontendAuth } from '@/utils/frontendAuth';
import api from '@/utils/api';
import { useImageCropper } from '@/hooks/useImageCropper';
import GlobalImageCropper from '@/components/global/GlobalImageCropper';
import HobbiesSelector from '@/components/global/HobbiesSelector';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    phone: string;
    avatar: string;
    bio: string;
    dateOfBirth?: string;
    fatherName?: string;
    address?: string;
    cnic?: string;
    gender?: string;
    hobbies?: string[];
    createdAt: string;
    lastSeen: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { profile: ownProfile, loading: ownProfileLoading, refreshProfile } = useProfile();
    const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm, setEditForm] = useState({
        username: '',
        phone: '',
        avatar: '',
        bio: '',
        dateOfBirth: '',
        fatherName: '',
        address: '',
        cnic: '',
        gender: '',
        hobbies: [] as string[]
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
        resetCropper
    } = useImageCropper();

    useEffect(() => {
        if (!frontendAuth.isAuthenticated()) {
            router.push('/login');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');
        
        if (username && username !== ownProfile?.username) {
            setIsOwnProfile(false);
            fetchUserProfile(username);
        } else {
            setIsOwnProfile(true);
            if (ownProfile) {
                setViewingProfile({
                    ...ownProfile,
                    bio: ownProfile.bio || '',
                    createdAt: new Date().toISOString(),
                    lastSeen: new Date().toISOString()
                });
                setEditForm({
                    username: ownProfile.username || '',
                    phone: ownProfile.phone || '',
                    avatar: ownProfile.avatar || '',
                    bio: ownProfile.bio || '',
                    dateOfBirth: ownProfile.dateOfBirth || '',
                    fatherName: ownProfile.fatherName || '',
                    address: ownProfile.address || '',
                    cnic: ownProfile.cnic || '',
                    gender: ownProfile.gender || '',
                    hobbies: ownProfile.hobbies || []
                });
            }
            setLoading(false);
        }
    }, [ownProfile, router]);

    useEffect(() => {
        if (croppedImage) {
            setEditForm(prev => ({ ...prev, avatar: croppedImage }));
        }
    }, [croppedImage]);

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset form on cancel
            if (ownProfile) {
                setEditForm({
                    username: ownProfile.username || '',
                    phone: ownProfile.phone || '',
                    avatar: ownProfile.avatar || '',
                    bio: ownProfile.bio || '',
                    dateOfBirth: ownProfile.dateOfBirth || '',
                    fatherName: ownProfile.fatherName || '',
                    address: ownProfile.address || '',
                    cnic: ownProfile.cnic || '',
                    gender: ownProfile.gender || '',
                    hobbies: ownProfile.hobbies || []
                });
            }
            resetCropper();
        }
        setIsEditing(!isEditing);
    };

    const handleSaveProfile = async () => {
        setEditLoading(true);
        try {
            const changedFields: Record<string, any> = {};
            
            if (editForm.username !== ownProfile?.username) {
                changedFields.username = editForm.username;
            }
            if (editForm.phone !== ownProfile?.phone) {
                changedFields.phone = editForm.phone || undefined;
            }
            if (editForm.avatar !== ownProfile?.avatar) {
                changedFields.avatar = editForm.avatar || undefined;
            }
            if (editForm.bio !== ownProfile?.bio) {
                changedFields.bio = editForm.bio || undefined;
            }
            if (editForm.dateOfBirth !== ownProfile?.dateOfBirth) {
                changedFields.dateOfBirth = editForm.dateOfBirth || undefined;
            }
            if (editForm.fatherName !== ownProfile?.fatherName) {
                changedFields.fatherName = editForm.fatherName || undefined;
            }
            if (editForm.address !== ownProfile?.address) {
                changedFields.address = editForm.address || undefined;
            }
            if (editForm.cnic !== ownProfile?.cnic) {
                changedFields.cnic = editForm.cnic || undefined;
            }
            if (editForm.gender !== ownProfile?.gender) {
                changedFields.gender = editForm.gender || undefined;
            }
            if (JSON.stringify(editForm.hobbies) !== JSON.stringify(ownProfile?.hobbies)) {
                changedFields.hobbies = editForm.hobbies;
            }
            
            if (Object.keys(changedFields).length === 0) {
                setIsEditing(false);
                setEditLoading(false);
                return;
            }
            
            const res = await api.patch('/auth/profile', changedFields);
            await refreshProfile();
            setIsEditing(false);
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            alert(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setEditLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const fetchUserProfile = async (username: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/users/${username}`);
            setViewingProfile(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch user profile');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatLastSeen = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return formatDate(dateString);
    };

    const handleEditProfileSuccess = async (newUsername?: string) => {
        await refreshProfile();
        // Update URL if username changed
        if (newUsername && newUsername !== ownProfile?.username) {
            const url = new URL(window.location.href);
            url.searchParams.delete('user');
            window.history.replaceState({}, '', url.toString());
        }
        setIsOwnProfile(true);
    };

    if (loading || ownProfileLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error && !isOwnProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => router.back()}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!viewingProfile && !loading && !ownProfileLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                        <h3 className="text-red-800 font-semibold mb-2">Profile Not Found</h3>
                        <p className="text-red-600 mb-4">
                            {error || 'The profile you are looking for does not exist or you may not have permission to view it.'}
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/chat')}
                                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                            >
                                Go to Chat
                            </button>
                            <button
                                onClick={() => router.back()}
                                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Additional safety check
    if (!viewingProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {isOwnProfile ? 'My Profile' : `${viewingProfile.username}'s Profile`}
                                </h1>
                                {isOwnProfile && isEditing && (
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        Editing Mode
                                    </span>
                                )}
                            </div>
                        </div>
                        {isOwnProfile && (
                            <button
                                onClick={() => router.push('/chat')}
                                className="text-green-600 hover:text-green-700 font-medium"
                            >
                                Back to Chat
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                {editForm.avatar ? (
                                    <img
                                        src={editForm.avatar}
                                        alt={viewingProfile.username}
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                                        <User className="h-16 w-16 text-gray-400" />
                                    </div>
                                )}
                                {isOwnProfile && isEditing && (
                                    <Fragment>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="avatar-upload"
                                        />
                                        <label
                                            htmlFor="avatar-upload"
                                            className="absolute bottom-0 right-0 bg-white rounded-full p-2 border-2 border-white cursor-pointer hover:bg-gray-100"
                                        >
                                            <Camera className="h-4 w-4 text-gray-600" />
                                        </label>
                                    </Fragment>
                                )}
                                {isOwnProfile && !isEditing && (
                                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-2 border-white">
                                        <Shield className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <h2 className="mt-4 text-2xl font-bold text-white">
                                {viewingProfile.username}
                            </h2>
                            {viewingProfile.bio && (
                                <p className="mt-2 text-green-100 text-center max-w-md">
                                    {viewingProfile.bio }
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <User className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Username
                                    </label>
                                    {isOwnProfile && isEditing ? (
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                value={editForm.username}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                                placeholder="Enter your username"
                                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                                                minLength={2}
                                            />
                                            <p className="text-xs text-gray-500">Username must be at least 2 characters</p>
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingProfile.username}</p>
                                    )}
                                </div>
                            </div>

                            {isOwnProfile && isEditing && (
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="bg-gray-100 rounded-lg p-3">
                                            <User className="h-6 w-6 text-gray-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-500 block mb-1">
                                            Bio
                                        </label>
                                        <div className="space-y-1">
                                            <input
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                                placeholder="Tell us about yourself..."
                                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                                                maxLength={50}
                                            />
                                            <p className="text-xs text-gray-500">{editForm.bio.length}/50 characters</p>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-sm font-medium text-gray-500 block mb-1">
                                            Email Address
                                        </label>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 rounded-lg">{viewingProfile.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <Phone className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Phone Number
                                    </label>
                                    {isOwnProfile && isEditing ? (
                                        <div className="space-y-1">
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                placeholder="+1234567890 (optional)"
                                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                                            />
                                            <p className="text-xs text-gray-500">Optional: Enter a unique phone number (min 10 digits)</p>
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                                            {viewingProfile.phone || 'Not provided'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <Calendar className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Date of Birth
                                    </label>
                                    {isOwnProfile && isEditing ? (
                                        <div className="space-y-1">
                                            <input
                                                type="date"
                                                value={editForm.dateOfBirth}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                            <p className="text-xs text-gray-500">Optional: Enter your date of birth</p>
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                                            {viewingProfile.dateOfBirth ? formatDate(viewingProfile.dateOfBirth) : 'Not provided'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <User className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Gender
                                    </label>
                                    {isOwnProfile && isEditing ? (
                                        <div className="space-y-1">
                                            <select
                                                value={editForm.gender}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <p className="text-xs text-gray-500">Optional: Select your gender</p>
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center capitalize">
                                            {viewingProfile.gender || 'Not provided'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <User className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Father Name
                                    </label>
                                    {isOwnProfile && isEditing ? (
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                value={editForm.fatherName}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, fatherName: e.target.value }))}
                                                placeholder="Enter father's name"
                                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                                            />
                                            <p className="text-xs text-gray-500">Optional: Enter father's name</p>
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                                            {viewingProfile.fatherName || 'Not provided'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* CNIC */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <Shield className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        CNIC
                                    </label>
                                    {isOwnProfile && isEditing ? (
                                        <div className="space-y-1">
                                            <input
                                                type="text"
                                                value={editForm.cnic}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, cnic: e.target.value }))}
                                                placeholder="XXXXX-XXXXXXX-X"
                                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                                                maxLength={15}
                                                pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
                                            />
                                            <p className="text-xs text-gray-500">Optional: Format XXXXX-XXXXXXX-X (unique)</p>
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                                            {viewingProfile.cnic || 'Not provided'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <User className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Address
                                    </label>
                                    {isOwnProfile && isEditing ? (
                                        <div className="space-y-1">
                                            <textarea
                                                value={editForm.address}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Enter your address"
                                                rows={3}
                                                className="w-full text-lg font-medium text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors resize-none"
                                            />
                                            <p className="text-xs text-gray-500">Optional: Enter your address</p>
                                        </div>
                                    ) : (
                                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                                            {viewingProfile.address || 'Not provided'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Hobbies */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <Tag className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-500 block mb-1">
                                        Hobbies
                                    </label>
                                    {isOwnProfile && isEditing ? (
                                        <div className="space-y-1">
                                            <HobbiesSelector
                                                selectedHobbies={editForm.hobbies}
                                                onHobbiesChange={(hobbyIds) => setEditForm(prev => ({ ...prev, hobbies: hobbyIds }))}
                                                className="mt-0"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {viewingProfile.hobbies && viewingProfile.hobbies.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {viewingProfile.hobbies.map((hobbyId: string) => {
                                                        // This is a simplified display - in real implementation, you'd fetch hobby names
                                                        return (
                                                            <div
                                                                key={hobbyId}
                                                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                                                            >
                                                                <Tag size={14} />
                                                                <span>Hobby {hobbyId.slice(0, 8)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                                                    No hobbies added
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <Calendar className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                                    <p className="text-lg font-medium text-gray-900">
                                        {formatDate(viewingProfile.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {!isOwnProfile && (
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="bg-gray-100 rounded-lg p-3">
                                            <Clock className="h-6 w-6 text-gray-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-500">Last Seen</p>
                                        <p className="text-lg font-medium text-gray-900">
                                            {formatLastSeen(viewingProfile.lastSeen)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {isOwnProfile ? (
                                    isEditing ? (
                                        <>
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={editLoading}
                                                className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {editLoading ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <Fragment>
                                                        <Save size={16} />
                                                        Save Changes
                                                    </Fragment>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleEditToggle}
                                                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                                            >
                                                <X size={16} />
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <Fragment>
                                            <button
                                                onClick={handleEditToggle}
                                                className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={16} />
                                                Edit Profile
                                            </button>
                                            <button
                                                onClick={() => router.push('/chat')}
                                                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                            >
                                                Back to Chat
                                            </button>
                                        </Fragment>
                                    )
                                ) : (
                                    <Fragment>
                                        <button
                                            onClick={() => router.push(`/chat?user=${viewingProfile.username}`)}
                                            className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                                        >
                                            Send Message
                                        </button>
                                        <button
                                            onClick={() => router.back()}
                                            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            Go Back
                                        </button>
                                    </Fragment>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showCropper && (
                <GlobalImageCropper
                    image={selectedImage || ''}
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
