// services/ViewTrackingService.js
class ViewTrackingService {
  constructor() {
    // Use environment variable for deployed backend
    const baseApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
    this.baseURL = `${baseApiUrl}/api/view-tracking`;
  }

  // Track view manually (usually handled automatically through hybrid watching)
  async trackView(userId, movieId, currentTime, totalDuration) {
    if (!userId || !movieId) {
      throw new Error("userId and movieId are required");
    }

    try {
      const response = await fetch(`${this.baseURL}/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          userId: userId.toString(),
          movieId: movieId.toString(),
          currentTime: currentTime || 0,
          totalDuration: totalDuration || 7200,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `ViewTracking API failed: ${response.status} ${errorText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get view count for a single movie
  async getViewCount(movieId) {
    if (!movieId) {
      throw new Error("movieId is required");
    }

    try {
      const response = await fetch(`${this.baseURL}/count/${movieId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `ViewCount API failed: ${response.status} ${errorText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get view counts for multiple movies (batch)
  async getBatchViewCounts(movieIds) {
    if (!Array.isArray(movieIds) || movieIds.length === 0) {
      throw new Error("movieIds array is required");
    }

    try {
      const response = await fetch(`${this.baseURL}/batch-count`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          movieIds: movieIds.map((id) => id.toString()),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Batch ViewCount API failed: ${response.status} ${errorText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
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
}

export default new ViewTrackingService();
