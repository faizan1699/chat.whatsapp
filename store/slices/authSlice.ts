import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    userId: string | null;
    username: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    userId: null,
    username: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuth: (state, action: PayloadAction<{ userId: string; username: string }>) => {
            state.userId = action.payload.userId;
            state.username = action.payload.username;
            state.isAuthenticated = true;
        },
        clearAuth: (state) => {
            state.userId = null;
            state.username = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
