import { fetchJson } from "../../services/api";

export const getCountries = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetchJson("/api/countries");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
