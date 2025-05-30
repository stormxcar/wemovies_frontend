import { fetchJson } from "../../services/api";

export const getUsers = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetchJson("/api/user");
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
