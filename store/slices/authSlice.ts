import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
    phone?: string;
    isOnline?: boolean;
    lastSeen?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.error = null;
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearAuth: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.error = null;
        },
        setOnlineStatus: (state, action: PayloadAction<boolean>) => {
            if (state.user) {
                state.user.isOnline = action.payload;
            }
        },
        setLastSeen: (state, action: PayloadAction<string>) => {
            if (state.user) {
                state.user.lastSeen = action.payload;
            }
        },
    },
});

export const { 
    setUser, 
    updateUser, 
    setLoading, 
    setError, 
    clearAuth, 
    setOnlineStatus, 
    setLastSeen 
} = authSlice.actions;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectUsername = (state: { auth: AuthState }) => state.auth.user?.username;
export const selectUserId = (state: { auth: AuthState }) => state.auth.user?.id;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;
