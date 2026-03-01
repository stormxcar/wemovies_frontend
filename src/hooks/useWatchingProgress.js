// hooks/useWatchingProgress.js
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import WatchingProgressService from "../services/WatchingProgressService";
import ViewTrackingService from "../services/ViewTrackingService";
import TrendingService from "../services/TrendingService";
import { fetchJson } from "../services/api";

export const useWatchingProgress = (userId) => {
  const [watchingList, setWatchingList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [isAPIAvailable, setIsAPIAvailable] = useState(true);
  const [viewTrackingEnabled, setViewTrackingEnabled] = useState(true);

  // Refs để track active sessions
  const activeSessionRef = useRef(null);
  const progressUpdateIntervalRef = useRef(null);
  const lastViewTrackTimeRef = useRef(0); // Track last view tracking time

  const getAuthToken = useCallback(() => {
    return (
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }, []);

  // Helper function để get user ID
  const getUserId = useCallback(async (userObj) => {
    if (!userObj) return null;

    let extractedUserId = null;

    // If userObj is already a string (email, username, etc.)
    if (typeof userObj === "string") {
      extractedUserId = userObj;
    } else {
      // If userObj is an object, extract ID from various possible fields
      extractedUserId =
        userObj.id ||
        userObj.email ||
        userObj.username ||
        userObj.sub ||
        userObj.user_id ||
        userObj.userId ||
        null;
    }

    return extractedUserId;
  }, []);

  const [currentUserId, setCurrentUserId] = useState(null);

  // Resolve userId asynchronously
  useEffect(() => {
    const resolveUserId = async () => {
      const resolvedId =
        (await getUserId(userId)) ||
        (await getUserId(userId?.id)) ||
        (await getUserId(userId?.user));
      setCurrentUserId(resolvedId);
    };

    if (userId) {
      resolveUserId();
    } else {
      setCurrentUserId(null);
    }
  }, [userId, getUserId]);

  // Lấy danh sách đang xem
  const fetchWatchingList = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setWatchingList([]);
      setIsAPIAvailable(false);
      setIsLoading(false);
      return;
    }

    if (!currentUserId || typeof currentUserId !== "string") {
      console.warn("No valid userId provided, skipping fetch watching list");
      setWatchingList([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result =
        await WatchingProgressService.getWatchingList(currentUserId);

      // If we got any data back, API is available
      setIsAPIAvailable(true);

      if (result.status === "SUCCESS" && Array.isArray(result.data)) {
        const formattedData = WatchingProgressService.formatWatchingData(
          result.data,
        );
        setWatchingList(formattedData);
      } else if (Array.isArray(result)) {
        const formattedData =
          WatchingProgressService.formatWatchingData(result);
        setWatchingList(formattedData);
      } else {
        setWatchingList([]);
      }
    } catch (err) {
      console.error("Error in fetchWatchingList:", err);
      setIsAPIAvailable(false);
      setError("Không thể tải danh sách phim đang xem");
      setWatchingList([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, getAuthToken]);

  // Bắt đầu xem phim
  const startWatching = useCallback(
    async (movieId, movieTitle, totalDuration = 7200) => {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Yêu cầu đăng nhập để theo dõi tiến độ xem");
      }

      // If currentUserId is not ready yet, wait for it
      let finalUserId = currentUserId;
      if (!finalUserId && userId) {
        finalUserId = await getUserId(userId);
      }

      if (!finalUserId || typeof finalUserId !== "string") {
        throw new Error("User ID is required");
      }

      if (!movieId || !movieTitle) {
        throw new Error("Movie ID and title are required");
      }

      try {
        const payload = {
          userId: finalUserId,
          movieId: movieId.toString(),
          movieTitle,
          totalDuration,
        };
        const result = await WatchingProgressService.startWatching(
          payload.userId,
          payload.movieId,
          payload.movieTitle,
          payload.totalDuration,
        );

        if (result.status === "SUCCESS" || result.success) {
          setIsAPIAvailable(true);
          toast.success(`Bắt đầu xem: ${movieTitle}`);

          // Set active session for tracking
          activeSessionRef.current = {
            userId: finalUserId,
            movieId: movieId.toString(),
            movieTitle,
            totalDuration,
            startedAt: Date.now(),
          };

          // Refresh list to show new item
          await fetchWatchingList();

          return {
            status: "SUCCESS",
            ...result,
            resumeTime: result.resumeTime || 0,
            isFromResume: result.isFromResume || false,
            source: "hybrid",
          };
        } else {
          throw new Error(result.message || "Failed to start watching session");
        }
      } catch (err) {
        console.error("Error in startWatching:", err);
        setIsAPIAvailable(false);
        setError("Không thể bắt đầu xem phim");
        toast.error("Không thể bắt đầu phiên xem");
        throw err;
      }
    },
    [currentUserId, fetchWatchingList, getUserId, userId, getAuthToken],
  );

  // Cập nhật tiến độ với View Tracking tích hợp
  const updateProgress = useCallback(
    async (movieId, currentTime, totalDuration) => {
      if (!currentUserId || !activeSessionRef.current) return;

      try {
        const payload = {
          userId: currentUserId,
          movieId,
          currentTime,
          totalDuration,
        };

        // Update progress in hybrid system
        const result = await WatchingProgressService.updateProgress(
          payload.userId,
          payload.movieId,
          payload.currentTime,
          payload.totalDuration,
        );

        if (result.status === "SUCCESS") {
          // Update local state
          setWatchingList((prev) =>
            prev.map((item) =>
              item.movieId === movieId.toString()
                ? {
                    ...item,
                    currentTime: Math.round(currentTime),
                    totalDuration: Math.round(totalDuration),
                    percentage:
                      result.percentage || (currentTime / totalDuration) * 100,
                    lastWatched: new Date().toISOString(),
                  }
                : item,
            ),
          );

          // Integrate View Tracking and Trending
          if (viewTrackingEnabled) {
            try {
              const now = Date.now();
              const percentage = (currentTime / totalDuration) * 100;

              // Track view every 30 seconds and when reaching significant progress
              const shouldTrackView =
                now - lastViewTrackTimeRef.current > 30000 || // Every 30s
                percentage >= 30 || // Important milestone for view counting
                percentage >= 50 ||
                percentage >= 80 ||
                percentage >= 95;

              if (shouldTrackView) {
                // Track view for ViewTracking service
                await ViewTrackingService.trackView(
                  currentUserId,
                  movieId,
                  currentTime,
                  totalDuration,
                );

                // Track for Trending calculation
                await TrendingService.trackTrendingView(movieId, currentUserId);

                lastViewTrackTimeRef.current = now;
              }
            } catch (trackingError) {
              console.warn(
                "View tracking failed (non-critical):",
                trackingError.message,
              );
              // Don't throw error as this is non-critical functionality
            }
          }

          return result;
        }
      } catch (err) {
        console.error("Error updating progress:", err);
        // Don't show toast for progress update errors to avoid spam
        return { success: false, error: err.message };
      }
    },
    [currentUserId, viewTrackingEnabled],
  );

  // Tự động cập nhật tiến độ
  const startProgressTracking = useCallback(
    (movieId, getProgressFn, intervalMs = 10000) => {
      // Stop any existing interval
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }

      progressUpdateIntervalRef.current = setInterval(async () => {
        try {
          const progress = getProgressFn();
          if (progress.currentTime > 0) {
            await updateProgress(
              movieId,
              progress.currentTime,
              progress.totalDuration,
            );
          }
        } catch (err) {
          console.error("Auto progress update failed:", err);
        }
      }, intervalMs);

      return () => {
        if (progressUpdateIntervalRef.current) {
          clearInterval(progressUpdateIntervalRef.current);
          progressUpdateIntervalRef.current = null;
        }
      };
    },
    [updateProgress],
  );

  // Dừng tracking tiến độ
  const stopProgressTracking = useCallback(() => {
    if (progressUpdateIntervalRef.current) {
      clearInterval(progressUpdateIntervalRef.current);
      progressUpdateIntervalRef.current = null;
    }

    activeSessionRef.current = null;
  }, []);

  // Lấy vị trí tiếp tục
  const getResumePosition = useCallback(
    async (movieId) => {
      if (!currentUserId || typeof currentUserId !== "string") {
        return { success: false, resumeTime: 0 };
      }

      if (!movieId) {
        return { success: false, resumeTime: 0 };
      }

      try {
        const result = await WatchingProgressService.getResumePosition(
          currentUserId,
          movieId.toString(),
        );

        if (result.status === "SUCCESS" || result.success) {
          return {
            success: true,
            resumeTime: result.resumeTime || 0,
            percentage: result.percentage || 0,
            lastWatched: result.lastWatched,
          };
        }

        return { success: false, resumeTime: 0 };
      } catch (err) {
        console.error("Error getting resume position:", err);
        return { success: false, resumeTime: 0 };
      }
    },
    [currentUserId],
  );

  // Đánh dấu hoàn thành
  const markCompleted = useCallback(
    async (movieId) => {
      if (!currentUserId) return false;

      try {
        const result = await WatchingProgressService.markCompleted(
          currentUserId,
          movieId,
        );

        if (result.status === "SUCCESS") {
          // Remove from watching list or mark as completed
          setWatchingList((prev) =>
            prev.filter((item) => item.movieId !== movieId.toString()),
          );

          toast.success("Đã đánh dấu hoàn thành");
          return true;
        }

        return false;
      } catch (err) {
        setError("Không thể đánh dấu hoàn thành");
        toast.error("Không thể đánh dấu hoàn thành");
        return false;
      }
    },
    [currentUserId],
  );

  // Xóa khỏi danh sách
  const removeFromWatching = useCallback(
    async (movieId) => {
      if (!currentUserId) return false;

      try {
        const result = await WatchingProgressService.removeFromWatching(
          currentUserId,
          movieId,
        );

        if (result.status === "SUCCESS" || result.success) {
          setWatchingList((prev) =>
            prev.filter((item) => item.movieId !== movieId.toString()),
          );

          toast.success("Đã xóa khỏi danh sách");
          return true;
        }

        return false;
      } catch (err) {
        setError("Không thể xóa phim");
        toast.error("Không thể xóa khỏi danh sách");
        return false;
      }
    },
    [currentUserId],
  );

  // Lấy thống kê
  const fetchStats = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    if (!currentUserId) return;

    try {
      const result = await WatchingProgressService.getStats(currentUserId);

      if (result.status === "SUCCESS") {
        setStats(result.data || {});
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [currentUserId, getAuthToken]);

  // Load data when component mounts or userId changes
  useEffect(() => {
    if (currentUserId) {
      fetchWatchingList();
      fetchStats();
    }
  }, [currentUserId, fetchWatchingList, fetchStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
    };
  }, [stopProgressTracking]);

  // View Tracking methods
  const trackView = useCallback(
    async (movieId, currentTime, totalDuration) => {
      if (!currentUserId || !viewTrackingEnabled) return false;

      try {
        await ViewTrackingService.trackView(
          currentUserId,
          movieId,
          currentTime,
          totalDuration,
        );
        await TrendingService.trackTrendingView(movieId, currentUserId);
        return true;
      } catch (error) {
        console.error("Manual view tracking failed:", error);
        return false;
      }
    },
    [currentUserId, viewTrackingEnabled],
  );

  const getViewCount = useCallback(async (movieId) => {
    try {
      const result = await ViewTrackingService.getViewCount(movieId);
      return result.viewCount || 0;
    } catch (error) {
      console.error("Error getting view count:", error);
      return 0;
    }
  }, []);

  const getBatchViewCounts = useCallback(async (movieIds) => {
    try {
      const result = await ViewTrackingService.getBatchViewCounts(movieIds);
      return result.viewCounts || {};
    } catch (error) {
      console.error("Error getting batch view counts:", error);
      return {};
    }
  }, []);

  // Trending methods
  const getTrendingMovies = useCallback(async (limit = 10) => {
    try {
      const result = await TrendingService.getTrendingMovies(limit);
      return result.trendingMovies || [];
    } catch (error) {
      console.error("Error getting trending movies:", error);
      return [];
    }
  }, []);

  const getTrendingStats = useCallback(async () => {
    try {
      const result = await TrendingService.getTrendingStats();
      return result.stats || {};
    } catch (error) {
      console.error("Error getting trending stats:", error);
      return {};
    }
  }, []);

  // Control methods
  const enableViewTracking = useCallback(() => {
    setViewTrackingEnabled(true);
  }, []);

  const disableViewTracking = useCallback(() => {
    setViewTrackingEnabled(false);
  }, []);

  return {
    watchingList,
    isLoading,
    error,
    stats,
    isAPIAvailable,
    viewTrackingEnabled,
    startWatching,
    updateProgress,
    markCompleted,
    removeFromWatching,
    getResumePosition,
    startProgressTracking,
    stopProgressTracking,
    refreshList: fetchWatchingList,
    refreshStats: fetchStats,
    activeSession: activeSessionRef.current,
    trackView,
    getViewCount,
    getBatchViewCounts,
    getTrendingMovies,
    getTrendingStats,
    enableViewTracking,
    disableViewTracking,
  };
};
