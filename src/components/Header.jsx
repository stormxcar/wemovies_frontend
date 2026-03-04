import React, { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  User,
  LogOut,
  UserCircle,
  Heart,
  Settings,
  Moon,
  Sun,
  Languages,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import RegisterForm from "../components/auth/RegisterForm";
import LoginForm from "../components/auth/LoginForm";
import MobileMenu from "./MobileMenu";
import NotificationCenter from "./notifications/NotificationCenter";
import {
  fetchCategories,
  fetchCountries,
  fetchMovieType,
  fetchMovieByHot,
  fetchJson,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLoading } from "../context/UnifiedLoadingContext";

function Header() {
  const RECENT_SEARCHES_KEY = "wemovies_recent_searches";
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [hotSuggestions, setHotSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const { setLoading, isLoading } = useLoading();
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [types, setTypes] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { isDarkMode, toggleTheme, themeClasses } = useTheme();
  const { t, i18n } = useTranslation();
  const { navigateWithLoading } = useLoading();

  const parseMoviesResponse = useCallback((response) => {
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.data)) return response.data;
    if (response && Array.isArray(response.movies)) return response.movies;
    return [];
  }, []);

  const saveRecentSearch = useCallback(
    (value) => {
      const normalized = value?.trim();
      if (!normalized) return;

      const merged = [
        normalized,
        ...recentSearches.filter((item) => item !== normalized),
      ].slice(0, 8);

      setRecentSearches(merged);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(merged));
    },
    [recentSearches],
  );

  const searchMoviesByKeyword = useCallback(
    async (keyword) => {
      const response = await fetchJson(
        `/api/movies/search?keyword=${encodeURIComponent(keyword)}`,
      );
      return parseMoviesResponse(response);
    },
    [parseMoviesResponse],
  );

  // Language toggle handler
  const toggleLanguage = useCallback(() => {
    const newLanguage = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLanguage);
    toast.success(t("settings.messages.language_changed"));
  }, [i18n, t]);

  // Centralized API error handler
  const handleApiError = useCallback((error, message) => {
    toast.error(`${message}`);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, countriesData, typesData, hotMovies] =
          await Promise.all([
            fetchCategories(),
            fetchCountries(),
            fetchMovieType(),
            fetchMovieByHot(),
          ]);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setCountries(Array.isArray(countriesData) ? countriesData : []);
        setTypes(Array.isArray(typesData) ? typesData : []);
        setHotSuggestions(
          Array.isArray(hotMovies) ? hotMovies.slice(0, 8) : [],
        );

        const storedRecent = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (storedRecent) {
          const parsedRecent = JSON.parse(storedRecent);
          if (Array.isArray(parsedRecent)) {
            setRecentSearches(parsedRecent.slice(0, 8));
          }
        }
      } catch (error) {
        handleApiError(error, t("header.error_load_data"));
      }
    };
    fetchData();
  }, [handleApiError, t]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setIsSearchingSuggestions(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const movies = await searchMoviesByKeyword(query.trim());
        setSearchSuggestions(movies.slice(0, 8));
      } catch {
        setSearchSuggestions([]);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [query, searchMoviesByKeyword]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading("search", true, t("header.searching"));
    try {
      const normalizedQuery = query.trim();
      const movies = await searchMoviesByKeyword(normalizedQuery);
      saveRecentSearch(normalizedQuery);

      navigateWithLoading("/search", {
        state: { movies, query: normalizedQuery },
        loadingMessage: t("header.loading_search_results"),
      });
      setShowSearchDropdown(false);
    } catch (error) {
      handleApiError(error, t("header.error_search_movies"));
    } finally {
      setLoading("search", false);
      setIsSearchOpen(false);
    }
  }, [
    query,
    handleApiError,
    navigateWithLoading,
    saveRecentSearch,
    searchMoviesByKeyword,
    setLoading,
    t,
  ]);

  const handleQuickSearch = useCallback(
    async (keyword) => {
      if (!keyword?.trim()) return;
      setQuery(keyword);
      setLoading("search", true, t("header.searching"));
      try {
        const normalizedQuery = keyword.trim();
        const movies = await searchMoviesByKeyword(normalizedQuery);
        saveRecentSearch(normalizedQuery);
        navigateWithLoading("/search", {
          state: { movies, query: normalizedQuery },
          loadingMessage: t("header.loading_search_results"),
        });
        setShowSearchDropdown(false);
        setIsSearchOpen(false);
      } catch (error) {
        handleApiError(error, t("header.error_search_movies"));
      } finally {
        setLoading("search", false);
      }
    },
    [
      handleApiError,
      navigateWithLoading,
      saveRecentSearch,
      searchMoviesByKeyword,
      setLoading,
      t,
    ],
  );

  const openMovieFromSuggestion = useCallback(
    (movie) => {
      if (!movie?.id) return;
      saveRecentSearch(movie.title || "");
      setShowSearchDropdown(false);
      setIsSearchOpen(false);
      navigateWithLoading(`/movie/${movie.id}`, {
        loadingMessage: t("header.loading_open_movie", {
          title: movie.title || t("common.loading"),
        }),
      });
    },
    [navigateWithLoading, saveRecentSearch, t],
  );

  const handleKeyDownToSearch = (event) => {
    if (event.key === "Enter") handleSearch();
  };

  // Modal and form handlers
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setShowRegister(false);
    setShowLogin(false);
    setShowUserModal(false);
    setShowSearchDropdown(false);
  }, []);

  const renderSearchDropdown = () => (
    <div
      className={`absolute top-full left-0 right-0 mt-2 ${themeClasses.card} border ${themeClasses.borderLight} rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto`}
    >
      {query.trim() ? (
        <>
          <div
            className={`px-4 py-2 border-b ${themeClasses.borderLight} text-xs ${themeClasses.textMuted}`}
          >
            {isSearchingSuggestions
              ? t("header.dropdown.searching")
              : t("header.dropdown.related_results")}
          </div>
          {isSearchingSuggestions ? (
            <div className={`px-4 py-6 text-sm ${themeClasses.textSecondary}`}>
              {t("header.searching")}
            </div>
          ) : searchSuggestions.length > 0 ? (
            searchSuggestions.map((movie) => (
              <button
                key={movie.id}
                onClick={() => openMovieFromSuggestion(movie)}
                className={`w-full px-4 py-3 text-left ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"} transition-colors border-b ${themeClasses.borderLight}`}
              >
                <p className={`text-sm ${themeClasses.textPrimary} line-clamp-1`}>
                  {movie.title}
                </p>
                <p className={`text-xs ${themeClasses.textMuted}`}>
                  {(movie.release_year || "N/A") + " • "}
                  {Number(movie.views || 0).toLocaleString()} {t("home.views")}
                </p>
              </button>
            ))
          ) : (
            <div className={`px-4 py-6 text-sm ${themeClasses.textSecondary}`}>
              {t("search.no_results")}
            </div>
          )}
        </>
      ) : (
        <div className="p-4 space-y-4">
          {recentSearches.length > 0 && (
            <div>
              <p
                className={`text-xs uppercase tracking-wide ${themeClasses.textMuted} mb-2`}
              >
                {t("header.dropdown.recent_searches")}
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleQuickSearch(item)}
                    className={`px-3 py-1.5 text-xs rounded-full ${themeClasses.cardSecondary} ${themeClasses.textSecondary} ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hotSuggestions.length > 0 && (
            <div>
              <p
                className={`text-xs uppercase tracking-wide ${themeClasses.textMuted} mb-2`}
              >
                {t("header.dropdown.hot_movies")}
              </p>
              <div className="space-y-2">
                {hotSuggestions.slice(0, 6).map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => openMovieFromSuggestion(movie)}
                    className={`w-full px-3 py-2 text-left rounded-lg ${themeClasses.cardSecondary} ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                  >
                    <p className={`text-sm ${themeClasses.textPrimary} line-clamp-1`}>
                      {movie.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const handleLoginSuccess = useCallback(
    async (userData) => {
      if (!userData) {
        return;
      }

      setShowLogin(false);

      // Navigate based on user role
      const userRole =
        userData.role?.roleName || userData.roleName || userData.role || "USER";
      if (userRole === "ADMIN") {
        navigateWithLoading("/admin", {
          loadingMessage: t("header.loading_admin"),
        });
      } else {
        navigateWithLoading("/", {
          loadingMessage: t("header.loading_home"),
        });
      }

      try {
        await fetchJson("/api/watchlist", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });
      } catch (error) {
        handleApiError(error, t("header.error_watchlist"));
      }
    },
    [handleApiError, navigateWithLoading, t],
  );

  const handleLogout = useCallback(async () => {
    try {
      setShowUserModal(false);
      await logout();
      toast.success(t("header.logout_success"));
      navigateWithLoading("/", {
        loadingMessage: t("header.loading_logout"),
      });
    } catch (error) {
      // Vẫn logout ngay cả khi có lỗi
      await logout();
      setShowUserModal(false);
      navigateWithLoading("/", {
        loadingMessage: t("header.loading_home"),
      });
    }
  }, [logout, navigateWithLoading, t]);

  // Navigate to movies by category, country, or type
  const navigateToMovies = useCallback(
    async (endpoint, name) => {
      try {
        const response = await fetchJson(endpoint);

        // Handle different response formats
        let movies = [];
        if (response && Array.isArray(response)) {
          movies = response;
        } else if (response && Array.isArray(response.data)) {
          movies = response.data;
        } else if (
          response &&
          response.movies &&
          Array.isArray(response.movies)
        ) {
          movies = response.movies;
        } else {
          movies = [];
        }

        navigateWithLoading(`/movies/${name}`, {
          state: {
            movies,
            title: name,
          },
          loadingMessage: t("header.loading_open_list", { name }),
        });
        closeModal();
      } catch (error) {
        handleApiError(error, t("header.error_load_movies_for", { name }));

        // Navigate anyway with empty movies array to show the page
        navigateWithLoading(`/movies/${name}`, {
          state: {
            movies: [],
            title: name,
          },
          loadingMessage: t("header.loading_open_list", { name }),
        });
        closeModal();
      }
    },
    [navigateWithLoading, handleApiError, closeModal, t],
  );

  return (
    <header className="w-full bg-transparent">
      <div
        className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 ${
          isScrolled ? "bg-black/80 shadow-lg" : "bg-transparent"
        } p-4 flex items-center justify-between text-white`}
        onClick={closeModal}
      >
        <div className="flex items-center space-x-4 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateWithLoading("/", {
                loadingMessage: t("header.loading_home"),
              });
            }}
            className="text-2xl font-bold hover:text-blue-300 transition-colors"
          >
            Wemovies
          </button>

          <MobileMenu
            categories={categories}
            types={types}
            countries={countries}
            navigateToMovies={navigateToMovies}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSearchOpen(true);
            }}
            className="md:hidden p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            aria-label={t("header.open_search")}
          >
            <Search className="h-5 w-5" />
          </button>

          {isSearchOpen && (
            <div
              className="fixed inset-0 bg-black/80 flex justify-center items-center z-40 md:hidden"
              onClick={() => setIsSearchOpen(false)}
            >
              <div
                className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md relative"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onKeyDown={handleKeyDownToSearch}
                  placeholder={t("header.search_placeholder")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  autoFocus
                />
                {showSearchDropdown && renderSearchDropdown()}
                <button
                  onClick={handleSearch}
                  className="w-full mt-3 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading
                    ? t("header.searching")
                    : t("header.search_button")}
                </button>
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center search-container relative w-full max-w-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              onKeyDown={handleKeyDownToSearch}
              placeholder={t("header.search_placeholder")}
              className={`w-full px-4 py-2 rounded-lg ${themeClasses.textPrimary} ${
                isScrolled
                  ? themeClasses.cardSecondary
                  : isDarkMode
                    ? "bg-gray-900/50"
                    : "bg-white/90"
              } border ${themeClasses.border} focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? "placeholder-gray-400" : "placeholder-gray-500"}`}
            />
            {showSearchDropdown && renderSearchDropdown()}
          </div>

          <div className="hidden md:flex items-center space-x-6 ml-6">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal((prev) => (prev === "types" ? null : "types"));
                }}
                className="flex items-center hover:text-blue-300 transition-colors"
                aria-label={t("header.categories")}
              >
                {t("header.categories")}
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {activeModal === "types" && (
                <ul
                  className={`absolute top-10 left-0 ${themeClasses.card} ${themeClasses.textPrimary} px-4 py-3 rounded-lg shadow-xl w-96 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 max-h-screen overflow-y-auto modal-content border ${themeClasses.borderLight}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {types.map((item) => (
                    <li
                      key={item.name}
                      className={`cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded ${isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-100"} flex`}
                      onClick={() =>
                        navigateToMovies(
                          `/api/movies/type/id/${item.id}`,
                          item.name,
                        )
                      }
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <div className="flex items-center gap-1">
                {categories.map((item) => (
                  <button
                    key={item.name}
                    className={`cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded ${isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-100"} flex`}
                    onClick={() =>
                      navigateToMovies(
                        `/api/movies/category/${item.name}`,
                        item.name,
                      )
                    }
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal((prev) =>
                    prev === "countries" ? null : "countries",
                  );
                }}
                className="flex items-center hover:text-blue-300 transition-colors"
                aria-label={t("header.countries")}
              >
                {t("header.countries")}
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {activeModal === "countries" && (
                <ul
                  className={`absolute top-10 left-0 ${themeClasses.card} ${themeClasses.textPrimary} px-4 py-3 rounded-lg shadow-xl w-96 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 max-h-screen overflow-y-auto modal-content border ${themeClasses.borderLight}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {countries.map((item) => (
                    <li
                      key={item.name}
                      className={`cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded ${isDarkMode ? "hover:bg-gray-800/50" : "hover:bg-gray-100"} flex`}
                      onClick={() =>
                        navigateToMovies(
                          `/api/movies/country/${item.id}`,
                          item.name,
                        )
                      }
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center w-[30%] justify-end">
          {isLoading("search") ? null : user ? (
            <div className="flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTheme();
                }}
                className={`p-2 rounded-lg transition-colors ${themeClasses.textPrimary} ${isDarkMode ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-white/90 hover:bg-gray-100 border border-gray-200"}`}
                title={
                  isDarkMode
                    ? t("header.theme_to_light")
                    : t("header.theme_to_dark")
                }
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-300" />
                )}
              </button>

              {/* Language Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLanguage();
                }}
                className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${themeClasses.textPrimary} ${isDarkMode ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-white/90 hover:bg-gray-100 border border-gray-200"}`}
                title={
                  i18n.language === "vi"
                    ? t("header.switch_to_english")
                    : t("header.switch_to_vietnamese")
                }
              >
                <Languages className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium">
                  {i18n.language === "vi" ? "EN" : "VI"}
                </span>
              </button>
              <NotificationCenter />
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserModal(!showUserModal);
                  }}
                  className="flex items-center space-x-2"
                >
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border-2 border-blue-300"
                  />
                  <span className="text-white">{user?.fullName}</span>
                </button>
                {showUserModal && (
                  <div
                    className="absolute top-12 right-0 bg-white text-gray-800 rounded-lg shadow-xl w-64 z-50 border overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b bg-gray-50">
                      <h3 className="font-semibold text-gray-900">
                        {user?.fullName}
                      </h3>
                     
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setShowUserModal(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center space-x-3"
                      >
                        <UserCircle className="w-5 h-5 text-gray-600" />
                        <span>{t("header.profile")}</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/profile?tab=watchlist");
                          setShowUserModal(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center space-x-3"
                      >
                        <Heart className="w-5 h-5 text-gray-600" />
                        <span>{t("header.favorites")}</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/profile?tab=watching");
                          setShowUserModal(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center space-x-3"
                      >
                        <Settings className="w-5 h-5 text-gray-600" />
                        <span>{t("header.continue_watching")}</span>
                      </button>
                    </div>
                    <div className="border-t">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-3"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>{t("header.logout")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {/* Theme Toggle Button for non-logged in users */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTheme();
                }}
                className={`p-2 rounded-lg transition-colors ${themeClasses.textPrimary} ${isDarkMode ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-white/90 hover:bg-gray-100 border border-gray-200"}`}
                title={
                  isDarkMode
                    ? t("header.theme_to_light")
                    : t("header.theme_to_dark")
                }
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-300" />
                )}
              </button>

              {/* Language Toggle Button for non-logged in users */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLanguage();
                }}
                className={`p-2 rounded-lg transition-colors flex items-center space-x-1 ${themeClasses.textPrimary} ${isDarkMode ? "bg-gray-800/50 hover:bg-gray-700/50" : "bg-white/90 hover:bg-gray-100 border border-gray-200"}`}
                title={
                  i18n.language === "vi"
                    ? t("header.switch_to_english")
                    : t("header.switch_to_vietnamese")
                }
              >
                <Languages className="h-4 w-4 text-green-400" />
                <span className="text-xs font-medium">
                  {i18n.language === "vi" ? "EN" : "VI"}
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLogin(true);
                }}
                className="hover:text-blue-300 transition-colors py-2 px-4 rounded-full bg-blue-900 text-center w-[50%]"
                aria-label={t("header.login")}
              >
                {t("header.login")}
              </button>
            </div>
          )}
        </div>
      </div>

      {showRegister && (
        <RegisterForm
          onClose={closeModal}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
      {showLogin && (
        <LoginForm
          onClose={closeModal}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onLoginSuccess={handleLoginSuccess}
          googleLoginButton={null}
        />
      )}
    </header>
  );
}

export default memo(Header);
