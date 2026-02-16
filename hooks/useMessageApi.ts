import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabaseAdmin } from '@/utils/supabase-server';
import { uploadAudio } from '@/utils/supabase';
import { getClientCookies } from '@/utils/cookies';
import { Message } from '@/components/chat/MessageItem';

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

  // Get current user ID from cookies
  const getCurrentUserId = useCallback(() => {
    const cookies = getClientCookies();
    return cookies['user-id'] || localStorage.getItem('webrtc-userId');
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
      });

      currentConversation = response.data;
    }

    if (!currentConversation) {
      throw new Error('Failed to create or find conversation');
    }

    return currentConversation;
  }, []);

  // Send text message
  const sendMessage = useCallback(async (
    content: string,
    selectedUser: string,
    username: string,
    conversations: Conversation[],
    replyingTo?: Message | null
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

      const response = await axios.post('/api/messages', {
        conversationId: currentConversation.id,
        senderId: userId,
        content,
        to: selectedUser,
        from: username,
        replyTo: replyingTo?.id || null
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, [getCurrentUserId, getOrCreateConversation]);

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
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to send voice message');
      throw err;
    }
  }, [getCurrentUserId, getOrCreateConversation]);

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
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to retry message');
      throw err;
    }
  }, [getCurrentUserId, getOrCreateConversation]);

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
