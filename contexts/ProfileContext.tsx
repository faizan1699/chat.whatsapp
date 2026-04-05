'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/utils/api';
import { userStorage } from '@/utils/userStorage';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    phone: string; // Changed from phoneNumber to phone
    avatar: string;
    bio: string;
    dateOfBirth?: string;
    fatherName?: string;
    address?: string;
    cnic?: string;
    gender?: string;
    hobbies?: { id: string, name: string }[];
}

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    updateProfile: (newProfile: UserProfile) => void;
    refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/profile');
            const newProfile = response.data;
            setProfile(newProfile);

            // Update localStorage using global utility
            userStorage.set(newProfile);
        } catch (error: any) {
            console.error('Failed to fetch profile:', error);
            // If auth error, clear session and localStorage
            if (error?.response?.status === 401) {
                userStorage.clear();
                setProfile(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = (newProfile: UserProfile) => {
        setProfile(newProfile);
        userStorage.set(newProfile);
    };

    useEffect(() => {
        const storedProfile = userStorage.get();
        const accessToken = localStorage.getItem('session_token');

        if (storedProfile && accessToken) {
            setProfile({
                ...storedProfile,
                avatar: storedProfile.avatar || '',
                bio: storedProfile.bio || '',
                dateOfBirth: storedProfile.dateOfBirth || '',
                fatherName: storedProfile.fatherName || '',
                address: storedProfile.address || '',
                cnic: storedProfile.cnic || '',
                gender: storedProfile.gender || '',
                hobbies: storedProfile.hobbies || []
            });
            setLoading(false);
        }

        if (accessToken) {
            refreshProfile();
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, loading, updateProfile, refreshProfile }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
