import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import LocalWatchingService from "../services/LocalWatchingService";
import RedisWatchingService from "../services/RedisWatchingService";

export const useStartWatching = () => {
  const redisService = useMemo(() => new RedisWatchingService(), []);

  const startWatchingMovie = useCallback(
    async (movieId, movieTitle, userId, duration = 7200) => {
      if (!userId || !movieId || !movieTitle) {
        return { success: false, error: "Missing required parameters" };
      }

      const totalDuration = Math.round(Number(duration) || 7200);

      try {
        const redisResult = await redisService.startWatching(
          userId,
          movieId,
          movieTitle,
          totalDuration,
        );

        if (redisResult.success) {
          // Cache to local for backup only
          LocalWatchingService.cacheSession({
            userId,
            movieId,
            movieTitle,
            totalDuration,
            resumeTime: redisResult.resumeTime || 0,
            isFromRedis: true,
          });

          return {
            success: true,
            source: redisResult.source || "redis",
            data: redisResult.data,
            resumeTime: redisResult.resumeTime || 0,
            isFromResume: redisResult.isFromResume || false,
          };
        }
      } catch (error) {
        if (error.response?.status !== 500) {
          console.warn("Redis service unavailable, using local fallback");
        }
      }

      // Fallback to local tracking
      try {
        const localSession = LocalWatchingService.startWatchingSession(
          userId,
          movieId,
          movieTitle,
          totalDuration,
        );

        return localSession
          ? {
              success: true,
              source: "local",
              data: localSession,
              resumeTime: 0,
              isFromResume: false,
            }
          : { success: false, error: "Local session failed" };
      } catch (localError) {
        toast.error("Cannot track viewing progress");
        return { success: false, error: localError.message };
      }
    },
    [redisService],
  );

  const updateWatchingProgress = useCallback(
    async (userId, movieId, currentTime, totalDuration) => {
      if (!userId || !movieId || typeof currentTime !== "number") {
        return { success: false, error: "Invalid parameters" };
      }

      try {
        const redisResult = await redisService.updateProgress(
          userId,
          movieId,
          Math.round(currentTime),
          Math.round(totalDuration),
        );

        if (redisResult.success) {
          LocalWatchingService.updateProgress(
            movieId,
            currentTime,
            totalDuration,
          );
          return { success: true, source: "redis" };
        }
      } catch (error) {
        // Silent fallback for Redis errors
      }

      try {
        const localResult = LocalWatchingService.updateProgress(
          movieId,
          currentTime,
          totalDuration,
        );
        return { success: !!localResult, source: "local" };
      } catch (error) {
        return { success: false, source: "local", error: error.message };
      }
    },
    [redisService],
  );

  const getContinueWatching = useCallback(
    async (userId) => {
      try {
        // Try Redis first
        const redisResult = await redisService.getContinueWatchingList(userId);
        if (redisResult.success && redisResult.data?.length > 0) {
          return redisResult.data;
        }
      } catch (error) {
        console.warn("⚠️ Redis getContinueWatching failed:", error.message);
      }

      // Fallback to local
      try {
        return LocalWatchingService.getContinueWatchingList(userId);
      } catch (error) {
        console.error("❌ Error getting continue watching list:", error);
        return [];
      }
    },
    [redisService],
  );

  const getWatchingStats = useCallback(() => {
    try {
      const localStats = LocalWatchingService.getStorageStats();
      const redisStats = redisService.getSyncStats();

      return {
        ...localStats,
        redis: redisStats,
      };
    } catch (error) {
      console.error("❌ Error getting watching stats:", error);
      return {};
    }
  }, [redisService]);

  const stopWatchingSession = useCallback(
    (movieId) => {
      try {
        // Stop Redis sync
        redisService.stopProgressSync();

        // End local session
        LocalWatchingService.endCurrentSession();

        console.log("🛑 Watching session stopped:", movieId);
        return true;
      } catch (error) {
        console.error("❌ Error stopping watching session:", error);
        return false;
      }
    },
    [redisService],
  );

  const markAsCompleted = useCallback(
    async (userId, movieId) => {
      try {
        // Try Redis first
        const redisResult = await redisService.markAsCompleted(userId, movieId);

        // Also mark local as completed
        LocalWatchingService.markAsCompleted(movieId);

        return redisResult.success || true; // Local always succeeds
      } catch (error) {
        console.error("❌ Error marking as completed:", error);
        return false;
      }
    },
    [redisService],
  );

  const removeFromWatchingList = useCallback(
    async (userId, movieId) => {
      try {
        // Try Redis first
        const redisResult = await redisService.removeFromWatching(
          userId,
          movieId,
        );

        // Also remove from local
        LocalWatchingService.removeFromContinueWatching(movieId);

        return redisResult.success || true; // Local always succeeds
      } catch (error) {
        console.error("❌ Error removing from watching list:", error);
        return false;
      }
    },
    [redisService],
  );

  const getResumeInfo = useCallback(
    async (userId, movieId) => {
      try {
        // Try Redis first
        const redisResult = await redisService.getResumeInfo(userId, movieId);

        if (redisResult.success) {
          return redisResult;
        }
      } catch (error) {
        console.warn("⚠️ Redis resume info failed:", error.message);
      }

      // Fallback to local
      try {
        const localInfo = LocalWatchingService.getResumeInfo(userId, movieId);
        return {
          success: true,
          currentTime: localInfo?.currentTime || 0,
          source: "local",
        };
      } catch (error) {
        console.error("❌ Local resume info failed:", error);
        return { success: false, currentTime: 0 };
      }
    },
    [redisService],
  );

  const clearAllUserData = useCallback(
    (userId) => {
      try {
        console.log("🧹 Clearing all watching data for user:", userId);

        // Stop Redis sync
        redisService.stopProgressSync();

        // Clear all localStorage data related to watching
        LocalWatchingService.resetAllData();

        // Clear any stored sessions
        localStorage.removeItem("wemovies_current_session");
        localStorage.removeItem("wemovies_local_watching");
        localStorage.removeItem("wemovies_retry_queue");

        console.log("✅ All watching data cleared");
        return true;
      } catch (error) {
        console.error("❌ Error clearing user data:", error);
        return false;
      }
    },
    [redisService],
  );

  const validateUserSession = useCallback((userId, movieId) => {
    try {
      const currentSession = LocalWatchingService.getCurrentSession();
      if (currentSession && currentSession.userId !== userId) {
        console.warn("⚠️ Session user mismatch, clearing old session");
        LocalWatchingService.endCurrentSession();
        return false;
      }
      return true;
    } catch (error) {
      console.error("❌ Error validating user session:", error);
      return false;
    }
  }, []);

  return {
    startWatchingMovie,
    updateWatchingProgress,
    getContinueWatching,
    getWatchingStats,
    stopWatchingSession,
    markAsCompleted,
    removeFromWatchingList,
    getResumeInfo,
    clearAllUserData,
    validateUserSession,
  };
};
