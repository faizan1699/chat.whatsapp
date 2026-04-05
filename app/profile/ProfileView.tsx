'use client';

import React from 'react';
import { User, Mail, Phone, Calendar, Shield, Tag, Edit2 } from 'lucide-react';
import { useProfile } from '@/hooks/useReduxProfile';
import { UserProfileDTO } from '@/utils/helpers/models/auth.dto';

interface ProfileViewProps {
    isOwnProfile?: boolean;
    onEditClick?: () => void;
    viewingProfile?: UserProfileDTO;
}

const ProfileView = ({ isOwnProfile, onEditClick, viewingProfile: propViewingProfile }: ProfileViewProps) => {
    const { profile: ownProfile, loading } = useProfile();

    const viewingProfile = propViewingProfile || ownProfile;

    if ((loading && !propViewingProfile) || !viewingProfile) {
        return (
            <div className="space-y-6">
                <div className="text-center py-8">
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-8">
                <div className="flex justify-center">
                    <div className="relative">
                        {viewingProfile.avatar ? (
                            <img
                                src={viewingProfile.avatar}
                                alt={viewingProfile.username}
                                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                            />
                        ) : (
                            <div className="rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                                <User className="h-32 w-32 text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-center text-center">
                    <h2 className="text-2xl font-bold text-white">
                        {viewingProfile.username}
                    </h2>
                    {viewingProfile.bio && (
                        <p className="mt-2 text-green-100 text-center max-w-md">
                            {viewingProfile.bio}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{viewingProfile.username}</p>
                    </div>
                </div>

                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="bg-gray-100 rounded-lg p-3">
                            <Mail className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-500 block mb-1">
                            Email Address
                        </label>
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 rounded-lg">{viewingProfile.email}</p>
                    </div>
                </div>

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
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                            {viewingProfile.phone || 'Not provided'}
                        </p>
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
                            Bio
                        </label>
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                            {viewingProfile.bio || 'Not provided'}
                        </p>
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
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                            {viewingProfile.dateOfBirth ? formatDate(viewingProfile.dateOfBirth || '') : 'Not provided'}
                        </p>
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
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center capitalize">
                            {viewingProfile.gender || 'Not provided'}
                        </p>
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
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                            {viewingProfile.fatherName || 'Not provided'}
                        </p>
                    </div>
                </div>

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
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                            {viewingProfile.cnic || 'Not provided'}
                        </p>
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
                        <p className="text-lg font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[44px] flex items-center">
                            {viewingProfile.address || 'Not provided'}
                        </p>
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
                            {formatDate(viewingProfile.dateOfBirth || "")}
                        </p>
                    </div>
                </div>
                
            </div>

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
                    <div className="space-y-2">
                        {(viewingProfile.hobbies?.length ?? 0) > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {viewingProfile.hobbies?.map((hobby: any) => {
                                    const hobbyName = typeof hobby === 'object' ? hobby.name : `Hobby ${hobby.slice(0, 8)}`;
                                    const hobbyId = typeof hobby === 'object' ? hobby.id : hobby;
                                    return (
                                        <div
                                            key={hobbyId}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                                        >
                                            <Tag size={14} />
                                            <span>{hobbyName}</span>
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
                </div>
            </div>


            {isOwnProfile && (
                <div className="flex justify-center items-center pt-4 w-full">
                    <button
                        onClick={onEditClick}
                        className="flex justify-center items-center gap-2 w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                        <Edit2 size={16} />
                        Edit Profile
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProfileView;