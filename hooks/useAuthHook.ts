import { useState, useCallback } from 'react';
import api from '@/utils/api';
import { frontendAuth } from '@/utils/frontendAuth';
import { hasCookieAcceptance, getCookiePreferences } from '@/utils/cookieConsent';

interface LoginCredentials {
  identifier: string;
  password: string;
  termsAccepted: boolean;
  cookieConsent?: any;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  termsAccepted: boolean;
  cookieConsent?: any;
}

interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string | null;
  fatherName?: string | null;
  address?: string | null;
  cnic?: string | null;
  gender?: string | null;
  hobbies?: Array<{
    id: string;
    name: string;
  }>;
}

interface UserSession {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
}

export const useAuthHook = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Get cookie consent data if available
      const cookieConsent = hasCookieAcceptance() ? getCookiePreferences() : null;

      const response = await api.post('/auth/login', {
        identifier: credentials.identifier,
        password: credentials.password,
        termsAccepted: credentials.termsAccepted,
        cookieConsent: cookieConsent,
      });

      const responseData = response.data;
      const user = responseData?.user;

      if (user?.username && responseData?.accessToken && responseData?.refreshToken) {
        frontendAuth.setSession(
          responseData.accessToken,
          responseData.refreshToken,
          {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phoneNumber || ''
          }
        );

        setLoading(false);
        return responseData;
      } else {
        throw new Error('Invalid login response');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Get cookie consent data if available
      const cookieConsent = hasCookieAcceptance() ? getCookiePreferences() : null;

      const response = await api.post('/auth/register', {
        username: credentials.username,
        email: credentials.email,
        password: credentials.password,
        phone_number: credentials.phoneNumber,
        termsAccepted: credentials.termsAccepted,
        cookieConsent: cookieConsent,
      });

      const responseData = response.data;
      const user = responseData?.user;

      if (user?.username && responseData?.accessToken && responseData?.refreshToken) {
        frontendAuth.setSession(
          responseData.accessToken,
          responseData.refreshToken,
          {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phoneNumber || ''
          }
        );

        setLoading(false);
        return responseData;
      } else {
        throw new Error('Invalid registration response');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getProfile = useCallback(async (): Promise<UserProfile> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/auth/profile');
      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Failed to fetch profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const loginWithProfile = useCallback(async (credentials: LoginCredentials): Promise<{ loginResponse: LoginResponse; profile: UserProfile }> => {
    try {
      const loginResponse = await login(credentials);

      try {
        const profile = await getProfile();
        return { loginResponse, profile };
      } catch (profileError) {
        return { loginResponse, profile: {} as UserProfile };
      }
    } catch (error) {
      throw error;
    }
  }, [login, getProfile]);

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.warn('Logout API call failed:', err);
      }

      frontendAuth.clearSession();
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Logout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateProfile = useCallback(async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.patch('/auth/profile', profileData);
      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getSession = useCallback(async (): Promise<UserSession> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/auth/me');
      setLoading(false);
      return response.data.user;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Failed to get session';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/forgot-password', { email });
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Failed to send reset email';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<{ avatar: string }> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setLoading(false);
      return response.data;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Failed to upload avatar';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    loading,
    error,
    login,
    register,
    getProfile,
    loginWithProfile,
    logout,
    updateProfile,
    getSession,
    forgotPassword,
    resetPassword,
    changePassword,
    uploadAvatar,
    clearError: () => setError(null)
  };
};

export type { LoginCredentials, RegisterCredentials, LoginResponse, UserProfile, UserSession };
