import api from '../utils/api';

export const apiService = {
    // User APIs
    searchUser: async (query: string) => {
        const response = await api.get(`/users/search?q=${query}`);
        return response.data;
    },

    createUser: async (data: any) => {
        const response = await api.post('/users', data);
        return response.data;
    },

    // Conversation APIs
    getConversations: async (userId: string) => {
        const response = await api.get(`/conversations?userId=${userId}`);
        return response.data;
    },

    createConversation: async (participantIds: string[]) => {
        const response = await api.post('/conversations', { participantIds });
        return response.data;
    },

    // Message APIs
    getMessages: async (conversationId: string) => {
        const response = await api.get(`/conversations/${conversationId}/messages`);
        return response.data;
    },

    sendMessage: async (data: { conversationId: string; senderId: string; content?: string; isVoice?: boolean; audioUrl?: string; audioDuration?: number }) => {
        const response = await api.post('/messages', data);
        return response.data;
    },

    deleteMessage: async (messageId: string) => {
        const response = await api.delete(`/messages/${messageId}`);
        return response.data;
    },

    updateMessageStatus: async (messageId: string, status: string) => {
        const response = await api.patch(`/messages/${messageId}/status`, { status });
        return response.data;
    },
};
