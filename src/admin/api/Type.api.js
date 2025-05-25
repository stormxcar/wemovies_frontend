import axios from "axios";

// const API_BASE_URL = "http://localhost:8080/api";

export const getTypes = async () => {
  try {
    const response = await axios.get("http://localhost:8080/api/types");
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};
