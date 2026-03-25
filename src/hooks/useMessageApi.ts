import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabaseAdmin } from '@/utils/supabase-server';
import { uploadAudio } from '@/utils/supabase';
import { getClientCookies } from '@/utils/cookies';
import { Message } from '@/types/message';
import { frontendAuth } from '@/utils/frontendAuth';
import { validateMessageContent } from '@/lib/messageValidation';

interface Conversation {
  id: string;
  participants: Array<{
    user: {
      id: string;
      username: string;
    };
  }>;
}

export const useMessageApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get authorization header for API calls
  const getAuthHeaders = useCallback(() => {
    console.log('🔐 Getting auth headers...');
    const session = frontendAuth.getSession();
    console.log('📋 Session found:', !!session);
    
    if (!session?.accessToken) {
      console.error('❌ No access token found in session');
      
      // Try to get from cookies as fallback
      const cookies = getClientCookies();
      const accessToken = cookies['access_token'];
      if (accessToken) {
        console.log('✅ Found access token in cookies');
        return {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        };
      }
      
      throw new Error('No access token found. Please log in again.');
    }
    
    const headers = {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json'
    };
    console.log('✅ Auth headers created successfully');
    return headers;
  }, []);

  // Get current user ID from localStorage or cookies
  const getCurrentUserId = useCallback(() => {
    // First try frontendAuth (preferred method)
    const session = frontendAuth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }
    
    // Fallback to cookies
    const cookies = getClientCookies();
    if (cookies['user-id']) {
      return cookies['user-id'];
    }
    
    // Fallback to old localStorage key
    const oldUserId = localStorage.getItem('webrtc-userId');
    if (oldUserId) {
      return oldUserId;
    }
    
    // Final fallback - parse user_data directly
    try {
      const userDataStr = localStorage.getItem('user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData?.id;
      }
    } catch (error) {
      console.error('Error parsing user_data:', error);
    }
    
    return null;
  }, []);

  // Find or create conversation between two users
  const getOrCreateConversation = useCallback(async (
    conversations: Conversation[],
    selectedUser: string,
    currentUserId: string
  ): Promise<Conversation> => {
    let currentConversation = conversations.find(c =>
      c.participants.some((p: any) => p.user.username === selectedUser)
    );

    if (!currentConversation) {
      // Get selected user data
      const { data: selectedUserData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', selectedUser)
        .maybeSingle();

      if (!selectedUserData) {
        throw new Error('Selected user not found');
      }

      // Create conversation
      const response = await axios.post('/api/conversations', {
        participantIds: [currentUserId, selectedUserData.id]
      }, {
        headers: getAuthHeaders()
      });

      currentConversation = response.data;
    }

    if (!currentConversation) {
      throw new Error('Failed to create or find conversation');
    }

    return currentConversation;
  }, [getAuthHeaders]);

  // Send text message
  const sendMessage = useCallback(async (
    content: string,
    selectedUser: string,
    username: string,
    conversations: Conversation[],
    replyingTo?: Message | null
  ): Promise<Message> => {
    console.log('🚀 sendMessage hook called with:', {
      content,
      selectedUser,
      username,
      conversationsCount: conversations.length,
      replyingTo: replyingTo?.id || null
    });
    
    setLoading(true);
    setError(null);

    try {
      const { valid, error } = validateMessageContent(content);
      if (!valid) throw new Error(error ?? 'Invalid message');

      const userId = getCurrentUserId();
      console.log('📋 User ID:', userId);
      if (!userId) {
        console.error('❌ No user ID found - user not authenticated');
        throw new Error('User not authenticated. Please log in again.');
      }

      const currentConversation = await getOrCreateConversation(
        conversations,
        selectedUser,
        userId
      );

      // Try to send message with auth headers
      let response;
      try {
        response = await axios.post('/api/messages', {
          conversationId: currentConversation.id,
          senderId: userId,
          content,
          to: selectedUser,
          from: username,
          replyTo: replyingTo?.id || null
        }, {
          headers: getAuthHeaders()
        });
      } catch (err: any) {
        // If 401, try to refresh session
        if (err.response?.status === 401) {
          console.log('🔄 Session expired, attempting refresh...');
          
          // Try to refresh using frontendAuth
          const refreshSuccess = await frontendAuth.refreshSession();
          if (refreshSuccess) {
            console.log('✅ Session refreshed, retrying message send...');
            response = await axios.post('/api/messages', {
              conversationId: currentConversation.id,
              senderId: userId,
              content,
              to: selectedUser,
              from: username,
              replyTo: replyingTo?.id || null
            }, {
              headers: getAuthHeaders()
            });
          } else {
            console.error('❌ Session refresh failed');
            throw new Error('Session expired. Please log in again.');
          }
        } else {
          throw err;
        }
      }

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to send message';
      setError(errorMessage);
      console.error('❌ Send message error:', errorMessage);
      throw err;
    }
  }, [getCurrentUserId, getOrCreateConversation, getAuthHeaders]);

  // Send voice message
  const sendVoiceMessage = useCallback(async (
    audioBlob: Blob,
    duration: number,
    selectedUser: string,
    username: string,
    conversations: Conversation[]
  ): Promise<Message> => {
    setLoading(true);
    setError(null);

    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const currentConversation = await getOrCreateConversation(
        conversations,
        selectedUser,
        userId
      );

      // Upload audio to Supabase
      const fileName = `voice-${Date.now()}-${userId}`;
      const publicUrl = await uploadAudio(audioBlob, fileName);

      const response = await axios.post('/api/messages', {
        conversationId: currentConversation.id,
        senderId: userId,
        isVoice: true,
        audioUrl: publicUrl,
        audioDuration: duration,
        to: selectedUser,
        from: username
      }, {
        headers: getAuthHeaders()
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to send voice message');
      throw err;
    }
  }, [getCurrentUserId, getOrCreateConversation, getAuthHeaders]);

  // Update message
  const updateMessage = useCallback(async (
    messageId: string,
    content: string
  ): Promise<Message> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.put('/api/messages', {
        messageId,
        content
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to update message');
      throw err;
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (
    messageId: string,
    type: 'me' | 'everyone'
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await axios.delete('/api/messages', {
        data: { messageId, type }
      });

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to delete message');
      throw err;
    }
  }, []);

  // Pin/unpin message
  const pinMessage = useCallback(async (
    messageId: string,
    isPinned: boolean
  ): Promise<Message> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.patch('/api/messages', {
        messageId,
        isPinned
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to pin message');
      throw err;
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (
    conversationId: string
  ): Promise<Message[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/conversations/${conversationId}/messages`);
      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to fetch messages');
      throw err;
    }
  }, []);

  // Retry failed message
  const retryMessage = useCallback(async (
    failedMessage: Message,
    conversations: Conversation[],
    username: string
  ): Promise<Message> => {
    setLoading(true);
    setError(null);

    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const currentConversation = await getOrCreateConversation(
        conversations,
        failedMessage.to,
        userId
      );

      const response = await axios.post('/api/messages', {
        conversationId: currentConversation.id,
        senderId: userId,
        content: failedMessage.message,
        to: failedMessage.to,
        from: username,
        isRetry: true,
        originalMessageId: failedMessage.id
      }, {
        headers: getAuthHeaders()
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to retry message');
      throw err;
    }
  }, [getCurrentUserId, getOrCreateConversation, getAuthHeaders]);

  return {
    loading,
    error,
    sendMessage,
    sendVoiceMessage,
    updateMessage,
    deleteMessage,
    pinMessage,
    fetchMessages,
    retryMessage,
    getOrCreateConversation,
    clearError: () => setError(null)
  };
};

export type { Conversation };
