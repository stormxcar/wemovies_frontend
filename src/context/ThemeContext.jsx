import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Default to dark mode, load from localStorage if available
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("darkMode");
    // If no saved preference, default to dark mode
    return savedTheme !== null ? JSON.parse(savedTheme) : true;
  });

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("bg-gray-900");
      document.body.classList.remove("bg-white");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.add("bg-white");
      document.body.classList.remove("bg-gray-900");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("darkMode", JSON.stringify(newTheme));
  };

  const setTheme = (darkMode) => {
    setIsDarkMode(darkMode);
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  };

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme,
    themeClasses: {
      // Background classes
      primary: isDarkMode ? "bg-gray-900" : "bg-white",
      secondary: isDarkMode ? "bg-gray-800" : "bg-gray-100",
      tertiary: isDarkMode ? "bg-gray-700" : "bg-gray-200",

      // Text classes
      textPrimary: isDarkMode ? "text-white" : "text-gray-900",
      textSecondary: isDarkMode ? "text-gray-300" : "text-gray-700",
      textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",

      // Border classes
      border: isDarkMode ? "border-gray-600" : "border-gray-300",
      borderLight: isDarkMode ? "border-gray-700" : "border-gray-200",

      // Card/Container classes
      card: isDarkMode
        ? "bg-gray-800 border-gray-700"
        : "bg-white border-gray-200",
      cardSecondary: isDarkMode
        ? "bg-gray-700 border-gray-600"
        : "bg-gray-50 border-gray-200",
    },
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
