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

const MOVIE_DEFAULT_PAGE = 0;
const MOVIE_DEFAULT_SIZE = 20;
const MOVIE_DEFAULT_SORT_BY = "createdAt";
const MOVIE_DEFAULT_SORT_DIR = "desc";
const MOVIE_ALLOWED_SORT_FIELDS = new Set([
  "title",
  "createdAt",
  "updatedAt",
  "views",
  "release_year",
  "hot",
  "duration",
]);

const normalizeSortBy = (sortBy) => {
  const value = typeof sortBy === "string" ? sortBy.trim() : "";
  return MOVIE_ALLOWED_SORT_FIELDS.has(value) ? value : MOVIE_DEFAULT_SORT_BY;
};

const normalizeSortDir = (sortDir) => {
  const value = String(sortDir || "").toLowerCase();
  return value === "asc" ? "asc" : "desc";
};

const buildMovieQuery = (params = {}) => {
  const query = new URLSearchParams();
  const page = Number.isFinite(Number(params.page))
    ? Math.max(0, Number(params.page))
    : MOVIE_DEFAULT_PAGE;
  const size = Number.isFinite(Number(params.size))
    ? Math.max(1, Number(params.size))
    : MOVIE_DEFAULT_SIZE;

  query.set("page", String(page));
  query.set("size", String(size));

  if (params.sortBy !== undefined) {
    query.set("sortBy", normalizeSortBy(params.sortBy));
  }

  if (params.sortDir !== undefined) {
    query.set("sortDir", normalizeSortDir(params.sortDir));
  }

  if (typeof params.keyword === "string" && params.keyword.trim()) {
    query.set("keyword", params.keyword.trim());
  }

  return query.toString();
};

const unwrapPayload = (response) => {
  if (response && typeof response === "object" && "data" in response) {
    return response.data;
  }
  return response;
};

export const normalizeMoviesPageResponse = (
  response,
  fallback = { page: MOVIE_DEFAULT_PAGE, size: MOVIE_DEFAULT_SIZE },
) => {
  const payload = unwrapPayload(response);

  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: fallback.page,
      size: fallback.size,
      totalItems: payload.length,
      totalPages: payload.length > 0 ? 1 : 0,
      hasNext: false,
      hasPrevious: false,
    };
  }

  if (Array.isArray(payload?.items)) {
    return {
      items: payload.items,
      page: Number.isFinite(Number(payload.page))
        ? Number(payload.page)
        : fallback.page,
      size: Number.isFinite(Number(payload.size))
        ? Number(payload.size)
        : fallback.size,
      totalItems: Number.isFinite(Number(payload.totalItems))
        ? Number(payload.totalItems)
        : payload.items.length,
      totalPages: Number.isFinite(Number(payload.totalPages))
        ? Number(payload.totalPages)
        : payload.items.length > 0
          ? 1
          : 0,
      hasNext: Boolean(payload.hasNext),
      hasPrevious: Boolean(payload.hasPrevious),
    };
  }

  if (Array.isArray(payload?.data)) {
    return {
      items: payload.data,
      page: fallback.page,
      size: fallback.size,
      totalItems: payload.data.length,
      totalPages: payload.data.length > 0 ? 1 : 0,
      hasNext: false,
      hasPrevious: false,
    };
  }

  return {
    items: [],
    page: fallback.page,
    size: fallback.size,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };
};

export const extractMovieItems = (response, fallback) =>
  normalizeMoviesPageResponse(response, fallback).items;

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
const MOVIES_CACHE_TTL_MS = 60 * 1000;
const MOVIES_FETCH_TIMEOUT_MS = 45000;
const moviesCacheStore = new Map();
const moviesPromiseStore = new Map();

export const fetchMoviesPage = async (options = {}) => {
  const page = Number.isFinite(Number(options.page))
    ? Math.max(0, Number(options.page))
    : MOVIE_DEFAULT_PAGE;
  const size = Number.isFinite(Number(options.size))
    ? Math.max(1, Number(options.size))
    : MOVIE_DEFAULT_SIZE;
  const sortBy = normalizeSortBy(options.sortBy ?? MOVIE_DEFAULT_SORT_BY);
  const sortDir = normalizeSortDir(options.sortDir ?? MOVIE_DEFAULT_SORT_DIR);

  const query = buildMovieQuery({ page, size, sortBy, sortDir });
  const endpoint = `/api/movies?${query}`;

  const data = await fetchJson(endpoint, { timeout: MOVIES_FETCH_TIMEOUT_MS });

  return normalizeMoviesPageResponse(data, { page, size });
};

export const fetchMovies = async (options = {}) => {
  const { forceRefresh = false } = options;
  const page = Number.isFinite(Number(options.page))
    ? Math.max(0, Number(options.page))
    : MOVIE_DEFAULT_PAGE;
  const size = Number.isFinite(Number(options.size))
    ? Math.max(1, Number(options.size))
    : MOVIE_DEFAULT_SIZE;
  const sortBy = normalizeSortBy(options.sortBy ?? MOVIE_DEFAULT_SORT_BY);
  const sortDir = normalizeSortDir(options.sortDir ?? MOVIE_DEFAULT_SORT_DIR);
  const cacheKey = `${page}:${size}:${sortBy}:${sortDir}`;
  const now = Date.now();
  const cacheEntry = moviesCacheStore.get(cacheKey);

  if (
    !forceRefresh &&
    cacheEntry &&
    Array.isArray(cacheEntry.items) &&
    now - cacheEntry.time < MOVIES_CACHE_TTL_MS
  ) {
    return cacheEntry.items;
  }

  if (!forceRefresh && moviesPromiseStore.has(cacheKey)) {
    return moviesPromiseStore.get(cacheKey);
  }

  const pendingPromise = (async () => {
    try {
      const moviesPage = await fetchMoviesPage({ page, size, sortBy, sortDir });
      const movies = Array.isArray(moviesPage.items) ? moviesPage.items : [];
      moviesCacheStore.set(cacheKey, {
        items: movies,
        time: Date.now(),
      });
      return movies;
    } catch (error) {
      if (cacheEntry && Array.isArray(cacheEntry.items)) {
        return cacheEntry.items;
      }
      return [];
    } finally {
      moviesPromiseStore.delete(cacheKey);
    }
  })();

  moviesPromiseStore.set(cacheKey, pendingPromise);

  return pendingPromise;
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

export const fetchMoviesByCategory = async (categoryName, options = {}) => {
  try {
    const query = buildMovieQuery({
      page: options.page,
      size: options.size,
      sortBy: options.sortBy,
      sortDir: options.sortDir,
    });
    const response = await fetchJson(
      `/api/movies/category/${encodeURIComponent(categoryName)}?${query}`,
    );
    return extractMovieItems(response, {
      page: Number(options.page) || MOVIE_DEFAULT_PAGE,
      size: Number(options.size) || MOVIE_DEFAULT_SIZE,
    });
  } catch {
    return [];
  }
};

export const fetchMovieByHot = async (options = {}) => {
  try {
    const query = buildMovieQuery({
      page: options.page ?? MOVIE_DEFAULT_PAGE,
      size: options.size ?? MOVIE_DEFAULT_SIZE,
      sortBy: "hot",
      sortDir: options.sortDir ?? "desc",
    });
    const data = await fetchJson(`/api/movies/hot?${query}`);
    return extractMovieItems(data, {
      page: Number(options.page) || MOVIE_DEFAULT_PAGE,
      size: Number(options.size) || MOVIE_DEFAULT_SIZE,
    });
  } catch (error) {
    return [];
  }
};

export const fetchMovieBySlug = async (slug) => {
  const response = await fetchJson(
    `/api/movies/slug/${encodeURIComponent(slug)}`,
  );
  return response?.data ?? response;
};

export const fetchMovieByIdentifier = async (identifier) => {
  const value = typeof identifier === "string" ? identifier.trim() : "";
  if (!value) {
    throw new Error("Movie identifier is required");
  }

  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  if (uuidLike) {
    try {
      const byId = await fetchJson(`/api/movies/${encodeURIComponent(value)}`);
      return byId?.data ?? byId;
    } catch {
      const bySlug = await fetchMovieBySlug(value);
      return bySlug?.data ?? bySlug;
    }
  }

  try {
    const bySlug = await fetchMovieBySlug(value);
    return bySlug?.data ?? bySlug;
  } catch {
    const byId = await fetchJson(`/api/movies/${encodeURIComponent(value)}`);
    return byId?.data ?? byId;
  }
};

export const fetchMovieByCategoryId = async (categoryId) => {
  try {
    const query = buildMovieQuery({
      page: MOVIE_DEFAULT_PAGE,
      size: MOVIE_DEFAULT_SIZE,
      sortBy: MOVIE_DEFAULT_SORT_BY,
      sortDir: MOVIE_DEFAULT_SORT_DIR,
    });
    const data = await fetchJson(
      `/api/movies/category/id/${encodeURIComponent(categoryId)}?${query}`,
    );
    return extractMovieItems(data, {
      page: MOVIE_DEFAULT_PAGE,
      size: MOVIE_DEFAULT_SIZE,
    });
  } catch (error) {
    return [];
  }
};

export const fetchMoviesByCountryAndCategory = async (
  countryName,
  categoryName,
  options = {},
) => {
  try {
    const query = buildMovieQuery({
      page: options.page,
      size: options.size,
      sortBy: options.sortBy,
      sortDir: options.sortDir,
    });
    const data = await fetchJson(
      `/api/movies/country/${encodeURIComponent(
        countryName,
      )}/category/${encodeURIComponent(categoryName)}?${query}`,
    );
    return extractMovieItems(data, {
      page: Number(options.page) || MOVIE_DEFAULT_PAGE,
      size: Number(options.size) || MOVIE_DEFAULT_SIZE,
    });
  } catch (error) {
    return [];
  }
};

export const fetchMoviesByName = async (name, options = {}) => {
  try {
    const query = buildMovieQuery({
      page: options.page,
      size: options.size,
      sortBy: options.sortBy,
      sortDir: options.sortDir,
      keyword: name,
    });

    try {
      const data = await fetchJson(`/api/movies/search?${query}`);
      return extractMovieItems(data, {
        page: Number(options.page) || MOVIE_DEFAULT_PAGE,
        size: Number(options.size) || MOVIE_DEFAULT_SIZE,
      });
    } catch {
      const legacyData = await fetchJson(
        `/api/movies/search/${encodeURIComponent(name)}?${query}`,
      );
      return extractMovieItems(legacyData, {
        page: Number(options.page) || MOVIE_DEFAULT_PAGE,
        size: Number(options.size) || MOVIE_DEFAULT_SIZE,
      });
    }
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
    // log for debugging
    console.error("[API] deleteMovie failed", {
      id,
      status: error?.response?.status,
      url: error?.config?.url,
      method: error?.config?.method,
      response: error?.response?.data,
      message: error?.message,
    });
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    // Primary endpoint pattern aligned with other admin delete APIs
    const response = await api.delete(`/api/categories/${id}`);
    return response.data;
  } catch (error) {
    // Backward compatibility fallback for deployments still using old route
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const fallbackResponse = await api.delete(`/api/categories/${id}`);
      return fallbackResponse.data;
    }
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
    const response = await api.delete(`/api/types/${id}`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      try {
        const legacyResponse = await api.delete(
          `/api/movie-types/delete/${id}`,
        );
        return legacyResponse.data;
      } catch (legacyError) {
        if (
          legacyError?.response?.status === 404 ||
          legacyError?.response?.status === 405
        ) {
          const fallbackResponse = await api.delete(`/api/types/${id}`);
          return fallbackResponse.data;
        }
        throw legacyError;
      }
    }
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

export const createAdminUser = async (payload) => {
  const normalizedPayload = {
    userName: payload?.userName?.trim(),
    email: payload?.email?.trim(),
    passWord: payload?.passWord,
    role: payload?.role || "USER",
    roleName: payload?.role || "USER",
    fullName: payload?.fullName?.trim() || undefined,
    phoneNumber: payload?.phoneNumber?.trim() || undefined,
    address: payload?.address?.trim() || undefined,
  };

  const response = await api.post("/api/user/admin/create", normalizedPayload);
  return response.data;
};

export const setAdminUserLockStatus = async (id, locked) => {
  const response = await api.patch(`/api/user/admin/${id}/lock`, null, {
    params: { locked: Boolean(locked) },
  });
  return response.data;
};

export const fetchAdminReportDashboard = async () => {
  const reportEndpoints = [
    "/api/reports/users?period=MONTH",
    "/api/reports/movies?period=MONTH",
  ];

  for (const endpoint of reportEndpoints) {
    try {
      const data = await fetchJson(endpoint);
      if (data) {
        return data?.data ?? data;
      }
    } catch {
      // Try next endpoint for compatibility with different backend route names
    }
  }

  return null;
};
