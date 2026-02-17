import { showCustomToast } from '@/components/global/CustomToast';

export const toast = {
  success: (message: string, duration?: number) => {
    showCustomToast({
      message,
      type: 'success',
      duration: duration || 4000,
    });
  },

  error: (message: string, duration?: number) => {
    showCustomToast({
      message,
      type: 'error',
      duration: duration || 5000,
    });
  },

  info: (message: string, duration?: number) => {
    showCustomToast({
      message,
      type: 'info',
      duration: duration || 4000,
    });
  },

  warning: (message: string, duration?: number) => {
    showCustomToast({
      message,
      type: 'warning',
      duration: duration || 4000,
    });
  },

  default: (message: string, duration?: number) => {
    showCustomToast({
      message,
      type: 'default',
      duration: duration || 4000,
    });
  },

  // Custom toast with all options
  custom: (options: {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning' | 'default';
    duration?: number;
    showClose?: boolean;
    icon?: React.ReactNode;
  }) => {
    showCustomToast(options);
  },
};

export const authToast = {
  loginSuccess: (username?: string) => {
    toast.success(`Welcome back${username ? `, ${username}` : ''}!`);
  },

  loginError: (error?: string) => {
    toast.error(error || 'Login failed. Please check your credentials.');
  },

  registerSuccess: () => {
    toast.success('Account created successfully! Please login.');
  },

  registerError: (error?: string) => {
    toast.error(error || 'Registration failed. Please try again.');
  },

  logoutSuccess: () => {
    toast.info('Logged out successfully.');
  },

  sessionExpired: () => {
    toast.warning('Your session has expired. Please login again.');
  },

  passwordResetSuccess: () => {
    toast.success('Password reset link sent to your email.');
  },

  passwordResetError: (error?: string) => {
    toast.error(error || 'Failed to send password reset link.');
  },

  cookieConsent: () => {
    toast.custom({
      message: 'Please accept cookies to continue using all features of our app.',
      type: 'warning',
      duration: 8000,
    });
  },
};

// Chat specific toast messages
export const chatToast = {
  messageSent: () => {
    toast.success('Message sent successfully.');
  },

  messageError: (error?: string) => {
    toast.error(error || 'Failed to send message.');
  },

  messageDeleted: () => {
    toast.info('Message deleted.');
  },

  messageEdited: () => {
    toast.info('Message updated.');
  },

  customMessage: (message: string, sender?: string) => {
    toast.info(`${sender ? `${sender}: ` : ''}${message}`);
  },

  userOnline: (username: string) => {
    toast.info(`${username} is now online.`);
  },

  userOffline: (username: string) => {
    toast.info(`${username} is now offline.`);
  },

  callStarted: (isAudioOnly?: boolean) => {
    toast.success(`${isAudioOnly ? 'Audio' : 'Video'} call started.`);
  },

  callEnded: () => {
    toast.info('Call ended.');
  },

  callMissed: (from: string) => {
    toast.warning(`Missed call from ${from}.`);
  },
};

// General app toast messages
export const appToast = {
  networkError: () => {
    toast.error('Network error. Please check your connection.');
  },

  somethingWentWrong: () => {
    toast.error('Something went wrong. Please try again.');
  },

  success: (action: string) => {
    toast.success(`${action} completed successfully.`);
  },

  error: (action: string) => {
    toast.error(`Failed to ${action}. Please try again.`);
  },

  loading: (message: string) => {
    toast.info(message);
  },

  saved: () => {
    toast.success('Changes saved successfully.');
  },

  deleted: () => {
    toast.info('Item deleted successfully.');
  },
};

export default toast;
