import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://wemovies-backend-b74e2422331f.herokuapp.com";
const LOCAL_API_URL =
  process.env.REACT_APP_LOCAL_API_URL || "http://localhost:8080";

export const tryRequest = async (
  baseUrl,
  endpoint,
  options = {},
  retries = 2,
  retryDelay = 1000
) => {
  const fullUrl = `${baseUrl}${endpoint}`;
  const method = (options.method || "GET").toLowerCase();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      let response;
      if (method === "get") {
        response = await axios.get(fullUrl, {
          ...options,
          withCredentials: true,
          timeout: 5000,
        });
      } else if (method === "post") {
        response = await axios.post(fullUrl, options.body, {
          ...options,
          withCredentials: true,
          timeout: 5000,
        });
      } else if (method === "put") {
        response = await axios.put(fullUrl, options.body, {
          ...options,
          withCredentials: true,
          timeout: 5000,
        });
      } else if (method === "delete") {
        response = await axios.delete(fullUrl, {
          ...options,
          withCredentials: true,
          timeout: 5000,
        });
      } else {
        // fallback
        response = await axios({ url: fullUrl, ...options, timeout: 5000 });
      }
      if (!response.data) {
        throw new Error(`No data returned from ${fullUrl}`);
      }
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${fullUrl}:`, error.message);
      if (attempt === retries) {
        return { success: false, error };
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  return { success: false, error: new Error(`Failed after ${retries} attempts`) };
};

export const fetchJson = async (
  endpoint,
  options = {},
  retries = 2,
  retryDelay = 1000
) => {
  let result = await tryRequest(
    API_BASE_URL,
    endpoint,
    options,
    retries,
    retryDelay
  );
  if (!result.success) {
    console.warn(
      `Heroku API failed, falling back to local API: ${LOCAL_API_URL}`
    );
    result = await tryRequest(
      LOCAL_API_URL,
      endpoint,
      options,
      retries,
      retryDelay
    );
  }
  if (!result.success) {
    console.error(`All attempts failed for both URLs`);
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

    console.log('====================================');
    console.log("Fetched categories:", data.data);
    console.log('====================================');
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
