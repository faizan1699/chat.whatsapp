import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CallState {
    isCallActive: boolean;
    isAudioOnly: boolean;
    incomingCall: any | null;
    callParticipant: string | null;
    connectionState: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
}

const initialState: CallState = {
    isCallActive: false,
    isAudioOnly: false,
    incomingCall: null,
    callParticipant: null,
    connectionState: 'idle',
    localStream: null,
    remoteStream: null,
};

const callSlice = createSlice({
    name: 'call',
    initialState,
    reducers: {
        setCallActive: (state, action: PayloadAction<boolean>) => {
            state.isCallActive = action.payload;
        },
        setIsAudioOnly: (state, action: PayloadAction<boolean>) => {
            state.isAudioOnly = action.payload;
        },
        setIncomingCall: (state, action: PayloadAction<any | null>) => {
            state.incomingCall = action.payload;
        },
        setCallParticipant: (state, action: PayloadAction<string | null>) => {
            state.callParticipant = action.payload;
        },
        setConnectionState: (state, action: PayloadAction<CallState['connectionState']>) => {
            state.connectionState = action.payload;
        },
        setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
            // NOTE: Storing MediaStream in Redux is generally discouraged because it's non-serializable.
            // However, for simpler global access in this specific app, we might use it or keep it in a ref.
            // If we want to be strictly Redux-compliant, we should keep streams in a context or custom hook.
            // But for the user's request to "use redux for global state", we'll put serializable flags here and
            // maybe keep actual stream objects in a stable place.
            // For now, let's keep it here but acknowledge the serializability issue.
            (state as any).localStream = action.payload;
        },
        setRemoteStream: (state, action: PayloadAction<MediaStream | null>) => {
            (state as any).remoteStream = action.payload;
        },
        resetCall: (state) => {
            state.isCallActive = false;
            state.incomingCall = null;
            state.callParticipant = null;
            state.connectionState = 'idle';
            state.localStream = null;
            state.remoteStream = null;
        }
    },
});

export const {
    setCallActive,
    setIsAudioOnly,
    setIncomingCall,
    setCallParticipant,
    setConnectionState,
    setLocalStream,
    setRemoteStream,
    resetCall
} = callSlice.actions;
export default callSlice.reducer;
