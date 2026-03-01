// services/WatchingProgressService.js
class WatchingProgressService {
  constructor() {
    // Use environment variable for deployed backend
    const baseApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
    this.baseURL = `${baseApiUrl}/api/hybrid-watching`;
  }

  // Bắt đầu xem phim
  async startWatching(userId, movieId, movieTitle, totalDuration = 7200) {
    // Validate inputs
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid userId provided");
    }
    if (!movieId || typeof movieId !== "string") {
      throw new Error("Invalid movieId provided");
    }

    try {
      const response = await fetch(`${this.baseURL}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          userId: userId.toString(),
          movieId: movieId.toString(),
          movieTitle,
          totalDuration,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Hybrid start API failed: ${response.status} ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thời gian xem
  async updateProgress(userId, movieId, currentTime, totalDuration) {
    // Validate inputs
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid userId provided");
    }
    if (!movieId || typeof movieId !== "string") {
      throw new Error("Invalid movieId provided");
    }

    // Calculate percentage on frontend
    const calculatedPercentage =
      totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

    const payload = {
      userId: userId.toString(),
      movieId: movieId.toString(),
      currentTime: Math.round(currentTime),
      totalDuration: Math.round(totalDuration),
    };

    try {
      const response = await fetch(`${this.baseURL}/update-time`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(
          `Hybrid update progress API failed with status: ${response.status}`,
        );
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`,
        };
      }

      const result = await response.json();

      // Add frontend calculated percentage to result
      result.frontendPercentage = Math.round(calculatedPercentage * 100) / 100;
      result.progressInfo = {
        currentTime: Math.round(currentTime),
        totalDuration: Math.round(totalDuration),
        percentage: Math.round(calculatedPercentage * 100) / 100,
      };

      return result;
    } catch (error) {
      console.error("Error updating progress:", error);
      // Don't throw for progress updates, just log error
      return { success: false, error: error.message };
    }
  }

  // Lấy danh sách đang xem
  async getWatchingList(userId) {
    // Validate userId
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid userId provided");
    }

    try {
      const response = await fetch(
        `${this.baseURL}/watching-list/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Hybrid watching list API failed: ${response.status} ${errorText}`,
        );
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  // Lấy vị trí tiếp tục
  async getResumePosition(userId, movieId) {
    // Validate inputs
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid userId provided");
    }
    if (!movieId || typeof movieId !== "string") {
      throw new Error("Invalid movieId provided");
    }

    try {
      const response = await fetch(
        `${this.baseURL}/resume/${encodeURIComponent(userId)}/${encodeURIComponent(movieId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`,
          },
        },
      );

      if (!response.ok) {
        console.warn(
          `Hybrid resume position API failed with status: ${response.status}`,
        );
        return { success: false, resumeTime: 0 }; // Safe fallback
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting resume position:", error);
      return { success: false, resumeTime: 0 }; // Safe fallback
    }
  }

  // Đánh dấu hoàn thành
  async markCompleted(userId, movieId) {
    try {
      const response = await fetch(`${this.baseURL}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          userId: userId.toString(),
          movieId: movieId.toString(),
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("Error marking as completed:", error);
      throw error;
    }
  }

  // Xóa khỏi danh sách
  async removeFromWatching(userId, movieId) {
    try {
      const response = await fetch(
        `${this.baseURL}/remove?userId=${userId}&movieId=${movieId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.getToken()}`,
          },
        },
      );

      return await response.json();
    } catch (error) {
      console.error("Error removing from watching:", error);
      throw error;
    }
  }

  // Lấy thống kê
  async getStats(userId) {
    // Validate userId
    if (!userId || typeof userId !== "string") {
      console.warn("Invalid userId for stats, skipping...");
      return { status: "ERROR", data: {} };
    }

    try {
      const response = await fetch(
        `${this.baseURL}/stats/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`,
          },
        },
      );

      if (!response.ok) {
        // Stats is not critical, just return empty data
        return { status: "ERROR", data: {} };
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Stats is not critical, return empty data instead of throwing
      return { status: "ERROR", data: {} };
    }
  }

  // Test hệ thống
  async testSystem() {
    try {
      const response = await fetch(`${this.baseURL}/test`);
      return await response.json();
    } catch (error) {
      console.error("Error testing system:", error);
      throw error;
    }
  }

  // Helper method để lấy token
  getToken() {
    return (
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }

  // Helper method để format data
  formatWatchingData(data) {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      movieId: item.movieId?.toString() || "",
      movieTitle: item.movieTitle || "",
      currentTime: item.currentTime || 0,
      totalDuration: item.totalDuration || 7200,
      percentage: item.percentage || 0,
      lastWatched: item.lastWatched || new Date().toISOString(),
      moviePoster: item.moviePoster || "",
      episodeNumber: item.episodeNumber,
      totalEpisodes: item.totalEpisodes,
      isCompleted: item.isCompleted || false,
      source: item.source || "hybrid",
    }));
  }
}

export default new WatchingProgressService();
