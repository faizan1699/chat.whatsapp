'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, Shield, Edit2, Save, X, Camera, Tag } from 'lucide-react';
import { useProfile } from '@/hooks/useReduxProfile';
import { frontendAuth } from '@/utils/frontendAuth';
import { useImageCropper } from '@/hooks/useImageCropper';
import GlobalImageCropper from '@/components/global/GlobalImageCropper';
import { UserProfileDTO } from '@/utils/helpers/models/auth.dto';
import { apiService } from '@/services/apiService';
import { userStorage } from '@/utils/userStorage';
import { useForm } from 'react-hook-form';
import ProfileView from './ProfileView';
import ProfileEditForm from './ProfileEditForm';
import { useAppDispatch } from '@/hooks/useReduxProfile';
import { initializeProfile } from '@/store/slices/profileSlice';

export default function ProfilePage() {

    const router = useRouter();
    const urlParams = useSearchParams();
    const username = urlParams?.get('user') || '';

    const dispatch = useAppDispatch();

    const {
        profile: profileData,
        loading: isProofileLoading,
    } = useProfile();

    useEffect(() => {
        dispatch(initializeProfile());
    }, [dispatch]);

    const [viewingProfile, setViewingProfile] = useState<UserProfileDTO>(new UserProfileDTO());
    const [error, setError] = useState<string | null>(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!frontendAuth.isAuthenticated()) {
            router.push('/login');
            return;
        }

        const storedProfile = userStorage.get();
        
        if (username && username !== profileData?.username) {
            // Fetch other user's profile
            fetchUserProfile(username);
        } else {
            // Use own profile
            if (profileData) {
                setViewingProfile(profileData);
                setError(null);
            } else if (storedProfile) {
                setViewingProfile(storedProfile);
            }
        }
    }, [profileData, username, router]);

    const fetchUserProfile = async (username: string) => {
        try {
            const response = await apiService.getUserProfile(username);
            setViewingProfile(response);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch user profile');
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleBackToChat = () => {
        router.push(`/chat`);
    };

    useEffect(() => {
        setIsOwnProfile(username === profileData?.username);
    }, [username, profileData?.username]);

    if (error && !isOwnProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => router.push("/chat")}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBackToChat}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {isOwnProfile ? 'My Profile' : `${username}'s Profile`}
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

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-8">
                        {isEditing ? (
                            <ProfileEditForm
                                setIsEditing={setIsEditing}
                            />
                        ) : (
                            <ProfileView
                                isOwnProfile={isOwnProfile}
                                onEditClick={handleEditToggle}
                                viewingProfile={viewingProfile}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
