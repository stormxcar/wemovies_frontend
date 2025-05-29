import { fetchJson } from "../../services/api";

export const getMovies = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const data = await fetchJson("/api/movies");
    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error("Fetch movies failed:", error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
};
