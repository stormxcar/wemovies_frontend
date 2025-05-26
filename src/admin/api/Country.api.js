import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

export const getCountries = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}http://localhost:8080/api/countries`);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};
