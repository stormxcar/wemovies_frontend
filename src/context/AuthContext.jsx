import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchJson } from "../services/api";
import api from "../services/api";
import { toast } from "react-toastify";

// Utility function to read cookies
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  cookieConsent: false,
  login: () => {},
  logout: () => {},
  acceptCookies: () => {},
  checkAuthStatus: () => {},
  fetchCookiePreferences: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cookieConsent, setCookieConsent] = useState(false);

  // Auto logout function với safeguard
  const autoLogout = React.useCallback(
    (reason = "Phiên đăng nhập đã hết hạn") => {
      // Tránh multiple logout calls
      if (!isAuthenticated) return;

      console.log("🚪 Auto logout:", reason);
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);

      toast.error(`${reason}. Vui lòng đăng nhập lại.`);

      // Redirect to login page
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
    },
    [isAuthenticated]
  );

  // Kiểm tra token expiration thường xuyên (Tắc tạm)
  useEffect(() => {
    // Đã loại bỏ logic kiểm tra token expiration vì backend xử lý authentication
    return;
  }, [isAuthenticated]); // Chỉ depend on isAuthenticated

  // Setup response interceptor để handle 401/403
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Tránh infinite loop
        if (originalRequest._retry) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
          // Skip auto-logout cho một số endpoints
          const skipEndpoints = [
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/auth/verifyUser",
          ];
          if (
            skipEndpoints.some((endpoint) =>
              originalRequest.url?.includes(endpoint)
            )
          ) {
            return Promise.reject(error);
          }

          console.log("🚪 Received 401/403, attempting token refresh...");

          originalRequest._retry = true;

          // Thử refresh token trước
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const refreshResponse = await api.post("/api/auth/refresh", {
                refreshToken,
              });

              if (refreshResponse.data.accessToken) {
                localStorage.setItem(
                  "jwtToken",
                  refreshResponse.data.accessToken
                );
                console.log("✅ Token refreshed successfully");

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
                return api.request(originalRequest);
              }
            } catch (refreshError) {
              console.error("❌ Refresh token failed:", refreshError);
            }
          }

          // Tắc tạm auto-logout để debug
          console.log(
            "⚠️ Auto logout disabled for debugging. 401/403 error:",
            error.response?.data
          );
          // autoLogout("Phiên đăng nhập không hợp lệ");
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Empty dependency array

  // Kiểm tra authentication và cookie consent khi app khởi động
  useEffect(() => {
    checkAuthStatus();
    checkCookieConsent();

    // Also fetch cookie preferences from server
    fetchCookiePreferences();
  }, []);

  const checkCookieConsent = () => {
    // Check browser cookies first (set by backend)
    const cookieConsentValue = getCookie("cookieConsent");
    const localStorageConsent = localStorage.getItem("cookieConsent");

    console.log("🍪 Browser cookie consent:", cookieConsentValue);
    console.log("🍪 LocalStorage consent:", localStorageConsent);

    // Priority: browser cookie > localStorage
    const hasConsent = cookieConsentValue || localStorageConsent === "true";
    console.log("🍪 Final consent status:", hasConsent);

    setCookieConsent(!!hasConsent);
  };

  const fetchCookiePreferences = async () => {
    try {
      const preferences = await fetchJson("/api/cookies/preferences");
      console.log("🍪 Server preferences:", preferences);

      // If server has preferences, update local consent
      if (
        preferences &&
        (preferences.necessary ||
          preferences.analytics ||
          preferences.marketing)
      ) {
        setCookieConsent(true);
        localStorage.setItem("cookieConsent", "true");
      }

      return preferences;
    } catch (error) {
      console.error("🍪 Failed to fetch cookie preferences:", error);
      return null;
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        setLoading(false);
        return;
      }

      // Xác minh token với server (chỉ nếu chưa authenticated)
      if (!isAuthenticated) {
        try {
          const userData = await fetchJson("/api/auth/verifyUser");
          setUser(userData);
          setIsAuthenticated(true);
          console.log("✅ Auth status verified");
        } catch (verifyError) {
          console.error("❌ Token verification failed:", verifyError);
          // Không auto logout ở đây vì interceptor sẽ handle
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      // Không auto logout ở đây để tránh loop
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, passWord) => {
    try {
      const response = await api.post("/api/auth/login", {
        email,
        passWord,
      });

      const data = response.data;

      // Lưu tokens vào localStorage
      if (data.accessToken) localStorage.setItem("jwtToken", data.accessToken);
      if (data.refreshToken)
        localStorage.setItem("refreshToken", data.refreshToken);

      // Set user data
      setUser(data.user || data);
      setIsAuthenticated(true);

      return {
        success: true,
        message: data.message || "Login successful",
        user: data.user || data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  };

  const acceptCookies = async (customPreferences = null) => {
    try {
      console.log("🍪 Starting cookie consent process...");

      // Set default preferences
      const preferences = customPreferences || {
        necessary: true,
        analytics: false,
        marketing: false,
      };

      console.log("🍪 Sending preferences:", preferences);

      // Always set local consent first for immediate UI update
      localStorage.setItem("cookieConsent", "true");
      setCookieConsent(true);
      console.log("✅ Set local cookie consent");

      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.log(
          "ℹ️ No JWT token found, skipping API call but consent is set locally"
        );
        return;
      }

      // Call backend API to save preferences and set cookies
      const response = await api.post("/api/cookies/preferences", preferences);

      console.log("🍪 Cookie consent API successful:", response.data);

      // Refresh cookie state from browser
      setTimeout(() => {
        checkCookieConsent();
      }, 100);

      // Check auth status to get any new cookies
      await checkAuthStatus();
      console.log("✅ Cookie consent process completed");
    } catch (error) {
      console.error("❌ Cookie consent API failed:", error);
      console.log("✅ Local cookie consent already set despite API failure");
    }
  };

  const logout = async () => {
    try {
      // Gọi backend logout API
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear local storage và state
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);

      // Redirect to home or login
      window.location.href = "/";
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    loading,
    cookieConsent,
    login,
    logout,
    autoLogout,
    acceptCookies,
    checkAuthStatus,
    fetchCookiePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
