'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/utils/api';

interface UserProfile {
    id: string;
    username: string;
    email: string;
    phone: string;
    avatar: string;
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
            
            // Update localStorage
            localStorage.setItem('user_data', JSON.stringify({
                id: newProfile.id,
                username: newProfile.username,
                email: newProfile.email,
                phone: newProfile.phone || ''
            }));
        } catch (error: any) {
            console.error('Failed to fetch profile:', error);
            // If auth error, clear session and localStorage
            if (error?.response?.status === 401) {
                localStorage.clear();
                setProfile(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = (newProfile: UserProfile) => {
        setProfile(newProfile);
        
        // Update localStorage
        localStorage.setItem('user_data', JSON.stringify({
            id: newProfile.id,
            username: newProfile.username,
            email: newProfile.email,
            phone: newProfile.phone || ''
        }));
    };

    useEffect(() => {
        // Load profile from localStorage first
        const storedProfile = localStorage.getItem('user_data');
        const accessToken = localStorage.getItem('session_token');
        
        if (storedProfile && accessToken) {
            const parsedProfile = JSON.parse(storedProfile);
            // Get avatar from localStorage or set empty
            setProfile({
                ...parsedProfile,
                avatar: parsedProfile.avatar || ''
            });
            setLoading(false);
        }
        
        // Then refresh from server if we have a token
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
