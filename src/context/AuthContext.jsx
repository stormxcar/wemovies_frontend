import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";
import { toast } from "@toast";
import NotificationService from "../services/NotificationService";
import { useTranslation } from "react-i18next";

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  checkAuthStatus: () => {},
});

export const useAuth = () => useContext(AuthContext);

const clearStoredAuth = () => {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const decodeJWT = useCallback((token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(
            (char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2),
          )
          .join(""),
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }, []);

  const getUserIdFromToken = useCallback(
    (token) => {
      const decoded = decodeJWT(token);
      return decoded?.sub || decoded?.userId || decoded?.id || decoded?.email;
    },
    [decodeJWT],
  );

  const getTokenExpiryMs = useCallback(
    (token) => {
      const decoded = decodeJWT(token);
      if (!decoded?.exp) return null;
      return Number(decoded.exp) * 1000;
    },
    [decodeJWT],
  );

  const isTokenExpired = useCallback(
    (token) => {
      const expiryMs = getTokenExpiryMs(token);
      if (!expiryMs) return false;
      return Date.now() >= expiryMs;
    },
    [getTokenExpiryMs],
  );

  const connectNotificationService = useCallback(async (userId, token) => {
    try {
      await NotificationService.connect(userId, token);
    } catch {
      // Keep app running if websocket connection fails
    }
  }, []);

  const autoLogout = useCallback(
    (reason = t("authContext.session_expired")) => {
      if (!isAuthenticated) return;
      clearStoredAuth();
      setUser(null);
      setIsAuthenticated(false);
      NotificationService.disconnect();
      toast.error(`${reason}. ${t("authContext.login_again")}`);
    },
    [isAuthenticated, t],
  );

  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config || {};
        if (originalRequest._retry) {
          return Promise.reject(error);
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
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

          originalRequest._retry = true;

          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const refreshResponse = await api.post("/api/auth/refresh", {
                refreshToken,
              });

              if (refreshResponse.data?.accessToken) {
                localStorage.setItem(
                  "jwtToken",
                  refreshResponse.data.accessToken,
                );
                return Promise.resolve();
              }
            } catch {
              autoLogout("Session is no longer valid");
            }
          } else {
            autoLogout("Session is no longer valid");
          }
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [autoLogout]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("user");

    if (!token) {
      NotificationService.disconnect();
      setLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      clearStoredAuth();
      NotificationService.disconnect();
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);

    if (userData) {
      try {
        let parsedUser = JSON.parse(userData);
        if (!parsedUser.id) {
          const userId = getUserIdFromToken(token);
          if (userId) {
            parsedUser = { ...parsedUser, id: userId };
            localStorage.setItem("user", JSON.stringify(parsedUser));
          }
        }

        setUser(parsedUser);
        const userId =
          parsedUser.id ||
          parsedUser.userId ||
          parsedUser.sub ||
          parsedUser.email;

        if (userId) {
          connectNotificationService(userId, token);
        }
      } catch {
        clearStoredAuth();
        setUser(null);
        setIsAuthenticated(false);
      }
    }

    setLoading(false);
  }, [connectNotificationService, getUserIdFromToken, isTokenExpired]);

  // Production behavior: auto-logout when JWT expires.
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiry = () => {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;
      if (isTokenExpired(token)) {
        autoLogout(t("authContext.session_expired"));
      }
    };

    checkTokenExpiry();
    const intervalId = setInterval(checkTokenExpiry, 15000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, isTokenExpired, autoLogout, t]);

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
        setLoading(false);
        return;
      }

      if (isTokenExpired(token)) {
        clearStoredAuth();
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch {
          clearStoredAuth();
        }
      } else {
        clearStoredAuth();
      }
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

      if (data.accessToken) localStorage.setItem("jwtToken", data.accessToken);
      if (data.refreshToken)
        localStorage.setItem("refreshToken", data.refreshToken);

      const userData = data.user || data;
      if (userData && data.accessToken) {
        const userId = getUserIdFromToken(data.accessToken);
        const userDataWithId = { ...userData, id: userId };
        localStorage.setItem("user", JSON.stringify(userDataWithId));
        setUser(userDataWithId);
      } else if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }

      setIsAuthenticated(true);

      const userId = getUserIdFromToken(data.accessToken);
      if (data.accessToken && userId) {
        await connectNotificationService(userId, data.accessToken);
      }

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

  const acceptCookies = async () => {
    // Cookie consent functionality removed for simplification
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);

    NotificationService.disconnect();

    const keysToClear = [
      "jwtToken",
      "refreshToken",
      "authToken",
      "token",
      "user",
      "googleUser",
      "isAuthenticated",
    ];
    keysToClear.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    try {
      delete api.defaults.headers.common.Authorization;
    } catch {
      // ignore
    }

    try {
      const currentUserId = user?.id || user?.email || user?.sub;
      if (currentUserId) {
        localStorage.removeItem("wemovies_current_session");
        localStorage.removeItem("wemovies_local_watching");
        localStorage.removeItem("wemovies_retry_queue");
        localStorage.removeItem("watchingSessions");
      }

      await api.post("/api/auth/logout");
    } catch {
      // ignore logout API errors
    } finally {
      try {
        document.cookie =
          "jwtToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
        document.cookie =
          "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
        document.cookie =
          "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict";
      } catch {
        // ignore cookie cleanup failures
      }
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
    checkCookieConsent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
