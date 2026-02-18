// Cookie Consent Test - Test file to verify cookie consent toast functionality
// This file can be used to test the cookie consent reminder system

import { authToast } from '@/utils/toast';
import { hasCookieAcceptance } from '@/utils/cookieConsent';

// Test function to verify cookie consent functionality
export const testCookieConsent = () => {
    console.log('🍪 Testing Cookie Consent System');
    console.log('Current cookie acceptance status:', hasCookieAcceptance());
    
    // Test immediate cookie consent toast
    console.log('🔔 Showing cookie consent toast immediately...');
    authToast.cookieConsent();
    
    // Test after 5 seconds (instead of 10 for testing)
    setTimeout(() => {
        console.log('🔔 Showing cookie consent toast after 5 seconds...');
        authToast.cookieConsent();
    }, 5000);
};

// Export for testing in browser console
if (typeof window !== 'undefined') {
    (window as any).testCookieConsent = testCookieConsent;
    console.log('Cookie consent test function available! Run testCookieConsent() in console to test.');
}
