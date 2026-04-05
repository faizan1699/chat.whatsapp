import { postRequest, getRequest, patchRequest, deleteRequest, uploadRequest, putRequest } from '@/utils/helpers/common/http-methods';
import { ApiResponseDTO } from '@/utils/helpers/models/auth.dto';

export const MESSAGE_APIS = {
  getConversations: (): Promise<ApiResponseDTO<any[]>> => 
    getRequest('/api/conversations'),

  createConversation: (participantIds: string[]): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/conversations', { participantIds }),

  getMessages: (conversationId: string): Promise<ApiResponseDTO<any[]>> => 
    getRequest(`/api/conversations/${conversationId}/messages`),

  sendMessage: (messageData: any): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/messages', messageData),

  updateMessage: (messageData: any): Promise<ApiResponseDTO<any>> => 
    putRequest('/api/messages', messageData),

  deleteMessage: (messageId: string, type: 'me' | 'everyone'): Promise<ApiResponseDTO<any>> => 
    deleteRequest('/api/messages', { messageId, type }),

  pinMessage: (messageId: string, isPinned: boolean): Promise<ApiResponseDTO<any>> => 
    patchRequest('/api/messages', { messageId, isPinned }),

  uploadFile: (file: File): Promise<ApiResponseDTO<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadRequest('/api/upload/file', formData);
  },

  uploadVoice: (audioBlob: Blob, fileName: string, userId: string): Promise<ApiResponseDTO<any>> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, fileName);
    formData.append('userId', userId);
    return uploadRequest('/api/upload/voice', formData);
  }
};

export default MESSAGE_APIS;
