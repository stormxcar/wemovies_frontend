/**
 * Cookie Consent Utilities
 * Provides functions to check and manage cookie consent preferences
 */

/**
 * Get user's cookie consent preferences
 * @returns {Object|null} Cookie consent data or null if not set
 */
export const getCookieConsent = () => {
  try {
    const consent = localStorage.getItem("cookieConsent");
    return consent ? JSON.parse(consent) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if user has consented to specific cookie types
 * @param {string} type - Cookie type: 'necessary', 'analytics', 'marketing'
 * @returns {boolean} Whether user has consented to this cookie type
 */
export const hasConsentForCookie = (type) => {
  const consent = getCookieConsent();
  if (!consent) {
    return false; // No consent given yet
  }

  // Necessary cookies are always allowed
  if (type === "necessary") {
    return true;
  }

  return consent[type] === true;
};

/**
 * Check if user has made any cookie consent decision
 * @returns {boolean} Whether user has made a consent decision
 */
export const hasGivenConsent = () => {
  return getCookieConsent() !== null;
};

/**
 * Clear cookie consent (for testing or reset purposes)
 */
export const clearCookieConsent = () => {
  localStorage.removeItem("cookieConsent");
};

/**
 * Set cookie consent programmatically
 * @param {Object} consent - Consent object with necessary, analytics, marketing properties
 */
export const setCookieConsent = (consent) => {
  const consentData = {
    ...consent,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem("cookieConsent", JSON.stringify(consentData));
};

/**
 * Analytics helper - only track if user has consented
 * @param {Function} analyticsFunction - Analytics function to call
 */
export const trackIfConsented = (analyticsFunction) => {
  if (hasConsentForCookie("analytics")) {
    analyticsFunction();
  } else {
  }
};

/**
 * Marketing helper - only show ads/track if user has consented
 * @param {Function} marketingFunction - Marketing function to call
 */
export const marketingIfConsented = (marketingFunction) => {
  if (hasConsentForCookie("marketing")) {
    marketingFunction();
  } else {
  }
};
