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
  const tryFetch = async (baseUrl, endpoint, opts) => {
    const fullUrl = `${baseUrl}${endpoint}`;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const fetchOptions = { ...opts, credentials: "include" }; // Include credentials
        console.log(
          `Attempt ${attempt} - Fetching URL: ${fullUrl}`,
          fetchOptions
        );
        const response = await fetch(fullUrl, fetchOptions);
        const contentType = response.headers.get("Content-Type");
        const status = response.status;
        console.log(
          `Attempt ${attempt} - Status: ${status}, Content-Type: ${contentType}`
        );
        const rawText = await response.text();
        console.log(`Attempt ${attempt} - Raw Response:`, rawText);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${status}, body: ${rawText}`);
        }

        let data;
        if (contentType && contentType.includes("application/json")) {
          try {
            data = JSON.parse(rawText);
          } catch (jsonError) {
            console.error(
              `Attempt ${attempt} - JSON Parsing Error:`,
              jsonError
            );
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

  const endpoint = url.startsWith("/") ? url : `/${url}`;
  let result = await tryFetch(API_BASE_URL, endpoint, options);

  if (!result.success) {
    console.warn(
      `Heroku API failed, falling back to local API: ${LOCAL_API_URL}`
    );
    result = await tryFetch(LOCAL_API_URL, endpoint, options);
  }

  if (!result.success) {
    console.error(`All attempts failed for both URLs`);
    throw result.error;
  }

  return result.data;
};
