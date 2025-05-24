// import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

console.log('API_BASE_URL:', API_BASE_URL);

// Helper function for fetch requests
const fetchJson = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Fetch error at ${url}:`, error.message);
        throw error;
    }
};

// Fetch movies with timeout
export const fetchMovies = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
        const data = await fetchJson(`${API_BASE_URL}/api/movies`, { signal: controller.signal });
        return data;
    } finally {
        clearTimeout(timeoutId);
    }
};

export const fetchCategories = () =>
    fetchJson(`${API_BASE_URL}/api/categories`);

export const fetchMoviesByCategory = (categoryName) =>
    fetchJson(`${API_BASE_URL}/api/movies/category/${encodeURIComponent(categoryName)}`)
        .catch(() => []);

export const fetchMovieByHot = () =>
    fetchJson(`${API_BASE_URL}/api/movies/hot`)
        .catch(error => error);

export const fetchMovieByCategoryId = (categoryId) =>
    fetchJson(`${API_BASE_URL}/api/movies/category/id/${encodeURIComponent(categoryId)}`)
        .catch(error => error);

export const fetchMoviesByCountryAndCategory = (countryName, categoryName) =>
    fetchJson(`${API_BASE_URL}/api/movies/country/${encodeURIComponent(countryName)}/category/${encodeURIComponent(categoryName)}`)
        .catch(error => error);

export const fetchMoviesByName = (name) =>
    fetchJson(`${API_BASE_URL}/api/movies/search/${encodeURIComponent(name)}`)
        .catch(error => error);
