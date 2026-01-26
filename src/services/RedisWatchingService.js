import { fetchJson } from "../services/api";

class RedisWatchingService {
  constructor() {
    this.API_BASE = "/api/redis-watching";
    this.pendingUpdates = new Map();
  }

  async startWatching(userId, movieId, movieTitle, totalDuration = 7200) {
    try {
      try {
        const resumeInfo = await this.getResumeInfo(userId, movieId);

        if (resumeInfo.success && resumeInfo.data.resumeTime !== undefined) {
          return {
            success: true,
            data: resumeInfo.data,
            sessionId: `${userId}-${movieId}`,
            source: "redis-resume",
            resumeTime: resumeInfo.data.resumeTime,
            isFromResume: true,
          };
        }
      } catch (resumeError) {
        // No existing session, continue with new session
      }

      const payload = {
        userId,
        movieId,
        movieTitle,
        totalDuration,
      };

      const response = await fetchJson("/api/redis-watching/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response?.status === "SUCCESS") {
        return {
          success: true,
          data: response.watchingDetail || response.data,
          sessionId: `${userId}-${movieId}`,
          source: "redis-new",
          resumeTime: 0,
          isFromResume: false,
        };
      }

      throw new Error(response?.message || "Failed to start session");
    } catch (error) {
      if (error.response?.status !== 500) {
      }
      throw error;
    }
  }

  async updateProgress(userId, movieId, currentTime, totalDuration) {
    const payload = {
      userId,
      movieId,
      currentTime,
      totalDuration,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetchJson("/api/redis-watching/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return {
        success: response?.status === "SUCCESS",
        data: response?.data || {},
        source: "redis",
      };
    } catch (error) {
      return { success: false, error: error.message, source: "redis" };
    }
  }

  async getResumeInfo(userId, movieId) {
    try {
      const response = await fetchJson(
        `/api/redis-watching/resume/${userId}/${movieId}`,
      );

      if (response?.status === "SUCCESS" && response?.data) {
        return {
          success: true,
          data: {
            resumeTime: response.data.currentTime || 0,
            watchPercentage: response.data.watchPercentage || 0,
            lastUpdate: response.data.lastUpdate,
            totalDuration: response.data.totalDuration,
          },
          source: "redis",
        };
      }

      return {
        success: false,
        data: { resumeTime: 0 },
        error: "No resume data found",
        source: "redis",
      };
    } catch (error) {
      return {
        success: false,
        data: { resumeTime: 0 },
        error: error.message,
        source: "redis",
      };
    }
  }

  async stopWatching(userId, movieId) {
    try {
      const response = await fetchJson("/api/redis-watching/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, movieId }),
      });

      return {
        success: response?.status === "SUCCESS",
        source: "redis",
      };
    } catch (error) {
      return { success: false, error: error.message, source: "redis" };
    }
  }

  async getWatchingHistory(userId, limit = 10) {
    try {
      const response = await fetchJson(
        `/api/redis-watching/history/${userId}?limit=${limit}`,
      );

      if (response?.status === "SUCCESS") {
        return {
          success: true,
          data: response.data || [],
          source: "redis",
        };
      }

      return {
        success: false,
        data: [],
        error: response?.message || "History not available",
        source: "redis",
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error.message,
        source: "redis",
      };
    }
  }

  validateSession(userId, movieId) {
    return userId && movieId;
  }
}

export default RedisWatchingService;
