import toast from 'react-hot-toast';

export interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const successToaster = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    duration: options?.duration || 3000,
    position: options?.position || 'top-right',
  });
};

export const errorToaster = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    duration: options?.duration || 5000,
    position: options?.position || 'top-right',
  });
};

export const warningToaster = (message: string, options?: ToastOptions) => {
  return toast(message, {
    icon: '⚠️',
    duration: options?.duration || 4000,
    position: options?.position || 'top-right',
  });
};

export const infoToaster = (message: string, options?: ToastOptions) => {
  return toast(message, {
    icon: 'ℹ️',
    duration: options?.duration || 3000,
    position: options?.position || 'top-right',
  });
};

export const loadingToaster = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    position: options?.position || 'top-right',
  });
};

export const dismissAllToasts = () => {
  toast.dismiss();
};

export default {
  success: successToaster,
  error: errorToaster,
  warning: warningToaster,
  info: infoToaster,
  loading: loadingToaster,
  dismiss: dismissAllToasts
};
