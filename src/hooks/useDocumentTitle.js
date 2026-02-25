import { useEffect } from "react";

/**
 * Custom hook to manage document title
 * @param {string} title - The title to set for the page
 * @param {string} suffix - Optional suffix (e.g., site name)
 */
const useDocumentTitle = (title, suffix = "Wemovies") => {
  useEffect(() => {
    if (title) {
      document.title = suffix ? `${title} | ${suffix}` : title;
    } else {
      document.title = suffix;
    }

    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = "Wemovies";
    };
  }, [title, suffix]);
};

export default useDocumentTitle;
