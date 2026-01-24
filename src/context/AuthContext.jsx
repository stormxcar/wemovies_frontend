import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchJson } from "../services/api";
import api from "../services/api";
import { toast } from "react-toastify";
import NotificationService from "../services/NotificationService";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  checkAuthStatus: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper function to decode JWT token
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  // Get user ID from JWT token
  const getUserIdFromToken = (token) => {
    const decoded = decodeJWT(token);
    return decoded?.sub || decoded?.userId || decoded?.id || decoded?.email;
  };

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

      // Redirect to homepage instead of /auth since /auth doesn't exist
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    },
    [isAuthenticated],
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
              originalRequest.url?.includes(endpoint),
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
                  refreshResponse.data.accessToken,
                );
                console.log("✅ Token refreshed successfully");

                // Backend đã tự động set HttpOnly cookie, không cần retry với header
                // Request tiếp theo sẽ tự động dùng cookie mới
                return Promise.resolve(); // Không retry request cũ vì cookie đã được update
              }
            } catch (refreshError) {
              console.error("❌ Refresh token failed:", refreshError);
            }
          }

          // Tắc tạm auto-logout để debug
          console.log(
            "⚠️ Disabling auto logout to prevent redirect loop since no /auth route exists",
          );
          // autoLogout("Phiên đăng nhập không hợp lệ");
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Empty dependency array

  // ĐƠN GIẢN HÓA: Chỉ check localStorage token
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("user");

    if (token) {
      console.log("🔍 Found JWT token - user is authenticated");
      setIsAuthenticated(true);

      // Nếu có user data trong localStorage thì dùng luôn
      if (userData) {
        try {
          let parsedUser = JSON.parse(userData);

          // Ensure user has ID from JWT if missing
          if (!parsedUser.id) {
            const userId = getUserIdFromToken(token);
            if (userId) {
              parsedUser = { ...parsedUser, id: userId };
              // Update localStorage with userId
              localStorage.setItem("user", JSON.stringify(parsedUser));
            }
          }

          setUser(parsedUser);
          console.log("✅ Loaded user from localStorage:", parsedUser);
          console.log("👤 User object fields:", Object.keys(parsedUser));
          console.log("🆔 User ID candidates:", {
            id: parsedUser.id,
            userId: parsedUser.userId,
            sub: parsedUser.sub,
            email: parsedUser.email,
          });

          // Try to find user ID from various fields
          const userId =
            parsedUser.id ||
            parsedUser.userId ||
            parsedUser.sub ||
            parsedUser.email;
          if (userId) {
            console.log(
              "🔗 Connecting NotificationService with userId:",
              userId,
            );
            // Connect to NotificationService
            connectNotificationService(userId, token);
          } else {
            console.error("❌ No user ID found in user object");
          }
        } catch (error) {
          console.log("⚠️ Failed to parse user data from localStorage");
        }
      }
    } else {
      console.log("📭 No JWT token found");
      // Disconnect NotificationService when not authenticated
      NotificationService.disconnect();
    }

    setLoading(false);
    console.log("🔄 Simple auth check completed");
  }, []);

  // Connect to NotificationService
  const connectNotificationService = async (userId, token) => {
    try {
      console.log("🔔 Attempting to connect to NotificationService...");
      await NotificationService.connect(userId, token);
      console.log("✅ Connected to NotificationService");
    } catch (error) {
      console.warn(
        "⚠️ NotificationService connection failed (WebSocket may not be enabled on backend):",
        error.message,
      );
      // Don't throw error - allow app to continue without WebSocket
    }
  };

  const checkCookieConsent = () => {
    // Cookie consent functionality removed for simplification
  };

  const fetchCookiePreferences = async () => {
    // Cookie preferences functionality removed for simplification
    return null;
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      const userData = localStorage.getItem("user");

      if (!token) {
        console.log("📭 No JWT token found in localStorage");
        setLoading(false);
        return;
      }

      console.log("🔍 JWT token found, checking user data...");

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log(
            "✅ User restored from localStorage:",
            parsedUser.email,
            "Role:",
            parsedUser.role?.roleName,
          );
        } catch (error) {
          console.error("❌ Failed to parse user data:", error);
          // Clear invalid data
          localStorage.removeItem("user");
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("refreshToken");
        }
      } else {
        console.log("⚠️ No user data found in localStorage, clearing tokens");
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("refreshToken");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
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

      // Lưu user data vào localStorage
      const userData = data.user || data;
      if (userData && data.accessToken) {
        // Add userId from JWT token to userData
        const userId = getUserIdFromToken(data.accessToken);
        const userDataWithId = { ...userData, id: userId };
        localStorage.setItem("user", JSON.stringify(userDataWithId));
        setUser(userDataWithId);
      } else if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }

      // Set authentication state
      setIsAuthenticated(true);

      // Connect to NotificationService after successful login
      const userId = getUserIdFromToken(data.accessToken);
      if (data.accessToken && userId) {
        console.log("🔗 Connecting NotificationService with userId:", userId);
        await connectNotificationService(userId, data.accessToken);
      } else {
        console.warn("⚠️ No userId found for NotificationService connection");
      }

      console.log(
        "✅ Login successful, user data set:",
        userData.email,
        "Role:",
        userData.role?.roleName,
      );

      return {
        success: true,
        message: data.message || "Login successful",
        user: userData,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  };

  const acceptCookies = async (customPreferences = null) => {
    // Cookie consent functionality removed for simplification
    console.log(
      "🍪 Cookie consent functionality disabled for simplified authentication",
    );
  };

  const logout = async () => {
    try {
      // Get current user ID before clearing
      const currentUserId = user?.id || user?.email || user?.sub;

      // Clear all watching data for this user
      if (currentUserId) {
        try {
          // Import and use the watching service to clear user data
          const { useStartWatching } =
            await import("../hooks/useStartWatching");

          // Clear all local storage watching data
          localStorage.removeItem("wemovies_current_session");
          localStorage.removeItem("wemovies_local_watching");
          localStorage.removeItem("wemovies_retry_queue");

          console.log("🧹 Cleared watching data for user:", currentUserId);
        } catch (watchingError) {
          console.warn("⚠️ Error clearing watching data:", watchingError);
        }
      }

      // Gọi backend logout API
      await api.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Disconnect NotificationService
      NotificationService.disconnect();

      // Clear local storage và state
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);

      // Clear JWT cookie if present
      try {
        document.cookie =
          "jwtToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
      } catch (error) {
        // Ignore cookie clearing errors
      }

      console.log("🔔 Disconnected from NotificationService");
      // Redirect to home or login
      window.location.href = "/";
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    loading,
    login,
    logout,
    autoLogout,
    acceptCookies,
    checkAuthStatus,
    fetchCookiePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
