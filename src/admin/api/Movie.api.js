import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const getMovies = async (page = 0, size = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/movies`, {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
};
