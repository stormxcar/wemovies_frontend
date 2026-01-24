import { useEffect, useRef } from "react";
import { fetchJson } from "../services/api";
import { toast } from "react-hot-toast";

export const useWatchingTracker = (
  movieId,
  movieTitle,
  userId,
  isAuthenticated,
) => {
  const watchingSessionRef = useRef(null);
  const updateIntervalRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);

  // Start watching session
  const startWatching = async (totalDuration) => {
    if (!isAuthenticated || !userId || !movieId) {
      console.warn("⚠️ Skip watching tracker - missing required data:", {
        isAuthenticated,
        userId,
        movieId,
      });
      return;
    }

    try {
      // 🔍 FIRST: Check if there's existing resume info
      console.log("🔍 Checking for existing resume info...");

      try {
        const resumeResponse = await fetchJson(
          `/api/redis-watching/resume/${encodeURIComponent(userId)}/${encodeURIComponent(movieId)}`,
          { method: "GET" },
        );

        if (
          resumeResponse?.status === "SUCCESS" &&
          resumeResponse.resumeTime !== undefined
        ) {
          console.log("🎯 Found existing watching session:", resumeResponse);

          // Return existing session info without creating new one
          watchingSessionRef.current = {
            movieId,
            movieTitle,
            userId,
            resumeTime: resumeResponse.resumeTime,
            totalDuration:
              resumeResponse.totalDuration ||
              Math.round(Number(totalDuration) || 7200),
            percentage: resumeResponse.percentage || 0,
            lastWatched: resumeResponse.lastWatched,
            isFromResume: true,
          };

          console.log("✅ Resumed existing watching session");
          return {
            success: true,
            source: "redis-resume",
            resumeTime: resumeResponse.resumeTime,
            session: watchingSessionRef.current,
          };
        }
      } catch (resumeError) {
        console.log("ℹ️ No existing session found, creating new one");
      }

      // 🆕 If no resume info, create NEW session
      console.log("🎬 Starting NEW watching session:", {
        userId,
        movieId,
        movieTitle,
        totalDuration: Math.round(totalDuration),
      });

      const payload = {
        userId,
        movieId,
        movieTitle,
        totalDuration: Math.round(Number(totalDuration) || 7200),
      };

      const response = await fetchJson("/api/redis-watching/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response?.status === "SUCCESS" || response?.success) {
        // Store new session info
        watchingSessionRef.current = {
          movieId,
          movieTitle,
          userId,
          resumeTime: 0, // New session starts at 0
          totalDuration: Math.round(Number(totalDuration) || 7200),
          percentage: 0,
          startedAt: new Date().toISOString(),
          isFromResume: false,
        };

        console.log("✅ New watching session created");
        return {
          success: true,
          source: "redis-new",
          resumeTime: 0,
          session: watchingSessionRef.current,
        };
      } else {
        console.warn("⚠️ Watching session response not successful:", response);
        return { success: false, error: "Failed to create session" };
      }
    } catch (error) {
      console.error("❌ Lỗi khi bắt đầu theo dõi:", {
        error: error.message,
        status: error.response?.status,
        userId,
        movieId,
      });
      // Don't show error toast for 500 errors
      if (error.response?.status !== 500) {
        console.warn("Failed to start Redis watching session");
      }
      return {
        success: false,
        error: error.message,
        source: "redis-error",
      };
    }
  };

  // Update watching progress
  const updateProgress = async (
    currentTime,
    totalDuration,
    episodeInfo = {},
  ) => {
    if (!watchingSessionRef.current || !isAuthenticated || !userId) return;

    // Only update every 30 seconds to avoid spam
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 30000) return;
    lastUpdateTimeRef.current = now;

    try {
      const payload = {
        movieId,
        currentTime: Math.round(currentTime),
        totalDuration: Math.round(totalDuration),
        ...episodeInfo,
      };

      await fetchJson(`/api/redis-watching/progress?userId=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log(
        `📊 Cập nhật tiến độ: ${((currentTime / totalDuration) * 100).toFixed(
          1,
        )}%`,
      );
    } catch (error) {
      console.error("❌ Lỗi cập nhật tiến độ:", error);
    }
  };

  // Stop watching session
  const stopWatching = async () => {
    if (!watchingSessionRef.current || !isAuthenticated || !userId) return;

    try {
      await fetchJson(
        `/api/redis-watching/stop?userId=${userId}&movieId=${movieId}`,
        {
          method: "DELETE",
        },
      );

      watchingSessionRef.current = false;
      console.log("⏹️ Dừng theo dõi tiến độ xem phim");
    } catch (error) {
      console.error("❌ Lỗi khi dừng theo dõi:", error);
    }
  };

  // Auto-update interval
  const startUpdateInterval = (videoElement) => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(() => {
      if (videoElement && !videoElement.paused && !videoElement.ended) {
        updateProgress(videoElement.currentTime, videoElement.duration);
      }
    }, 30000); // Update every 30 seconds
  };

  const stopUpdateInterval = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUpdateInterval();
      if (watchingSessionRef.current) {
        stopWatching();
      }
    };
  }, []);

  return {
    startWatching,
    updateProgress,
    stopWatching,
    startUpdateInterval,
    stopUpdateInterval,
    isWatchingActive: !!watchingSessionRef.current,
  };
};
