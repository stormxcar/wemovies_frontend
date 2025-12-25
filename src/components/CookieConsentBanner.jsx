import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const CookieConsentBanner = () => {
  const { acceptCookies, cookieConsent } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  console.log("🍪 CookieConsentBanner render, cookieConsent:", cookieConsent);

  // Không hiển thị nếu đã có consent
  if (cookieConsent) {
    console.log("🍪 Banner hidden because cookieConsent is true");
    return null;
  }

  console.log("🍪 Banner visible, rendering...");

  const handleAcceptAll = async () => {
    console.log("🍪 Accept All button clicked");
    await acceptCookies({
      necessary: true,
      analytics: true,
      marketing: true,
    });
    console.log("🍪 Accept All process completed");
  };

  const handleAcceptNecessary = async () => {
    console.log("🍪 Accept Necessary button clicked");
    await acceptCookies({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    console.log("🍪 Accept Necessary process completed");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              🍪 Cookie Preferences
            </h3>
            <p className="text-sm text-gray-300 mb-3">
              We use cookies to enhance your experience. By continuing to use
              our site, you agree to our use of cookies.
            </p>

            {showDetails && (
              <div className="text-xs text-gray-400 mb-3">
                <p>
                  <strong>Necessary Cookies:</strong> Required for basic site
                  functionality
                </p>
                <p>
                  <strong>Analytics Cookies:</strong> Help us improve our
                  website
                </p>
                <p>
                  <strong>Marketing Cookies:</strong> Used for personalized
                  advertising
                </p>
              </div>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleAcceptNecessary}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              Accept Necessary
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
