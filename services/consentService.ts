import { hasCookieAcceptance, getCookiePreferences } from '@/utils/cookieConsent';
import { frontendAuth } from '@/utils/frontendAuth';

export interface ConsentData {
  termsAccepted?: boolean;
  cookieConsent?: any;
}

export const syncConsentToDatabase = async (consentData: ConsentData): Promise<boolean> => {
  try {
    const response = await frontendAuth.authenticatedFetch('/api/auth/consent', {
      method: 'POST',
      body: JSON.stringify(consentData),
    });

    if (!response.ok) {
      throw new Error('Failed to sync consent to database');
    }

    return true;
  } catch (error) {
    console.error('Error syncing consent to database:', error);
    return false;
  }
};

export const syncCookieConsentOnLogin = async (): Promise<boolean> => {
  try {
    // Check if user has accepted cookies in localStorage
    if (hasCookieAcceptance()) {
      const cookiePreferences = getCookiePreferences();
      
      if (cookiePreferences) {
        return await syncConsentToDatabase({
          cookieConsent: cookiePreferences,
        });
      }
    }
    
    return true; // No consent to sync is not an error
  } catch (error) {
    console.error('Error syncing cookie consent on login:', error);
    return false;
  }
};

export const updateTermsAcceptance = async (accepted: boolean): Promise<boolean> => {
  try {
    // Update database
    const success = await syncConsentToDatabase({
      termsAccepted: accepted,
    });

    if (success) {
      // Store in localStorage for immediate access
      localStorage.setItem('terms-accepted', accepted.toString());
      localStorage.setItem('terms-accepted-at', new Date().toISOString());
    }

    return success;
  } catch (error) {
    console.error('Error updating terms acceptance:', error);
    return false;
  }
};

export const hasTermsAccepted = (): boolean => {
  return localStorage.getItem('terms-accepted') === 'true';
};

export const getTermsAcceptedAt = (): string | null => {
  return localStorage.getItem('terms-accepted-at');
};

export const initializeConsentSync = async (): Promise<void> => {
  // Sync cookie consent if user is logged in and has consent in localStorage
  await syncCookieConsentOnLogin();
};
