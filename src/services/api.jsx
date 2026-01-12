import axios from "axios";

const API_BASE_URL = import.meta.env.DEV
  ? "https://wemovies-backend.onrender.com"
  : import.meta.env.VITE_API_URL;

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Quan trọng: gửi cookies
});

// Interceptor để tự động thêm Authorization header
api.interceptors.request.use((config) => {
  // Không thêm header cho login và một số endpoints public
  const publicEndpoints = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/google",
    "/api/auth/request-otp",
    "/api/auth/verify-otp",
  ];

  if (!publicEndpoints.some((endpoint) => config.url.includes(endpoint))) {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      // Sử dụng Authorization header - đơn giản và hiệu quả
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Set Authorization header for:", config.url);
    } else {
      console.log("⚠️ No JWT token found for protected endpoint:", config.url);
    }
  }

  return config;
});

// Interceptor để handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, thử refresh
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {
              refreshToken,
            },
            { withCredentials: true }
          );

          if (refreshResponse.data.accessToken) {
            localStorage.setItem("jwtToken", refreshResponse.data.accessToken);
            // Retry original request
            error.config.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            return api.request(error.config);
          }
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("refreshToken");
          console.log("Redirecting to homepage due to authentication failure");
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const tryRequest = async (
  baseUrl,
  endpoint,
  options = {},
  maxRetries = 3
) => {
  const fullUrl = `${baseUrl}${endpoint}`;
  const method = (options.method || "GET").toLowerCase();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} for ${fullUrl}`);

      let response;
      if (method === "get") {
        response = await axios.get(fullUrl, {
          ...options,
          withCredentials: true,
          timeout: 120000,
        });
      } else if (method === "post") {
        const { body, ...config } = options;
        response = await axios.post(fullUrl, body, {
          ...config,
          withCredentials: true,
          timeout: 120000,
        });
      } else if (method === "put") {
        response = await axios.put(fullUrl, options.body, {
          ...options,
          withCredentials: true,
          timeout: 120000,
        });
      } else if (method === "delete") {
        response = await axios.delete(fullUrl, {
          ...options,
          withCredentials: true,
          timeout: 120000,
        });
      } else {
        // fallback
        response = await axios({ url: fullUrl, ...options, timeout: 120000 });
      }

      if (!response.data) {
        throw new Error(`No data returned from ${fullUrl}`);
      }

      console.log(`✅ Success on attempt ${attempt} for ${fullUrl}`);
      return { success: true, data: response.data };
    } catch (error) {
      const isTimeout =
        error.code === "ECONNABORTED" && error.message.includes("timeout");
      const isLastAttempt = attempt === maxRetries;

      console.log(
        `❌ Attempt ${attempt} failed for ${fullUrl}:`,
        error.message
      );

      if (isTimeout && !isLastAttempt) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(
          `⏳ Retrying in ${delay / 1000}s... (Server might be sleeping)`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (isLastAttempt) {
        console.log(`💥 All ${maxRetries} attempts failed for ${fullUrl}`);
      }

      return { success: false, error };
    }
  }
};

export const fetchJson = async (
  endpoint,
  options = {},
  showRetryToast = false
) => {
  let result = await tryRequest(API_BASE_URL, endpoint, options);
  if (!result.success) {
    console.error(`Request failed`);
    throw result.error;
  }
  return result.data !== undefined ? result.data : result;
};

// Các hàm fetch khác giữ nguyên
export const fetchMovies = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const data = await fetchJson("/api/movies");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch movies failed:", error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchCategories = async () => {
  try {
    const data = await fetchJson("/api/categories");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch categories failed:", error);
    return [];
  }
};

export const fetchCountries = async () => {
  try {
    const data = await fetchJson("/api/countries");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch countries failed:", error);
    return [];
  }
};

export const fetchMovieType = async () => {
  try {
    const data = await fetchJson("/api/types");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch movie type failed:", error);
    return [];
  }
};

export const fetchMoviesByCategory = (categoryName) =>
  fetchJson(`/api/movies/category/${encodeURIComponent(categoryName)}`).catch(
    () => []
  );

export const fetchMovieByHot = async () => {
  try {
    const data = await fetchJson("/api/movies/hot");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch hot movies failed:", error);
    return [];
  }
};

export const fetchMovieByCategoryId = async (categoryId) => {
  try {
    const data = await fetchJson(
      `/api/movies/category/id/${encodeURIComponent(categoryId)}`
    );
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch movies by category ID failed:", error);
    return [];
  }
};

export const fetchMoviesByCountryAndCategory = async (
  countryName,
  categoryName
) => {
  try {
    const data = await fetchJson(
      `/api/movies/country/${encodeURIComponent(
        countryName
      )}/category/${encodeURIComponent(categoryName)}`
    );
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch movies by country and category failed:", error);
    return [];
  }
};

export const fetchMoviesByName = async (name) => {
  try {
    const data = await fetchJson(
      `/api/movies/search/${encodeURIComponent(name)}`
    );
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch movies by name failed:", error);
    return [];
  }
};

export const fetchUsers = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await api.get("/api/user");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    return response;
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

// Watchlist API functions
export const addToWatchlist = async (movieId) => {
  try {
    const response = await api.post(`/api/watchlist/add/${movieId}`);
    return response.data;
  } catch (error) {
    console.error("Add to watchlist failed:", error);
    throw error;
  }
};

export const removeFromWatchlist = async (movieId) => {
  try {
    const response = await api.delete(`/api/watchlist/remove/${movieId}`);
    return response.data;
  } catch (error) {
    console.error("Remove from watchlist failed:", error);
    throw error;
  }
};

export const getWatchlist = async () => {
  try {
    const response = await api.get("/api/watchlist");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Get watchlist failed:", error);
    return [];
  }
};

export const checkIsInWatchlist = async (movieId) => {
  try {
    const response = await api.get(`/api/watchlist/check/${movieId}`);
    return response.data;
  } catch (error) {
    console.error("Check watchlist failed:", error);
    return false;
  }
};

// Admin delete functions
export const deleteMovie = async (id) => {
  try {
    const response = await api.delete(`/api/movies/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete movie failed:", error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/api/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete category failed:", error);
    throw error;
  }
};

export const deleteCountry = async (id) => {
  try {
    const response = await api.delete(`/api/countries/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete country failed:", error);
    throw error;
  }
};

export const deleteType = async (id) => {
  try {
    const response = await api.delete(`/api/movie-types/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete type failed:", error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/api/users/delete/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete user failed:", error);
    throw error;
  }
};
