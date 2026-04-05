import { useState, useCallback } from 'react';
import { frontendAuth } from '@/utils/frontendAuth';
import { hasCookieAcceptance, getCookiePreferences } from '@/utils/cookieConsent';
import { AUTH_APIS } from '@/libs/apis/auth.api';
import { successToaster, errorToaster, warningToaster } from '@/utils/helpers/common/toast.utils';
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

export const useAuthHook = () => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (credentials: LoginDTO): Promise<LoginResponseDTO> => {
    setLoading(true);
    setError(null);

    try {
      const cookieConsent = hasCookieAcceptance() ? getCookiePreferences() : null;
      const loginData = { ...credentials, cookieConsent };

      const response = await AUTH_APIS.login(loginData);

      if (response.status && response.user) {
        const loginResponse = response as LoginResponseDTO;
        const user = loginResponse.user;

        frontendAuth.setSession(
          loginResponse.accessToken,
          loginResponse.refreshToken,
          {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone || user.phoneNumber || ''
          }
        );

        successToaster(response.message || 'Login successful!');
        setLoading(false);
        return loginResponse;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Login failed. Check your credentials.';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterDTO): Promise<LoginResponseDTO> => {
    setLoading(true);
    setError(null);

    try {
      const cookieConsent = hasCookieAcceptance() ? getCookiePreferences() : null;
      const registerData = { ...credentials, cookieConsent };

      const response = await AUTH_APIS.register(registerData);

      if (response.status && response.user) {
        const registerResponse = response as LoginResponseDTO;
        const user = registerResponse.user;

        frontendAuth.setSession(
          registerResponse.accessToken,
          registerResponse.refreshToken,
          {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone || user.phoneNumber || ''
          }
        );

        successToaster(response.message || 'Registration successful!');
        setLoading(false);
        return registerResponse;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getProfile = useCallback(async (): Promise<UserProfileDTO> => {
    setLoading(true);
    setError(null);

    try {
      const response = await AUTH_APIS.getProfile();

      if (response.status) {
        setLoading(false);
        return response as UserProfileDTO;
      } else {
        throw new Error(response.error || 'Failed to fetch profile');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Failed to fetch profile';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const loginWithProfile = useCallback(async (credentials: LoginDTO): Promise<{ loginResponse: LoginResponseDTO; profile: UserProfileDTO }> => {
    try {
      const loginResponse = await login(credentials);
            try {
        const profile = await getProfile();
        return { loginResponse, profile };
      } catch (profileError) {
        console.warn('Profile fetch failed after login:', profileError);
        warningToaster('Login successful, but profile data could not be loaded');
        return { loginResponse, profile: {} as UserProfileDTO };
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
        await AUTH_APIS.logout();
      } catch (err) {
        console.warn('Logout API call failed:', err);
      }

      frontendAuth.clearSession();
      successToaster('Logged out successfully');
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Logout failed';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData: UpdateProfileDTO): Promise<UserProfileDTO> => {
    setLoading(true);
    setError(null);

    try {
      const response = await AUTH_APIS.updateProfile(profileData);

      if (response.status) {
        successToaster('Profile updated successfully!');
        setLoading(false);
        return response as UserProfileDTO;
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Failed to update profile';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get session function
  const getSession = useCallback(async (): Promise<UserSessionDTO> => {
    setLoading(true);
    setError(null);

    try {
      const response = await AUTH_APIS.getSession();

      if (response.status && response.user) {
        setLoading(false);
        return response.user;
      } else {
        throw new Error(response.error || 'Failed to get session');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Failed to get session';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Forgot password function
  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const forgotPasswordDTO = new ForgotPasswordDTO({ email });
      const response = await AUTH_APIS.forgotPassword(forgotPasswordDTO);

      if (response.status) {
        successToaster(response.message || 'Password reset email sent!');
        setLoading(false);
      } else {
        throw new Error(response.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Failed to send reset email';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const resetPasswordDTO = new ResetPasswordDTO({ token, newPassword });
      const response = await AUTH_APIS.resetPassword(resetPasswordDTO);

      if (response.status) {
        successToaster(response.message || 'Password reset successfully!');
        setLoading(false);
      } else {
        throw new Error(response.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Failed to reset password';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const changePasswordDTO = new ChangePasswordDTO({ currentPassword, newPassword });
      const response = await AUTH_APIS.changePassword(changePasswordDTO);

      if (response.status) {
        successToaster(response.message || 'Password changed successfully!');
        setLoading(false);
      } else {
        throw new Error(response.error || 'Failed to change password');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Failed to change password';
      setError(errorMessage);
      errorToaster(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Upload avatar function
  const uploadAvatar = useCallback(async (file: File): Promise<{ avatar: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await AUTH_APIS.uploadAvatar(file);

      if (response.status) {
        successToaster('Avatar uploaded successfully!');
        setLoading(false);
        return response as { avatar: string };
      } else {
        throw new Error(response.error || 'Failed to upload avatar');
      }
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.error || err.message || 'Failed to upload avatar';
      setError(errorMessage);
      errorToaster(errorMessage);
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
    clearError
  };
};

export type { LoginDTO, RegisterDTO, LoginResponseDTO, UserProfileDTO, UserSessionDTO };
