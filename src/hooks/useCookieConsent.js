/**
 * Custom hook for Cookie Consent Management
 * Provides easy access to cookie consent status and utilities
 */

import { useState, useEffect } from "react";
import {
  getCookieConsent,
  hasConsentForCookie,
  hasGivenConsent,
  setCookieConsent,
  clearCookieConsent,
} from "../utils/cookieUtils";
import analyticsService from "../services/analytics";

export const useCookieConsent = () => {
  const [consent, setConsent] = useState(null);
  const [hasConsented, setHasConsented] = useState(false);

  // Load consent status on mount
  useEffect(() => {
    const consentData = getCookieConsent();
    setConsent(consentData);
    setHasConsented(hasGivenConsent());
  }, []);

  // Update consent and notify services
  const updateConsent = (newConsent) => {
    setCookieConsent(newConsent);
    setConsent(newConsent);
    setHasConsented(true);

    // Notify analytics service
    if (newConsent.analytics) {
      analyticsService.onConsentGiven();
    } else {
      analyticsService.onConsentWithdrawn();
    }
  };

  // Reset consent (for testing or user request)
  const resetConsent = () => {
    clearCookieConsent();
    setConsent(null);
    setHasConsented(false);
    analyticsService.onConsentWithdrawn();
  };

  // Accept all cookies
  const acceptAllCookies = () => {
    const allConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    updateConsent(allConsent);
  };

  // Accept only necessary cookies
  const acceptNecessaryOnly = () => {
    const necessaryConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    updateConsent(necessaryConsent);
  };

  // Accept custom preferences
  const acceptCustom = (preferences) => {
    const customConsent = {
      necessary: true, // Always required
      analytics: preferences.analytics || false,
      marketing: preferences.marketing || false,
    };
    updateConsent(customConsent);
  };

  return {
    // State
    consent,
    hasConsented,

    // Cookie type checkers
    canUseAnalytics: hasConsentForCookie("analytics"),
    canUseMarketing: hasConsentForCookie("marketing"),
    canUseNecessary: hasConsentForCookie("necessary"),

    // Actions
    acceptAllCookies,
    acceptNecessaryOnly,
    acceptCustom,
    resetConsent,
    updateConsent,

    // Utility checkers
    hasConsentFor: (type) => hasConsentForCookie(type),
  };
};

export default useCookieConsent;
