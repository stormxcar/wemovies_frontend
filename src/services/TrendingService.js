// services/TrendingService.js
class TrendingService {
  constructor() {
    // Use environment variable for deployed backend
    const baseApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
    this.baseURL = `${baseApiUrl}/api/trending`;
  }

  // Get trending movies
  async getTrendingMovies(limit = 10, includeDetails = false) {
    try {
      const response = await fetch(
        `${this.baseURL}/movies?limit=${limit}&includeDetails=${includeDetails}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.getToken()}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Trending API failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Track hourly view for trending calculation
  async trackTrendingView(movieId, userId) {
    if (!movieId || !userId) {
      throw new Error("movieId and userId are required");
    }

    try {
      const response = await fetch(`${this.baseURL}/track-view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({
          movieId: movieId.toString(),
          userId: userId.toString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Trending track view API failed: ${response.status} ${errorText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get trending statistics
  async getTrendingStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Trending stats API failed: ${response.status} ${errorText}`,
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

export default new TrendingService();
