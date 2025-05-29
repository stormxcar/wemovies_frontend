import { fetchJson } from "../../services/api";

export const getCategories = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const data = await fetchJson("/api/categories");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

