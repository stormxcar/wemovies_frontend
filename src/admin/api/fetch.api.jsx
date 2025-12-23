const API_BASE_URL = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL;

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
    console.error(`All attempts failed`);
    throw result.error;
  }

  return result.data;
};
