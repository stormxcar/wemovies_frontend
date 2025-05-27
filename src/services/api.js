// import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// console.log("API_BASE_URL:", API_BASE_URL);

const fetchJson = async (url, options = {}, retries = 3, retryDelay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data) {
        throw new Error(`No data returned from ${url}`);
      }
      return data;
    } catch (error) {
      console.error(`Attempt ${attempt} failed for ${url}:`, error.message);
      if (attempt === retries) {
        console.error(`All ${retries} attempts failed for ${url}`);
        throw error; // Ném lỗi nếu đã thử hết số lần
      }
      // Đợi trước khi thử lại
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
};

// Fetch movies with timeout
export const fetchMovies = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const data = await fetchJson(`${API_BASE_URL}/api/movies`);
    return Array.isArray(data) ? data : []; // Đảm bảo trả về mảng
  } catch (error) {
    console.error("Fetch movies failed:", error);
    return []; // Giá trị mặc định
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchCategories = async () => {
  try {
    const data = await fetchJson(`${API_BASE_URL}/api/categories`);
    return Array.isArray(data.data) ? data.data : []; // Lấy data.data
  } catch (error) {
    console.error("Fetch categories failed:", error);
    return [];
  }
};

export const fetchMoviesByCategory = (categoryName) =>
  fetchJson(
    `${API_BASE_URL}/api/movies/category/${encodeURIComponent(categoryName)}`
  ).catch(() => []);

export const fetchMovieByHot = async () => {
  try {
    const data = await fetchJson(`${API_BASE_URL}/api/movies/hot`);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch hot movies failed:", error);
    return [];
  }
};

export const fetchMovieByCategoryId = async (categoryId) => {
  try {
    const data = await fetchJson(
      `${API_BASE_URL}/api/movies/category/id/${encodeURIComponent(categoryId)}`
    );
    return Array.isArray(data) ? data : [];
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
      `${API_BASE_URL}/api/movies/country/${encodeURIComponent(
        countryName
      )}/category/${encodeURIComponent(categoryName)}`
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch movies by country and category failed:", error);
    return [];
  }
};

export const fetchMoviesByName = async (name) => {
  try {
    const data = await fetchJson(
      `${API_BASE_URL}/api/movies/search/${encodeURIComponent(name)}`
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch movies by name failed:", error);
    return [];
  }
};
