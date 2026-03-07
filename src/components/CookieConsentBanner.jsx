import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useCookieConsent } from "../hooks/useCookieConsent";
import { useTheme } from "../context/ThemeContext";

const CookieConsentBanner = () => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
  });
  const { themeClasses, isDarkMode } = useTheme();
  const {
    hasConsented,
    consent,
    acceptAllCookies,
    acceptNecessaryOnly,
    acceptCustom,
  } = useCookieConsent();

  // Check if user has already made a cookie consent decision
  useEffect(() => {
    if (!hasConsented) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasConsented]);

  useEffect(() => {
    if (!consent) return;
    setPreferences({
      analytics: Boolean(consent.analytics),
      marketing: Boolean(consent.marketing),
    });
  }, [consent]);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setShowBanner(false);
  };

  const handleAcceptNecessary = () => {
    acceptNecessaryOnly();
    setShowBanner(false);
  };

  const handleReject = () => {
    acceptNecessaryOnly(); // Reject = only necessary
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    acceptCustom(preferences);
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gradient-to-t from-black/80 via-black/55 to-black/35 backdrop-blur-[2px]" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("cookieBanner.title")}
        className={`fixed bottom-0 left-0 right-0 z-50 border-t ${themeClasses.borderLight} px-4 py-5 shadow-2xl ${themeClasses.textPrimary} ${
          isDarkMode
            ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
            : "bg-gradient-to-r from-white via-slate-50 to-white"
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
                🍪 {t("cookieBanner.title")}
              </h3>
              <p
                className={`text-sm sm:text-base ${themeClasses.textSecondary} mb-3`}
              >
                {t("cookieBanner.description")}
              </p>

              <p
                className={`text-xs sm:text-sm ${themeClasses.textMuted} mb-2`}
              >
                {t("cookieBanner.compliance_note")}
              </p>

              {showDetails && (
                <div className="mb-4 space-y-3">
                  <div
                    className={`rounded-lg p-3 border ${themeClasses.borderLight} ${isDarkMode ? "bg-slate-800/70" : "bg-white/70"}`}
                  >
                    <p className={`text-xs ${themeClasses.textMuted}`}>
                      <strong className="text-green-400">
                        {t("cookieBanner.necessary")}:
                      </strong>{" "}
                      {t("cookieBanner.necessary_desc")}
                    </p>
                  </div>

                  <div
                    className={`rounded-lg p-3 border ${themeClasses.borderLight} ${isDarkMode ? "bg-slate-800/70" : "bg-white/70"}`}
                  >
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className={`text-xs ${themeClasses.textMuted}`}>
                        <strong className="text-orange-400">
                          {t("cookieBanner.analytics")}:
                        </strong>{" "}
                        {t("cookieBanner.analytics_desc")}
                      </span>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(event) =>
                          setPreferences((prev) => ({
                            ...prev,
                            analytics: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-orange-500"
                      />
                    </label>
                  </div>

                  <div
                    className={`rounded-lg p-3 border ${themeClasses.borderLight} ${isDarkMode ? "bg-slate-800/70" : "bg-white/70"}`}
                  >
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className={`text-xs ${themeClasses.textMuted}`}>
                        <strong className="text-fuchsia-400">
                          {t("cookieBanner.advertising")}:
                        </strong>{" "}
                        {t("cookieBanner.advertising_desc")}
                      </span>
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(event) =>
                          setPreferences((prev) => ({
                            ...prev,
                            marketing: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-orange-500"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    className="px-4 py-2 rounded text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    {t("cookieBanner.save_preferences")}
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-orange-400 hover:text-orange-300 text-sm underline transition-colors"
              >
                {showDetails
                  ? t("cookieBanner.hide_details")
                  : t("cookieBanner.show_details")}
              </button>
            </div>

            <div className="flex gap-2.5 flex-shrink-0 flex-wrap">
              <button
                onClick={handleReject}
                className={`px-4 py-2 rounded text-sm transition-colors ${themeClasses.cardSecondary} ${themeClasses.textPrimary} ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
              >
                {t("cookieBanner.reject")}
              </button>
              <button
                onClick={handleAcceptNecessary}
                className={`px-4 py-2 rounded text-sm transition-colors ${themeClasses.cardSecondary} ${themeClasses.textPrimary} ${isDarkMode ? "hover:bg-gray-500" : "hover:bg-gray-200"}`}
              >
                {t("cookieBanner.necessary_only")}
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                {t("cookieBanner.accept_all")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsentBanner;
