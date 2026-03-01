import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageLoader from "../components/loading/PageLoader";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  // Individual component loading states
  const [componentLoadingStates, setComponentLoadingStates] = useState({});

  // Global app loading states
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [appLoadingMessage, setAppLoadingMessage] = useState(
    "Khởi tạo ứng dụng...",
  );
  const [appProgress, setAppProgress] = useState(0);

  // Page transition loading
  const [pageLoading, setPageLoading] = useState(false);
  const [pageLoadingMessage, setPageLoadingMessage] = useState("Đang tải...");

  // Component synchronization for pages like Home
  const [componentsLoaded, setComponentsLoaded] = useState({
    app: false,
    auth: false,
    banner: false,
    movies: false,
    ui: false,
  });

  const location = useLocation();
  const navigate = useNavigate();

  // ===== APP INITIALIZATION =====
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate app initialization steps
        setAppProgress(10);
        setAppLoadingMessage("Khởi tạo ứng dụng...");

        await new Promise((resolve) => setTimeout(resolve, 300));
        setComponentsLoaded((prev) => ({ ...prev, auth: true }));
        setAppProgress(25);
        setAppLoadingMessage("Kiểm tra đăng nhập...");

        await new Promise((resolve) => setTimeout(resolve, 200));
        setComponentsLoaded((prev) => ({ ...prev, ui: true }));
        setAppProgress(50);
        setAppLoadingMessage("Tải giao diện...");

        await new Promise((resolve) => setTimeout(resolve, 100));
        setComponentsLoaded((prev) => ({ ...prev, app: true }));
        setAppProgress(75);
        setAppLoadingMessage("Hoàn tất...");

        await new Promise((resolve) => setTimeout(resolve, 200));
        setAppProgress(100);

        setTimeout(() => {
          setIsAppLoading(false);
        }, 300);
      } catch (error) {
        console.error("App initialization failed:", error);
        setIsAppLoading(false);
      }
    };

    initializeApp();
  }, []);

  // ===== COMPONENT LOADING MANAGEMENT =====
  const setComponentLoading = useCallback((key, isLoading, message = null) => {
    setComponentLoadingStates((prev) => {
      const newState = { ...prev, [key]: isLoading };
      return newState;
    });

    if (message && isLoading) {
      setPageLoadingMessage(message);
    }
  }, []);

  const isComponentLoading = useCallback(
    (key) => {
      return componentLoadingStates[key] || false;
    },
    [componentLoadingStates],
  );

  // ===== PAGE TRANSITION LOADING =====
  const showPageLoading = useCallback((message = "Đang tải trang...") => {
    setPageLoadingMessage(message);
    setPageLoading(true);
  }, []);

  const hidePageLoading = useCallback(() => {
    setPageLoading(false);
  }, []);

  // ===== NAVIGATION WITH LOADING =====
  const navigateWithLoading = useCallback(
    (to, options = {}) => {
      const { loadingMessage = "Đang chuyển trang...", delay = 500 } = options;

      showPageLoading(loadingMessage);

      setTimeout(() => {
        navigate(to, options);
        setTimeout(hidePageLoading, 300);
      }, delay);
    },
    [navigate, showPageLoading, hidePageLoading],
  );

  useEffect(() => {
    const handleAppNavigate = (event) => {
      const to = event?.detail?.to;
      const loadingMessage = event?.detail?.loadingMessage;
      if (!to) return;

      navigateWithLoading(to, {
        loadingMessage: loadingMessage || "Đang chuyển trang...",
      });
    };

    window.addEventListener("app:navigate", handleAppNavigate);
    return () => {
      window.removeEventListener("app:navigate", handleAppNavigate);
    };
  }, [navigateWithLoading]);

  // Auto-hide page loading on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      hidePageLoading();
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, hidePageLoading]);

  // ===== ASYNC OPERATIONS WITH LOADING =====
  const withLoading = useCallback(
    async (key, asyncFunction, message = null) => {
      setComponentLoading(key, true, message);
      try {
        const result = await asyncFunction();
        return result;
      } finally {
        setComponentLoading(key, false);
      }
    },
    [setComponentLoading],
  );

  // ===== GLOBAL PROGRESS MANAGEMENT =====
  const updateProgress = useCallback((newProgress, message) => {
    setAppProgress(newProgress);
    if (message) {
      setAppLoadingMessage(message);
    }
  }, []);

  const showAppLoader = useCallback(
    (message = "Đang tải...", showProgress = false) => {
      setIsAppLoading(true);
      setAppLoadingMessage(message);
      if (!showProgress) {
        setAppProgress(0);
      }
    },
    [],
  );

  const hideAppLoader = useCallback(() => {
    setIsAppLoading(false);
  }, []);

  // ===== UTILITY FUNCTIONS =====
  const isAnyComponentLoading = Object.values(componentLoadingStates).some(
    Boolean,
  );

  const value = {
    // Component Loading
    componentLoadingStates,
    setComponentLoading,
    isComponentLoading,
    isAnyComponentLoading,
    withLoading,

    // Page Loading
    pageLoading,
    pageLoadingMessage,
    showPageLoading,
    hidePageLoading,
    navigateWithLoading,

    // App Loading
    isAppLoading,
    appLoadingMessage,
    appProgress,
    showAppLoader,
    hideAppLoader,
    updateProgress,

    // Component Synchronization
    componentsLoaded,
    setComponentsLoaded,

    // Legacy compatibility
    setLoading: setComponentLoading,
    isLoading: isComponentLoading,
    isAnyLoading: isAnyComponentLoading,
    loadingStates: componentLoadingStates,
  };

  return (
    <LoadingContext.Provider value={value}>
      {/* Global App Loader */}
      {isAppLoading && (
        <PageLoader
          isVisible={true}
          message={appLoadingMessage}
          progress={appProgress}
          showProgress={appProgress > 0}
        />
      )}

      {/* Page Transition Loader */}
      {pageLoading && !isAppLoading && (
        <PageLoader
          isVisible={true}
          message={pageLoadingMessage}
          progress={0}
          showProgress={false}
        />
      )}

      {/* App Content */}
      {!isAppLoading && children}
    </LoadingContext.Provider>
  );
};

// ===== HOOKS =====
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};

// Alias for global loading (backward compatibility)
export const useGlobalLoading = () => {
  const context = useLoading();
  return {
    isLoading: context.isAppLoading,
    loadingMessage: context.appLoadingMessage,
    progress: context.appProgress,
    componentsLoaded: context.componentsLoaded,
    showLoader: context.showAppLoader,
    hideLoader: context.hideAppLoader,
    updateProgress: context.updateProgress,
    setComponentsLoaded: context.setComponentsLoaded,
  };
};

// ===== HOC UTILITIES =====
export const withLoading = (WrappedComponent, loadingKey) => {
  return function WithLoadingComponent(props) {
    const {
      setComponentLoading,
      isComponentLoading,
      withLoading: executeWithLoading,
    } = useLoading();

    const enhancedProps = {
      ...props,
      setLoading: (loading, message) =>
        setComponentLoading(loadingKey, loading, message),
      isLoading: isComponentLoading(loadingKey),
      withLoading: (asyncFn, message) =>
        executeWithLoading(loadingKey, asyncFn, message),
    };

    return <WrappedComponent {...enhancedProps} />;
  };
};

export default LoadingProvider;
