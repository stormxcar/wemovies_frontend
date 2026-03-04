import React, { useState, useEffect } from "react";
import { useCookieConsent } from "../hooks/useCookieConsent";
import { useTheme } from "../context/ThemeContext";

const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { themeClasses, isDarkMode } = useTheme();
  const { hasConsented, acceptAllCookies, acceptNecessaryOnly, acceptCustom } =
    useCookieConsent();

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

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />

      {/* Banner */}
      <div
        className={`fixed bottom-0 left-0 right-0 ${themeClasses.card} ${themeClasses.textPrimary} p-4 z-50 shadow-2xl border-t ${themeClasses.borderLight}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                🍪 Tùy chọn Cookie
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                Chúng tôi sử dụng cookie để nâng cao trải nghiệm của bạn. Bằng
                cách tiếp tục sử dụng trang web, bạn đồng ý với việc sử dụng
                cookie của chúng tôi.
              </p>

              {showDetails && (
                <div className={`text-xs ${themeClasses.textMuted} mb-3 space-y-2`}>
                  <p>
                    <strong className="text-green-400">
                      Cookie cần thiết:
                    </strong>{" "}
                    Bắt buộc cho chức năng cơ bản của trang web
                  </p>
                  <p>
                    <strong className="text-blue-400">Cookie phân tích:</strong>{" "}
                    Giúp chúng tôi cải thiện website
                  </p>
                  <p>
                    <strong className="text-purple-400">
                      Cookie quảng cáo:
                    </strong>{" "}
                    Được sử dụng cho quảng cáo cá nhân hóa
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
              >
                {showDetails ? "Ẩn chi tiết" : "Xem chi tiết"}
              </button>
            </div>

            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={handleReject}
                className={`px-4 py-2 rounded text-sm transition-colors ${themeClasses.cardSecondary} ${themeClasses.textPrimary} ${isDarkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"}`}
              >
                Từ chối
              </button>
              <button
                onClick={handleAcceptNecessary}
                className={`px-4 py-2 rounded text-sm transition-colors ${themeClasses.cardSecondary} ${themeClasses.textPrimary} ${isDarkMode ? "hover:bg-gray-500" : "hover:bg-gray-200"}`}
              >
                Chỉ cần thiết
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors font-medium"
              >
                Chấp nhận tất cả
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsentBanner;
