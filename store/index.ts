import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import callReducer from './slices/callSlice';
import profileReducer, { ProfileState } from './slices/profileSlice';

export interface RootState {
    auth: ReturnType<typeof authReducer>;
    chat: ReturnType<typeof chatReducer>;
    call: ReturnType<typeof callReducer>;
    profile: ProfileState;
}

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        call: callReducer,
        profile: profileReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore non-serializable objects like MediaStream and Socket if we put them in state
                ignoredActions: ['call/setLocalStream', 'call/setRemoteStream'],
                ignoredPaths: ['call.localStream', 'call.remoteStream'],
            },
        }),
});

export type AppDispatch = typeof store.dispatch;
