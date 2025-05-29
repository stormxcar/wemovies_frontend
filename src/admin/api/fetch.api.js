import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://wemovies-backend-b74e2422331f.herokuapp.com";
const LOCAL_API_URL =
  process.env.REACT_APP_LOCAL_API_URL || "http://localhost:8080";

export const fetchJson = async (
  url,
  options = {},
  retries = 3,
  retryDelay = 1000
) => {
  // Hàm thử yêu cầu với một base URL cụ thể
  const tryFetch = async (baseUrl, endpoint, opts) => {
    const fullUrl = `${baseUrl}${endpoint}`;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(fullUrl, opts);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data) {
          throw new Error(`No data returned from ${fullUrl}`);
        }
        return { success: true, data };
      } catch (error) {
        console.error(
          `Attempt ${attempt} failed for ${fullUrl}:`,
          error.message
        );
        if (attempt === retries) {
          return { success: false, error };
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  };

  // Thử với URL Heroku trước
  const endpoint = url.startsWith("/") ? url : `/${url}`;
  let result = await tryFetch(API_BASE_URL, endpoint, options);

  // Nếu Heroku thất bại, thử với URL cục bộ
  if (!result.success) {
    console.warn(
      `Heroku API failed, falling back to local API: ${LOCAL_API_URL}`
    );
    result = await tryFetch(LOCAL_API_URL, endpoint, options);
  }

  // Nếu cả hai đều thất bại, ném lỗi
  if (!result.success) {
    console.error(`All attempts failed for both URLs`);
    throw result.error;
  }

  return result.data;
};
