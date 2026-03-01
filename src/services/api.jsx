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
    } else {
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
            { withCredentials: true },
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
          localStorage.removeItem("user");
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const tryRequest = async (
  baseUrl,
  endpoint,
  options = {},
  maxRetries = 3,
) => {
  const fullUrl = `${baseUrl}${endpoint}`;
  const method = (options.method || "GET").toLowerCase();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let response;
      if (method === "get") {
        response = await api.get(endpoint, {
          ...options,
          timeout: 120000,
        });
      } else if (method === "post") {
        const { body, ...config } = options;
        response = await api.post(endpoint, body, {
          ...config,
          timeout: 120000,
        });
      } else if (method === "put") {
        response = await api.put(endpoint, options.body, {
          ...options,
          timeout: 120000,
        });
      } else if (method === "delete") {
        response = await api.delete(endpoint, {
          ...options,
          timeout: 120000,
        });
      } else {
        // fallback
        response = await api({ url: endpoint, ...options, timeout: 120000 });
      }

      if (response.data === undefined) {
        throw new Error(`No data returned from ${fullUrl}`);
      }

      // Allow null, false, empty object, empty array as valid responses
      // Only reject if response.data is undefined

      return { success: true, data: response.data };
    } catch (error) {
      const isTimeout =
        error.code === "ECONNABORTED" && error.message.includes("timeout");
      const isLastAttempt = attempt === maxRetries;
      if (isTimeout && !isLastAttempt) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (isLastAttempt) {
      }

      return { success: false, error };
    }
  }
};

export const fetchJson = async (
  endpoint,
  options = {},
  showRetryToast = false,
) => {
  let result = await tryRequest(API_BASE_URL, endpoint, options);
  if (!result.success) {
    throw result.error;
  }
  return result.data !== undefined ? result.data : result;
};

// Helper function for schedule-related APIs that might return null/false
export const fetchScheduleData = async (endpoint, defaultValue = null) => {
  try {
    const data = await fetchJson(endpoint);
    return data !== null && data !== undefined ? data : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

// Các hàm fetch khác giữ nguyên
export const fetchMovies = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const data = await fetchJson("/api/movies");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
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
    return [];
  }
};

export const fetchCountries = async () => {
  try {
    const data = await fetchJson("/api/countries");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    return [];
  }
};

export const fetchMovieType = async () => {
  try {
    const data = await fetchJson("/api/types");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    return [];
  }
};

export const fetchMoviesByCategory = (categoryName) =>
  fetchJson(`/api/movies/category/${encodeURIComponent(categoryName)}`).catch(
    () => [],
  );

export const fetchMovieByHot = async () => {
  try {
    const data = await fetchJson("/api/movies/hot");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    return [];
  }
};

export const fetchMovieByCategoryId = async (categoryId) => {
  try {
    const data = await fetchJson(
      `/api/movies/category/id/${encodeURIComponent(categoryId)}`,
    );
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    return [];
  }
};

export const fetchMoviesByCountryAndCategory = async (
  countryName,
  categoryName,
) => {
  try {
    const data = await fetchJson(
      `/api/movies/country/${encodeURIComponent(
        countryName,
      )}/category/${encodeURIComponent(categoryName)}`,
    );
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    return [];
  }
};

export const fetchMoviesByName = async (name) => {
  try {
    const data = await fetchJson(
      `/api/movies/search/${encodeURIComponent(name)}`,
    );
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
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
      { withCredentials: true },
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// Watchlist API functions
export const addToWatchlist = async (movieId) => {
  try {
    const response = await api.post(`/api/watchlist/add/${movieId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeFromWatchlist = async (movieId) => {
  try {
    const response = await api.delete(`/api/watchlist/remove/${movieId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWatchlist = async () => {
  try {
    const response = await api.get("/api/watchlist");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    return [];
  }
};

export const checkIsInWatchlist = async (movieId) => {
  try {
    const response = await api.get(`/api/watchlist/check/${movieId}`);
    return response.data;
  } catch (error) {
    return false;
  }
};

// Admin delete functions
export const deleteMovie = async (id) => {
  try {
    const response = await api.delete(`/api/movies/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await api.delete(`/api/categories/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCountry = async (id) => {
  try {
    const response = await api.delete(`/api/countries/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteType = async (id) => {
  try {
    const response = await api.delete(`/api/movie-types/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/api/users/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
