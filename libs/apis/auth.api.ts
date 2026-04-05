import { postRequest, getRequest, patchRequest, deleteRequest, uploadRequest, putRequest } from '@/utils/helpers/common/http-methods';
import {
  LoginDTO,
  RegisterDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  UserProfileDTO,
  UpdateProfileDTO,
  LoginResponseDTO,
  UserSessionDTO,
  FileUploadDTO,
  ApiResponseDTO
} from '@/utils/helpers/models/auth.dto';

export const AUTH_APIS = {

  login: (body: LoginDTO): Promise<ApiResponseDTO<LoginResponseDTO>> => 
    postRequest('/pages/api/auth/login', body),

  register: (body: RegisterDTO): Promise<ApiResponseDTO<LoginResponseDTO>> => 
    postRequest('/pages/api/auth/register', body),

  logout: (): Promise<ApiResponseDTO<any>> => 
    postRequest('/pages/api/auth/logout', {}),

  getSession: (): Promise<ApiResponseDTO<{ message: string; user: UserSessionDTO }>> => 
    getRequest('/pages/api/auth/me'),

  getProfile: (): Promise<ApiResponseDTO<UserProfileDTO>> => 
    getRequest('/pages/api/auth/profile'),

  updateProfile: (body: UpdateProfileDTO): Promise<ApiResponseDTO<UserProfileDTO>> => 
    patchRequest('/pages/api/auth/profile', body),

  uploadAvatar: (file: File): Promise<ApiResponseDTO<{ avatar: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return uploadRequest('/pages/api/auth/upload-avatar', formData);
  },

  forgotPassword: (body: ForgotPasswordDTO): Promise<ApiResponseDTO<any>> => 
    postRequest('/pages/api/auth/forgot-password', body),

  resetPassword: (body: ResetPasswordDTO): Promise<ApiResponseDTO<any>> => 
    postRequest('/pages/api/auth/reset-password', body),

  changePassword: (body: ChangePasswordDTO): Promise<ApiResponseDTO<any>> => 
    postRequest('/pages/api/auth/change-password', body),

  verifyEmail: (token: string): Promise<ApiResponseDTO<any>> => 
    postRequest('/pages/api/auth/verify-email', { token }),

  resendVerification: (email: string): Promise<ApiResponseDTO<any>> => 
    postRequest('/pages/api/auth/resend-otp', { email }),

  updateConsent: (consentData: any): Promise<ApiResponseDTO<any>> => 
    postRequest('/pages/api/auth/consent', consentData),

  completeRegistration: (body: any): Promise<ApiResponseDTO<any>> => 
    postRequest('/pages/api/auth/complete-registration', body)
};

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

export const USER_APIS = {
  searchUsers: (query: string): Promise<ApiResponseDTO<any[]>> => 
    getRequest(`/api/users/search?q=${query}`),

  getUserProfile: (userId: string): Promise<ApiResponseDTO<any>> => 
    getRequest(`/api/users/${userId}/profile`),

  getHobbies: (): Promise<ApiResponseDTO<any[]>> => 
    getRequest('/api/hobbies'),

  getUserHobbies: (userId: string): Promise<ApiResponseDTO<any[]>> => 
    getRequest(`/api/users/${userId}/hobbies`),

  updateUserHobbies: (hobbies: string[]): Promise<ApiResponseDTO<any>> => 
    patchRequest('/api/users/hobbies', { hobbies })
};

export const NOTIFICATION_APIS = {
  getNotifications: (): Promise<ApiResponseDTO<any[]>> => 
    getRequest('/api/notifications'),

  markNotificationRead: (notificationId: string): Promise<ApiResponseDTO<any>> => 
    patchRequest(`/api/notifications/${notificationId}/read`),

  deleteNotification: (notificationId: string): Promise<ApiResponseDTO<any>> => 
    deleteRequest(`/api/notifications/${notificationId}`)
};

export default AUTH_APIS;
