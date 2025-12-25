import React from "react";
import { useLoading } from "../../utils/LoadingContext";

// HOC for wrapping components with loading capability
export const withLoading = (WrappedComponent, loadingKey) => {
  return function WithLoadingComponent(props) {
    const {
      setLoading,
      isLoading,
      withLoading: executeWithLoading,
    } = useLoading();

    const enhancedProps = {
      ...props,
      setLoading: (loading, message) =>
        setLoading(loadingKey, loading, message),
      isLoading: isLoading(loadingKey),
      withLoading: (asyncFn, message) =>
        executeWithLoading(loadingKey, asyncFn, message),
    };

    return <WrappedComponent {...enhancedProps} />;
  };
};

// Hook for navigation with loading
export const useNavigateWithLoading = () => {
  const { navigateWithLoading } = useLoading();
  return navigateWithLoading;
};

// Custom hook for async operations with loading
export const useAsyncWithLoading = () => {
  const { withLoading } = useLoading();
  return withLoading;
};

export default {
  withLoading,
  useNavigateWithLoading,
  useAsyncWithLoading,
};
