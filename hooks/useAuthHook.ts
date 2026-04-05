import { useState, useCallback } from 'react';
import api from '@/utils/api';
import { frontendAuth } from '@/utils/frontendAuth';
import { hasCookieAcceptance, getCookiePreferences } from '@/utils/cookieConsent';
import AUTH_APIS from '@/libs/apis/auth.api';
import { useRouter } from 'next/navigation';
import { userStorage } from '@/utils/userStorage';

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

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const getProfile = useCallback(async (): Promise<UserProfile> => {
    setLoading(true);
   

    try {
      const response = await AUTH_APIS.getProfile();
      setLoading(false);
      return response as UserProfile;
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.error || 'Failed to fetch profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {

    setLoading(true);

    try {
      const cookieConsent = hasCookieAcceptance() ? getCookiePreferences() : null;

      const params = {
        identifier: credentials.identifier,
        password: credentials.password,
        termsAccepted: credentials.termsAccepted,
        cookieConsent: cookieConsent,
      }
      const response = await AUTH_APIS.login(params);

      if (response.status) {
        const user = response?.user || {};
        frontendAuth.setSession(
          response.accessToken,
          response.refreshToken,
          {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone || ''
          }
        );

        try {
          const profileData = await getProfile();
          console.log(profileData)
          userStorage.set({
            ...profileData,
            dateOfBirth: profileData.dateOfBirth || undefined,
            fatherName: profileData.fatherName || undefined,
            address: profileData.address || undefined,
            cnic: profileData.cnic || undefined,
            gender: profileData.gender || undefined
          });
        } catch (profileError) {
          console.warn('Failed to fetch complete profile, using basic user data:', profileError);
        }

        router.push('/chat');
        setLoading(false);
      }

    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Login failed. Check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [getProfile]);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<void> => {
    setLoading(true);
   
    try {

      const cookieConsent = hasCookieAcceptance() ? getCookiePreferences() : null;
      const response = await AUTH_APIS.register({ ...credentials, cookieConsent });

      const responseData = response?.data;
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

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
   

    try {
      try {
        await AUTH_APIS.logout();
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
   

    try {
      const response = await AUTH_APIS.updateProfile(profileData);
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
   

    try {
      const response = await AUTH_APIS.getSession();
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
   

    try {
      await AUTH_APIS.forgotPassword({ email });
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
   

    try {
      await AUTH_APIS.resetPassword({ token, newPassword });
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
   

    try {
      await AUTH_APIS.changePassword({ currentPassword, newPassword });
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
   

    try {
      const response = await AUTH_APIS.uploadAvatar(file);
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
