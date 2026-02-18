import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import callReducer from './slices/callSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        call: callReducer,
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
