import { fetchJson } from "../../services/api";

export const getTypes = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetchJson("/api/types");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
