'use client';

import { useState, useEffect } from 'react';
import { syncConsentToDatabase } from '@/services/consentService';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

const COOKIE_CONSENT_KEY = 'cookie-consent-preferences';
const CONSENT_TIMESTAMP_KEY = 'cookie-consent-timestamp';

export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsentBanner, setShowConsentBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const consentTimestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);
    
    if (storedConsent) {
      try {
        const parsed = JSON.parse(storedConsent);
        setPreferences(parsed);
        setHasConsented(true);
        
        // Check if consent is older than 1 year and needs renewal
        if (consentTimestamp) {
          const consentDate = new Date(consentTimestamp);
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          
          if (consentDate < oneYearAgo) {
            setShowConsentBanner(true);
            setHasConsented(false);
          }
        }
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        setShowConsentBanner(true);
      }
    } else {
      setShowConsentBanner(true);
    }
  }, []);

  const acceptAll = () => {
    const allPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(allPreferences);
  };

  const acceptSelected = (selectedPreferences: CookiePreferences) => {
    saveConsent(selectedPreferences);
  };

  const rejectAll = () => {
    const minimalPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(minimalPreferences);
  };

  const saveConsent = async (consentPreferences: CookiePreferences) => {
    setPreferences(consentPreferences);
    setHasConsented(true);
    setShowConsentBanner(false);
    
    // Save to localStorage
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentPreferences));
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    localStorage.setItem('cookie-acceptance-status', 'accepted');
    
    // Apply cookie preferences
    applyCookiePreferences(consentPreferences);
    
    // Sync to database if user is logged in
    try {
      await syncConsentToDatabase({ cookieConsent: consentPreferences });
    } catch (error) {
      console.error('Failed to sync consent to database:', error);
      // Don't fail the user action if database sync fails
    }
  };

  const withdrawConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
    localStorage.removeItem('cookie-acceptance-status');
    setHasConsented(false);
    setShowConsentBanner(true);
    
    // Clear non-essential cookies
    clearNonEssentialCookies();
  };

  return {
    preferences,
    hasConsented,
    showConsentBanner,
    acceptAll,
    acceptSelected,
    rejectAll,
    withdrawConsent,
  };
};

const applyCookiePreferences = (preferences: CookiePreferences) => {
  // This function would typically interact with your analytics/marketing tools
  // For demonstration, we'll just log the preferences
  
  if (!preferences.analytics) {
    // Disable analytics cookies/tracking
    console.log('Analytics cookies disabled');
  }
  
  if (!preferences.marketing) {
    // Disable marketing cookies/tracking
    console.log('Marketing cookies disabled');
  }
  
  if (!preferences.functional) {
    // Disable functional cookies
    console.log('Functional cookies disabled');
  }
};

const clearNonEssentialCookies = () => {
  // Clear all non-essential cookies
  const cookies = document.cookie.split(';');
  
  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    
    // Skip essential cookies (auth tokens, session, etc.)
    const essentialCookies = ['auth-token', 'user-id', 'username', 'session'];
    if (!essentialCookies.includes(cookieName)) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
};

export const hasAnalyticsConsent = (): boolean => {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      const preferences = JSON.parse(consent);
      return preferences.analytics === true;
    }
  } catch (error) {
    console.error('Error checking analytics consent:', error);
  }
  return false;
};

export const hasMarketingConsent = (): boolean => {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      const preferences = JSON.parse(consent);
      return preferences.marketing === true;
    }
  } catch (error) {
    console.error('Error checking marketing consent:', error);
  }
  return false;
};

export const hasFunctionalConsent = (): boolean => {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      const preferences = JSON.parse(consent);
      return preferences.functional === true;
    }
  } catch (error) {
    console.error('Error checking functional consent:', error);
  }
  return false;
};

export const hasCookieAcceptance = (): boolean => {
  return localStorage.getItem('cookie-acceptance-status') === 'accepted';
};

export const getCookiePreferences = (): CookiePreferences | null => {
  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      return JSON.parse(consent);
    }
  } catch (error) {
    console.error('Error getting cookie preferences:', error);
  }
  return null;
};
