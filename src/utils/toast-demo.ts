// Toast Demo - Test file to verify all toast functions work correctly
// This file can be used to test all toast notifications

import { toast, authToast, chatToast, appToast } from '@/utils/toast';

// Test all toast types
export const testToasts = () => {
    // Basic toast types
    toast.success('This is a success message!');
    toast.error('This is an error message!');
    toast.info('This is an info message!');
    toast.warning('This is a warning message!');
    toast.default('This is a default message!');

    // Auth toasts
    setTimeout(() => authToast.loginSuccess('testuser'), 1000);
    setTimeout(() => authToast.loginError('Invalid credentials'), 2000);
    setTimeout(() => authToast.registerSuccess(), 3000);
    setTimeout(() => authToast.registerError('Email Not Available'), 4000);
    setTimeout(() => authToast.logoutSuccess(), 5000);
    setTimeout(() => authToast.sessionExpired(), 6000);

    // Chat toasts
    setTimeout(() => chatToast.messageSent(), 7000);
    setTimeout(() => chatToast.messageError('Network error'), 8000);
    setTimeout(() => chatToast.messageDeleted(), 9000);
    setTimeout(() => chatToast.messageEdited(), 10000);
    setTimeout(() => chatToast.userOnline('John'), 11000);
    setTimeout(() => chatToast.userOffline('Jane'), 12000);
    setTimeout(() => chatToast.callStarted(false), 13000);
    setTimeout(() => chatToast.callStarted(true), 14000);
    setTimeout(() => chatToast.callEnded(), 15000);
    setTimeout(() => chatToast.callMissed('Alice'), 16000);

    // App toasts
    setTimeout(() => appToast.networkError(), 17000);
    setTimeout(() => appToast.somethingWentWrong(), 18000);
    setTimeout(() => appToast.success('Profile updated'), 19000);
    setTimeout(() => appToast.error('upload file'), 20000);
    setTimeout(() => appToast.saved(), 21000);
    setTimeout(() => appToast.deleted(), 22000);
};

// Export for testing in browser console
if (typeof window !== 'undefined') {
    (window as any).testToasts = testToasts;
    console.log('Toast test function available! Run testToasts() in console to test all notifications.');
}
