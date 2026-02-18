'use client';

import React, { useState } from 'react';
import { X, Settings, Cookie, Shield, BarChart3, Target, Zap } from 'lucide-react';
import { useCookieConsent, CookiePreferences } from '@/utils/cookieConsent';

export const CookieConsentBanner: React.FC = () => {
  const { showConsentBanner, acceptAll, rejectAll, acceptSelected } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  if (!showConsentBanner) return null;

  const handleAcceptSelected = () => {
    acceptSelected(preferences);
    setShowSettings(false);
  };

  const handlePreferenceChange = (category: keyof CookiePreferences, value: boolean) => {
    if (category === 'necessary') return; // Necessary cookies cannot be disabled
    setPreferences(prev => ({ ...prev, [category]: value }));
  };

  if (showSettings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="mx-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <Cookie size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cookie Preferences</h2>
                  <p className="text-sm text-gray-600">Manage your cookie settings</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mt-0.5">
                  <Shield size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Necessary Cookies</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Required for the website to function properly, including authentication and security.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="necessary"
                  checked={preferences.necessary}
                  disabled
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded disabled:opacity-50"
                />
                <label htmlFor="necessary" className="text-sm font-medium text-gray-700">
                  Always Active
                </label>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 mt-0.5">
                  <BarChart3 size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Analytics Cookies</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Help us understand how visitors interact with our website by collecting and reporting information.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="analytics"
                  checked={preferences.analytics}
                  onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="analytics" className="text-sm font-medium text-gray-700">
                  {preferences.analytics ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 mt-0.5">
                  <Target size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Marketing Cookies</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Used to track visitors across websites to display relevant advertisements.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={preferences.marketing}
                  onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="marketing" className="text-sm font-medium text-gray-700">
                  {preferences.marketing ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 mt-0.5">
                  <Zap size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Functional Cookies</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Enable enhanced functionality and personalization, such as videos and live chats.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="functional"
                  checked={preferences.functional}
                  onChange={(e) => handlePreferenceChange('functional', e.target.checked)}
                  className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="functional" className="text-sm font-medium text-gray-700">
                  {preferences.functional ? 'Enabled' : 'Disabled'}
                </label>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptSelected}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="flex items-start gap-3 max-w-2xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0 mt-0.5">
              <Cookie size={16} />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">We use cookies</span> to enhance your experience, analyze site traffic, and personalize content. 
                By continuing to use our site, you agree to our use of cookies.
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 mt-2"
              >
                <Settings size={14} />
                Customize preferences
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={rejectAll}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reject All
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
