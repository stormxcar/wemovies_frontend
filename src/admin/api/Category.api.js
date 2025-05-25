import axios from "axios";

// const API_BASE_URL = "http://localhost:8080/api";

export const getCategories = async () => {
  try {
    const response = await axios.get("http://localhost:8080/api/categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};
