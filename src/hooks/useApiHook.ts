import { useState, useCallback } from 'react';
import { frontendAuth } from '@/utils/frontendAuth';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  loading: boolean;
}

interface UseApiHook {
  getConversations: (userId: string) => Promise<ApiResponse>;
  createConversation: (participantIds: string[]) => Promise<ApiResponse>;
  getMessages: (conversationId: string) => Promise<ApiResponse>;
  sendMessage: (messageData: any) => Promise<ApiResponse>;
  updateMessage: (messageId: string, messageData: any) => Promise<ApiResponse>;
  deleteMessage: (messageId: string) => Promise<ApiResponse>;
  deleteMessageForMe: (messageId: string) => Promise<ApiResponse>;
  deleteConversationMessages: (conversationId: string) => Promise<ApiResponse>;
  markMessagesAsRead: (conversationId: string) => Promise<ApiResponse>;
}

const getAuthHeaders = () => {
  const session = frontendAuth.getSession();
  const token = session?.accessToken || localStorage.getItem('session_token');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const useApiHook = (): UseApiHook => {
  const [loading, setLoading] = useState(false);

  const apiCall = useCallback(async <T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data, loading: false };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred', 
        loading: false 
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const getConversations = useCallback(async (userId: string): Promise<ApiResponse> => {
    return apiCall(`/api/conversations?userId=${userId}`);
  }, [apiCall]);

  const createConversation = useCallback(async (participantIds: string[]): Promise<ApiResponse> => {
    return apiCall('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantIds }),
    });
  }, [apiCall]);

  const getMessages = useCallback(async (conversationId: string): Promise<ApiResponse> => {
    return apiCall(`/api/conversations/${conversationId}/messages`);
  }, [apiCall]);

  const sendMessage = useCallback(async (messageData: any): Promise<ApiResponse> => {
    return apiCall('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }, [apiCall]);

  const updateMessage = useCallback(async (messageId: string, messageData: any): Promise<ApiResponse> => {
    return apiCall('/api/messages', {
      method: 'PUT',
      body: JSON.stringify({ id: messageId, ...messageData }),
    });
  }, [apiCall]);

  const deleteMessage = useCallback(async (messageId: string): Promise<ApiResponse> => {
    return apiCall(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  }, [apiCall]);

  const deleteMessageForMe = useCallback(async (messageId: string): Promise<ApiResponse> => {
    return apiCall('/api/messages/delete-for-me', {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    });
  }, [apiCall]);

  const deleteConversationMessages = useCallback(async (conversationId: string): Promise<ApiResponse> => {
    return apiCall(`/api/conversations/${conversationId}/messages/delete`, {
      method: 'DELETE',
    });
  }, [apiCall]);

  const markMessagesAsRead = useCallback(async (conversationId: string): Promise<ApiResponse> => {
    return apiCall(`/api/conversations/${conversationId}/messages/read`, {
      method: 'POST',
      body: JSON.stringify({ conversationId }),
    });
  }, [apiCall]);

  return {
    getConversations,
    createConversation,
    getMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    deleteMessageForMe,
    deleteConversationMessages,
    markMessagesAsRead,
  };
};
