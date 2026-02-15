import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
    id: string;
    from: string;
    to: string;
    message: string;
    timestamp: string | Date;
    status: 'pending' | 'sent' | 'delivered' | 'read';
    isVoiceMessage?: boolean;
    audioUrl?: string;
    audioDuration?: number;
    isDeleted?: boolean;
    isEdited?: boolean;
    isPinned?: boolean;
}

interface Conversation {
    id: string;
    participants: any[];
    messages: Message[];
}

interface ChatState {
    conversations: Conversation[];
    activeConversationId: string | null;
    selectedUsername: string | null;
    messages: Message[];
    unreadCounts: Record<string, number>;
}

const initialState: ChatState = {
    conversations: [],
    activeConversationId: null,
    selectedUsername: null,
    messages: [],
    unreadCounts: {},
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload;
        },
        setActiveConversation: (state, action: PayloadAction<string | null>) => {
            state.activeConversationId = action.payload;
        },
        setSelectedUsername: (state, action: PayloadAction<string | null>) => {
            state.selectedUsername = action.payload;
        },
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload);
        },
        updateMessageStatus: (state, action: PayloadAction<{ id: string; status: Message['status'] }>) => {
            const msg = state.messages.find(m => m.id === action.payload.id);
            if (msg) msg.status = action.payload.status;
        },
        deleteMessageLocal: (state, action: PayloadAction<string>) => {
            const msg = state.messages.find(m => m.id === action.payload);
            if (msg) {
                msg.isDeleted = true;
                msg.message = '';
                msg.audioUrl = undefined;
            }
        },
        setUnreadCount: (state, action: PayloadAction<{ username: string; count: number }>) => {
            state.unreadCounts[action.payload.username] = action.payload.count;
        },
    },
});

export const {
    setConversations,
    setActiveConversation,
    setSelectedUsername,
    setMessages,
    addMessage,
    updateMessageStatus,
    deleteMessageLocal,
    setUnreadCount
} = chatSlice.actions;
export default chatSlice.reducer;
export type { Message, Conversation };
