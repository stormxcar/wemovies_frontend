// hooks/useViewTracking.js
import { useState, useEffect, useCallback } from "react";
import ViewTrackingService from "../services/ViewTrackingService";
import TrendingService from "../services/TrendingService";

export const useViewTracking = (userId) => {
  const [viewCounts, setViewCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track view for a movie (usually called automatically)
  const trackView = useCallback(
    async (movieId, currentTime, totalDuration) => {
      if (!userId || !movieId) return;

      try {
        const result = await ViewTrackingService.trackView(
          userId,
          movieId,
          currentTime,
          totalDuration,
        );

        // Also track for trending
        await TrendingService.trackTrendingView(movieId, userId);

        return result;
      } catch (err) {
        console.error("Error tracking view:", err);
        setError("Không thể theo dõi lượt xem");
        return null;
      }
    },
    [userId],
  );

  // Get view count for a single movie
  const getViewCount = useCallback(async (movieId) => {
    if (!movieId) return null;

    try {
      setIsLoading(true);
      const result = await ViewTrackingService.getViewCount(movieId);

      if (result.status === "SUCCESS") {
        setViewCounts((prev) => ({
          ...prev,
          [movieId]: result.viewCount,
        }));
        return result.viewCount;
      }

      return null;
    } catch (err) {
      console.error("Error getting view count:", err);
      setError("Không thể lấy số lượt xem");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get view counts for multiple movies
  const getBatchViewCounts = useCallback(async (movieIds) => {
    if (!Array.isArray(movieIds) || movieIds.length === 0) return {};

    try {
      setIsLoading(true);
      const result = await ViewTrackingService.getBatchViewCounts(movieIds);

      if (result.status === "SUCCESS") {
        setViewCounts((prev) => ({
          ...prev,
          ...result.viewCounts,
        }));
        return result.viewCounts;
      }

      return {};
    } catch (err) {
      console.error("Error getting batch view counts:", err);
      setError("Không thể lấy số lượt xem");
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    viewCounts,
    isLoading,
    error,
    trackView,
    getViewCount,
    getBatchViewCounts,
    clearError,
  };
};

export default useViewTracking;
