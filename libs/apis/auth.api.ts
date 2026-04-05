import { postRequest, getRequest, patchRequest, deleteRequest, uploadRequest } from '@/utils/helpers/common/http-methods';
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
  ApiResponseDTO
} from '@/utils/helpers/models/auth.dto';

export const AUTH_APIS = {
  login: (body: LoginDTO): Promise<ApiResponseDTO<LoginResponseDTO>> => 
    postRequest('/api/auth/login', body),

  register: (body: RegisterDTO): Promise<ApiResponseDTO<LoginResponseDTO>> => 
    postRequest('/api/auth/register', body),

  logout: (): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/auth/logout', {}),

  getSession: (): Promise<ApiResponseDTO<{ message: string; user: UserSessionDTO }>> => 
    getRequest('/api/auth/me'),

  getProfile: (): Promise<ApiResponseDTO<UserProfileDTO>> => 
    getRequest('/api/auth/profile'),

  updateProfile: (body: UpdateProfileDTO): Promise<ApiResponseDTO<UserProfileDTO>> => 
    patchRequest('/api/auth/profile', body),

  uploadAvatar: (file: File): Promise<ApiResponseDTO<{ avatar: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return uploadRequest('/api/auth/upload-avatar', formData);
  },

  forgotPassword: (body: ForgotPasswordDTO): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/auth/forgot-password', body),

  resetPassword: (body: ResetPasswordDTO): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/auth/reset-password', body),

  changePassword: (body: ChangePasswordDTO): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/auth/change-password', body),

  verifyEmail: (token: string): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/auth/verify-email', { token }),

  resendVerification: (email: string): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/auth/resend-otp', { email }),

  updateConsent: (consentData: any): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/auth/consent', consentData),

  completeRegistration: (body: any): Promise<ApiResponseDTO<any>> => 
    postRequest('/api/auth/complete-registration', body)
};

export default AUTH_APIS;
