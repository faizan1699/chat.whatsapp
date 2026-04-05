import { useState, useCallback } from 'react';
import { supabaseAdmin } from '@/utils/supabase-server';
import { uploadAudio } from '@/utils/supabase';
import { getClientCookies } from '@/utils/cookies';
import { Message } from '@/types/message';
import { frontendAuth } from '@/utils/frontendAuth';
import { MESSAGE_APIS } from '@/libs/apis/message.api';

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

  const getAuthHeaders = useCallback(() => {
    const session = frontendAuth.getSession();
    if (!session?.accessToken) {
      throw new Error('No access token found');
    }
    const headers = {
      'Authorization': `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json'
    };
    console.log('✅ Auth headers created successfully');
    return headers;
  }, []);

  const getCurrentUserId = useCallback(() => {
    const session = frontendAuth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }
    
    const cookies = getClientCookies();
    if (cookies['user-id']) {
      return cookies['user-id'];
    }
    
    const oldUserId = localStorage.getItem('webrtc-userId');
    if (oldUserId) {
      return oldUserId;
    }
    
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

  const getOrCreateConversation = useCallback(async (
    conversations: Conversation[],
    selectedUser: string,
    currentUserId: string
  ): Promise<Conversation> => {
    let currentConversation = conversations.find(c =>
      c.participants.some((p: any) => p.user.username === selectedUser)
    );

    if (!currentConversation) {
      const { data: selectedUserData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', selectedUser)
        .maybeSingle();

      if (!selectedUserData) {
        throw new Error('Selected user not found');
      }

      const response = await MESSAGE_APIS.createConversation([currentUserId, selectedUserData.id]);
      currentConversation = response.data;
    }

    if (!currentConversation) {
      throw new Error('Failed to create or find conversation');
    }

    return currentConversation;
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    selectedUser: string,
    username: string,
    conversations: Conversation[],
    replyingTo?: Message | null,
    file?: {
      url: string;
      filename: string;
      size: number;
      type: string;
      isImage: boolean;
      caption?: string;
    }
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

      // If there's a file, upload it first
      let uploadedFile = null;
      if (file) {
        const response = await fetch(file.url);
        const blob = await response.blob();
        const fileName = file.filename || `file-${Date.now()}`;
        const fileObj = new File([blob], fileName, { type: file.type });
        
        const uploadResult = await MESSAGE_APIS.uploadFile(fileObj);
        uploadedFile = {
          ...uploadResult.data,
          caption: file.caption
        };
      }

      const response = await MESSAGE_APIS.sendMessage({
        conversationId: currentConversation.id,
        senderId: userId,
        content,
        to: selectedUser,
        from: username,
        replyTo: replyingTo?.id || null,
        file: uploadedFile
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to send message');
      throw err;
    }
  }, [getCurrentUserId, getOrCreateConversation, getAuthHeaders]);

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

      const fileName = `voice-${Date.now()}-${userId}`;
      const publicUrl = await uploadAudio(audioBlob, fileName, userId);

      const response = await MESSAGE_APIS.uploadVoice(audioBlob, fileName, userId);
      
      const messageResponse = await MESSAGE_APIS.sendMessage({
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
  }, [getCurrentUserId, getOrCreateConversation, getAuthHeaders]);

  const updateMessage = useCallback(async (
    messageId: string,
    content: string
  ): Promise<Message> => {
    setLoading(true);
    setError(null);

    try {
      const response = await MESSAGE_APIS.updateMessage({
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
  }, [getAuthHeaders]);

  const deleteMessage = useCallback(async (
    messageId: string,
    type: 'me' | 'everyone'
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await MESSAGE_APIS.deleteMessage(messageId, type);

      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to delete message');
      throw err;
    }
  }, [getAuthHeaders]);

  const pinMessage = useCallback(async (
    messageId: string,
    isPinned: boolean
  ): Promise<Message> => {
    setLoading(true);
    setError(null);

    try {
      const response = await MESSAGE_APIS.pinMessage(messageId, isPinned);

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to pin message');
      throw err;
    }
  }, [getAuthHeaders]);

  const fetchMessages = useCallback(async (
    conversationId: string
  ): Promise<Message[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await MESSAGE_APIS.getMessages(conversationId);
      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to fetch messages');
      throw err;
    }
  }, [getAuthHeaders]);

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

      const messageResponse = await MESSAGE_APIS.sendMessage({
        conversationId: currentConversation.id,
        senderId: userId,
        content: failedMessage.content || failedMessage.message,
        to: failedMessage.to,
        from: username,
        replyTo: failedMessage.replyTo?.id || null,
        file: failedMessage.file,
        isVoice: failedMessage.isVoiceMessage,
        audioUrl: failedMessage.audioUrl,
        audioDuration: failedMessage.audioDuration,
        isRetry: true,
        originalMessageId: failedMessage.id
      });

      setLoading(false);
      return messageResponse.data;
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
