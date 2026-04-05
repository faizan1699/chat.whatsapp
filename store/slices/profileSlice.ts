import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/api';
import { userStorage } from '@/utils/userStorage';

export interface UserProfile {
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
    hobbies?: { id: string, name: string }[];
}

export interface ProfileState {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
}

const initialState: ProfileState = {
    profile: null,
    loading: true,
    error: null,
};

// Async thunks
export const refreshProfile = createAsyncThunk(
    'profile/refreshProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/auth/profile');
            const newProfile = response.data;
            userStorage.set(newProfile);
            return newProfile;
        } catch (error: any) {
            if (error?.response?.status === 401) {
                userStorage.clear();
            }
            return rejectWithValue(error.response?.data?.error || 'Failed to refresh profile');
        }
    }
);

export const updateProfile = createAsyncThunk(
    'profile/updateProfile',
    async (newProfile: UserProfile, { rejectWithValue }) => {
        try {
            userStorage.set(newProfile);
            return newProfile;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
        }
    }
);

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        setProfile: (state, action: PayloadAction<UserProfile>) => {
            state.profile = action.payload;
        },
        clearProfile: (state) => {
            state.profile = null;
        },
        initializeProfile: (state) => {
            const storedProfile = userStorage.get();
            const accessToken = localStorage.getItem('session_token');
            
            if (storedProfile && accessToken) {
                state.profile = {
                    ...storedProfile,
                    avatar: storedProfile.avatar || '',
                    bio: storedProfile.bio || '',
                    dateOfBirth: storedProfile.dateOfBirth || '',
                    fatherName: storedProfile.fatherName || '',
                    address: storedProfile.address || '',
                    cnic: storedProfile.cnic || '',
                    gender: storedProfile.gender || '',
                    hobbies: storedProfile.hobbies || []
                };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(refreshProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(refreshProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
                state.error = null;
            })
            .addCase(refreshProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.profile = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.profile = action.payload;
            });
    },
});

export const { setProfile, clearProfile, initializeProfile } = profileSlice.actions;
export default profileSlice.reducer;
