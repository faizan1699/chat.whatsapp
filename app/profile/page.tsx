'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, Shield } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import api from '@/utils/api';
import EditProfileModal from '@/components/global/EditProfileModal';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    phone: string;
    avatar: string;
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
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
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
                    createdAt: new Date().toISOString(),
                    lastSeen: new Date().toISOString()
                });
            }
            setLoading(false);
        }
    }, [ownProfile]);

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

    if (!viewingProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Profile not found</p>
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
                            <h1 className="text-xl font-semibold text-gray-900">
                                {isOwnProfile ? 'My Profile' : `${viewingProfile.username}'s Profile`}
                            </h1>
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
                                {viewingProfile.avatar ? (
                                    <img
                                        src={viewingProfile.avatar}
                                        alt={viewingProfile.username}
                                        className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                                        <User className="h-16 w-16 text-gray-400" />
                                    </div>
                                )}
                                {isOwnProfile && (
                                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-2 border-white">
                                        <Shield className="h-4 w-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <h2 className="mt-4 text-2xl font-bold text-white">
                                {viewingProfile.username}
                            </h2>
                            {isOwnProfile && (
                                <p className="mt-1 text-green-100">This is your profile</p>
                            )}
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Username */}
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <User className="h-6 w-6 text-gray-600" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500">Username</p>
                                    <p className="text-lg font-medium text-gray-900">{viewingProfile.username}</p>
                                </div>
                            </div>

                            {/* Email */}
                            {viewingProfile.email && (
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="bg-gray-100 rounded-lg p-3">
                                            <Mail className="h-6 w-6 text-gray-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="text-lg font-medium text-gray-900">{viewingProfile.email}</p>
                                    </div>
                                </div>
                            )}

                            {/* Phone */}
                            {viewingProfile.phone && (
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="bg-gray-100 rounded-lg p-3">
                                            <Phone className="h-6 w-6 text-gray-600" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-500">Phone</p>
                                        <p className="text-lg font-medium text-gray-900">{viewingProfile.phone}</p>
                                    </div>
                                </div>
                            )}

                            {/* Member Since */}
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

                            {/* Last Seen */}
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

                        {/* Action Buttons */}
                        <div className="mt-8 pt-8 border-t">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {isOwnProfile ? (
                                    <>
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                                        >
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={() => router.push('/chat')}
                                            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            Back to Chat
                                        </button>
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isOwnProfile && (
                <EditProfileModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleEditProfileSuccess}
                />
            )}
        </div>
    );
}
