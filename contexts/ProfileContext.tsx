'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/utils/api';

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
    hobbies?: string[];
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
                phone: newProfile.phone || '',
                bio: newProfile.bio || '',
                dateOfBirth: newProfile.dateOfBirth || '',
                fatherName: newProfile.fatherName || '',
                address: newProfile.address || '',
                cnic: newProfile.cnic || '',
                gender: newProfile.gender || '',
                hobbies: newProfile.hobbies || []
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
            phone: newProfile.phone || '',
            bio: newProfile.bio || '',
            dateOfBirth: newProfile.dateOfBirth || '',
            fatherName: newProfile.fatherName || '',
            address: newProfile.address || '',
            cnic: newProfile.cnic || '',
            gender: newProfile.gender || '',
            hobbies: newProfile.hobbies || []
        }));
    };

    useEffect(() => {
        // Load profile from localStorage first
        const storedProfile = localStorage.getItem('user_data');
        const accessToken = localStorage.getItem('session_token');
        
        if (storedProfile && accessToken) {
            const parsedProfile = JSON.parse(storedProfile);
            // Get avatar and bio from localStorage or set empty
            setProfile({
                ...parsedProfile,
                avatar: parsedProfile.avatar || '',
                bio: parsedProfile.bio || '',
                dateOfBirth: parsedProfile.dateOfBirth || '',
                fatherName: parsedProfile.fatherName || '',
                address: parsedProfile.address || '',
                cnic: parsedProfile.cnic || '',
                gender: parsedProfile.gender || '',
                hobbies: parsedProfile.hobbies || []
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
