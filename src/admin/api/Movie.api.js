import axios from "axios";

// const API_BASE_URL = "http://localhost:8080/api";

export const getMovies = async (page = 0, size = 10) => {
  try {
    const response = await axios.get("http://localhost:8080/api/movies", {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
};
