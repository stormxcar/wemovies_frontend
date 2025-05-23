import axios from 'axios';

// Cấu hình URL backend
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Hàm lấy danh sách phim
// fetchMovies.js
export const fetchMovies = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout 5 giây

        const response = await fetch(`${API_BASE_URL}/api/movies`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch movies:", error.message);
        throw error;
    }
};

// hàm lấy danh mục
export const fetchCategories = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch categories:", error.message);
        throw error;
    }
};

export const fetchMoviesByCategory = async (categoryName) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/movies/category/${categoryName}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
};

// get movie by hote
export const fetchMovieByHot = async () => {
    try{
        const response = await fetch(`${API_BASE_URL}/api/movies/hot`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }catch(error){
        console.error('Error fetching data:', error);
        return error;
    }
};

// get movie by categoru id
export const fetchMovieByCategoryId = async (categoryId) => {
    try{
        const response = await fetch(`${API_BASE_URL}/api/movies/category/id/${categoryId}`);
        if(!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }catch(error)
    {
        console.error('Error fetching data:', error);
        return error;
    }
};

// api.js
export const fetchMoviesByCountryAndCategory = async (countryName, categoryName) => {
    try{
        const response = await fetch(`${API_BASE_URL}/api/movies/country/${encodeURIComponent(countryName)}/category/${encodeURIComponent(categoryName)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }catch(error){
        console.error('Error fetching data:', error);
        return error;
    }
};


// search movie by name
export const fetchMoviesByName = async (name) => {
    try{
        const response = await fetch(`${API_BASE_URL}/api/movies/search/${name}`);
        if(!response.ok){
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }catch(error){
        console.error('Error fetching data:', error);
        return error;
    }
}
