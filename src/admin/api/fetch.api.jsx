const API_BASE_URL = import.meta.env.DEV
  ? "https://wemovies-backend.onrender.com"
  : import.meta.env.VITE_API_URL;

export const fetchJson = async (url, options = {}) => {
  const tryFetch = async (baseUrl, endpoint, opts) => {
    const fullUrl = `${baseUrl}${endpoint}`;
    try {
      const fetchOptions = { ...opts, credentials: "include" }; // Include credentials
      console.log(`Fetching URL: ${fullUrl}`, fetchOptions);
      const response = await fetch(fullUrl, fetchOptions);
      const contentType = response.headers.get("Content-Type");
      const status = response.status;
      console.log(`Status: ${status}, Content-Type: ${contentType}`);
      const rawText = await response.text();
      console.log(`Raw Response:`, rawText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${status}, body: ${rawText}`);
      }

      let data;
      if (contentType && contentType.includes("application/json")) {
        try {
          data = JSON.parse(rawText);
        } catch (jsonError) {
          console.error(`JSON Parsing Error:`, jsonError);
          // If JSON parsing fails, treat as text
          data = rawText;
        }
      } else {
        data = rawText; // Treat as plain text
      }

      if (!data) {
        throw new Error(`No data returned from ${fullUrl}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Request failed for ${fullUrl}:`, error.message);
      return { success: false, error };
    }
  };

  const endpoint = url.startsWith("/") ? url : `/${url}`;
  let result = await tryFetch(API_BASE_URL, endpoint, options);

  if (!result.success) {
    console.error(`Request failed`);
    throw result.error;
  }

  return result.data;
};
