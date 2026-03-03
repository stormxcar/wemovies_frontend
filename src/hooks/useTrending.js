// hooks/useTrending.js
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import TrendingService from "../services/TrendingService";

export const useTrending = () => {
  const { t } = useTranslation();
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingStats, setTrendingStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasAuthToken = () => {
    return !!(
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("token")
    );
  };

  // Get trending movies
  const fetchTrendingMovies = useCallback(
    async (limit = 10, includeDetails = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await TrendingService.getTrendingMovies(
          limit,
          includeDetails,
        );

        if (result.status === "SUCCESS") {
          setTrendingMovies(result.trendingMovies || []);
          return result.trendingMovies || [];
        } else {
          throw new Error(result.message || "Failed to fetch trending movies");
        }
      } catch (err) {
        setError(t("trending.errors.fetch_movies"));
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  // Get trending statistics
  const fetchTrendingStats = useCallback(async () => {
    if (!hasAuthToken()) {
      setTrendingStats(null);
      return null;
    }

    try {
      const result = await TrendingService.getTrendingStats();

      if (result.status === "SUCCESS") {
        const normalizedStats = result.stats || result || null;
        setTrendingStats(normalizedStats);
        return normalizedStats;
      } else {
        throw new Error(result.message || "Failed to fetch trending stats");
      }
    } catch (err) {
      setError(t("trending.errors.fetch_stats"));
      return null;
    }
  }, [t]);

  // Track trending view (usually called from video player)
  const trackTrendingView = useCallback(async (movieId, userId) => {
    if (!movieId || !userId) return;

    try {
      const result = await TrendingService.trackTrendingView(movieId, userId);
      return result;
    } catch (err) {
      return null;
    }
  }, []);

  // Refresh trending data
  const refreshTrending = useCallback(
    async (limit = 10) => {
      await Promise.all([fetchTrendingMovies(limit), fetchTrendingStats()]);
    },
    [fetchTrendingMovies, fetchTrendingStats],
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load trending data on mount
  useEffect(() => {
    fetchTrendingMovies(10);
    fetchTrendingStats();
  }, [fetchTrendingMovies, fetchTrendingStats]);

  return {
    trendingMovies,
    trendingStats,
    isLoading,
    error,
    fetchTrendingMovies,
    fetchTrendingStats,
    trackTrendingView,
    refreshTrending,
    clearError,
  };
};

export default useTrending;
