import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [pageLoading, setPageLoading] = useState(false);
  const [pageLoadingMessage, setPageLoadingMessage] = useState("Đang tải...");

  const location = useLocation();
  const navigate = useNavigate();

  // Manage individual loading states
  const setLoading = useCallback((key, isLoading, message = null) => {
    setLoadingStates((prev) => {
      const newState = { ...prev, [key]: isLoading };
      console.log(`Setting loading for ${key} to ${isLoading}`, newState);
      return newState;
    });

    if (message && isLoading) {
      setPageLoadingMessage(message);
    }
  }, []);

  // Check if any loading state is active
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  // Page transition loading
  const showPageLoading = useCallback((message = "Đang tải trang...") => {
    setPageLoadingMessage(message);
    setPageLoading(true);
  }, []);

  const hidePageLoading = useCallback(() => {
    setPageLoading(false);
  }, []);

  // Enhanced navigate with loading
  const navigateWithLoading = useCallback(
    (to, options = {}) => {
      const { loadingMessage = "Đang chuyển trang...", delay = 500 } = options;

      showPageLoading(loadingMessage);

      // Add a small delay for UX
      setTimeout(() => {
        navigate(to, options);
        // Hide loading after navigation
        setTimeout(hidePageLoading, 300);
      }, delay);
    },
    [navigate, showPageLoading, hidePageLoading]
  );

  // Auto-hide page loading on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      hidePageLoading();
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, hidePageLoading]);

  // Utility functions for common loading patterns
  const withLoading = useCallback(
    async (key, asyncFunction, message = null) => {
      setLoading(key, true, message);
      try {
        const result = await asyncFunction();
        return result;
      } finally {
        setLoading(key, false);
      }
    },
    [setLoading]
  );

  const value = {
    // Loading states
    loadingStates,
    isAnyLoading,

    // Page loading
    pageLoading,
    pageLoadingMessage,
    showPageLoading,
    hidePageLoading,

    // Functions
    setLoading,
    withLoading,
    navigateWithLoading,

    // Utility getters
    isLoading: (key) => loadingStates[key] || false,
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
