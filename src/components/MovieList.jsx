import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
// icon filter
import { FaFilter } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import CardMovie from "./CardMovie";
import {
  fetchCategories,
  fetchMovieType,
  fetchCountries,
  fetchMovieByHot,
  fetchMoviesByCategory as fetchMoviesByCategoryApi,
  fetchJson,
} from "../services/api";
import useDocumentTitle from "../hooks/useDocumentTitle";

const EMPTY_MOVIES = [];

function MovieList({ movies, onMovieClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryName } = useParams();
  const { t, i18n } = useTranslation();
  const { themeClasses, isDarkMode } = useTheme();
  const [showFilter, setShowFilter] = useState(false);
  const {
    category,
    movies: stateMovies,
    title,
    categoryId,
    sourceEndpoint,
  } = location.state || {};
  const inputMovies = Array.isArray(movies) ? movies : EMPTY_MOVIES;
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [suggestedMovies, setSuggestedMovies] = useState([]);

  const [types, setTypes] = useState([]); // Thể loại (categories) - Drama, Action, etc.
  const [movieTypes, setMovieTypes] = useState([]); // Loại phim (movie types) - Phim lẻ, Phim bộ, etc.

  // Set document title based on category or title
  useDocumentTitle(title || categoryName || t("navigation.movies"));

  // Filter states
  const allLabel = t("common.all");
  const newestSortLabel = t("movieList.sort_options.newest");
  const updatedSortLabel = t("movieList.sort_options.recently_updated");
  const viewsSortLabel = t("movieList.sort_options.views");
  const yearSortLabel = t("movieList.sort_options.production_year");
  const subtitleVersionLabel = t("movieList.version_options.sub");
  const dubbedVersionLabel = t("movieList.version_options.dubbed");
  const voiceoverVersionLabel = t("movieList.version_options.voiceover");

  const [selectedCountry, setSelectedCountry] = useState(allLabel);
  const [selectedMovieType, setSelectedMovieType] = useState(allLabel);
  const [selectedRating, setSelectedRating] = useState(allLabel);
  const [selectedGenre, setSelectedGenre] = useState(allLabel);
  const [selectedVersion, setSelectedVersion] = useState(allLabel);
  const [selectedYear, setSelectedYear] = useState(allLabel);
  const [selectedSort, setSelectedSort] = useState(newestSortLabel);
  const [isFilterDebugEnabled, setIsFilterDebugEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const queryEnabled = params.get("debugFilters") === "1";
    const localStorageEnabled =
      window.localStorage.getItem("debugMovieFilters") === "1";

    // Debug is enabled by default in development. In production, enable with
    // ?debugFilters=1 or localStorage.debugMovieFilters = "1".
    setIsFilterDebugEnabled(
      Boolean(import.meta.env.DEV || queryEnabled || localStorageEnabled),
    );
  }, []);

  const getMovieYear = (movie) => {
    const rawYear = movie?.release_year ?? movie?.releaseYear;
    if (rawYear === null || rawYear === undefined || rawYear === "") {
      return "";
    }
    return String(rawYear);
  };

  const getMovieCountryName = (movie) => {
    return movie?.country?.name || movie?.countryName || "";
  };

  const getMovieTypeNames = (movie) => {
    if (!Array.isArray(movie?.movieTypes)) {
      return [];
    }
    return movie.movieTypes
      .map((type) => type?.name || type?.type_name || "")
      .filter(Boolean);
  };

  const getMovieCategoryNames = (movie) => {
    if (Array.isArray(movie?.movieCategories)) {
      return movie.movieCategories
        .map((category) => category?.name || "")
        .filter(Boolean);
    }

    if (Array.isArray(movie?.categories)) {
      return movie.categories
        .map((category) => category?.name || category)
        .filter(Boolean);
    }

    return [];
  };

  const getMovieAgeRating = (movie) => {
    return movie?.ageRating || movie?.age_rating || "";
  };

  const getMovieDebugSnapshot = (movie) => ({
    id: movie?.id,
    title: movie?.title || movie?.name || "",
    year: getMovieYear(movie),
    country: getMovieCountryName(movie),
    movieTypes: getMovieTypeNames(movie),
    categories: getMovieCategoryNames(movie),
    ageRating: getMovieAgeRating(movie),
    vietSub: movie?.vietSub,
    views: movie?.views || 0,
  });

  const countryOptions = useMemo(() => {
    const names = countries
      .map((country) => country?.name)
      .filter((name) => Boolean(name));
    return [allLabel, ...names];
  }, [allLabel, countries]);

  const yearOptions = useMemo(() => {
    const years = [
      ...new Set(
        allMovies
          .map((movie) => getMovieYear(movie))
          .filter((year) => year !== null && year !== undefined && year !== ""),
      ),
    ]
      .map((year) => String(year))
      .sort((a, b) => Number(b) - Number(a));

    return [allLabel, ...years];
  }, [allLabel, allMovies]);

  const versionOptions = [
    allLabel,
    subtitleVersionLabel,
    dubbedVersionLabel,
    voiceoverVersionLabel,
  ];

  const sortOptions = [
    newestSortLabel,
    updatedSortLabel,
    viewsSortLabel,
    yearSortLabel,
  ];

  useEffect(() => {
    setSelectedCountry(allLabel);
    setSelectedMovieType(allLabel);
    setSelectedRating(allLabel);
    setSelectedGenre(allLabel);
    setSelectedVersion(allLabel);
    setSelectedYear(allLabel);
    setSelectedSort(newestSortLabel);
  }, [i18n.language]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          categoriesResponse,
          movieTypesResponse,
          countriesResponse,
          hotMoviesResponse,
        ] = await Promise.all([
          fetchCategories(), // Thể loại (movieCategories) - Drama, Action, etc.
          fetchMovieType(), // Loại phim (movieTypes) - có thể là dữ liệu khác
          fetchCountries(),
          fetchMovieByHot(),
        ]);

        const categoriesArray = Array.isArray(categoriesResponse)
          ? categoriesResponse
          : Array.isArray(categoriesResponse?.data)
            ? categoriesResponse.data
            : [];
        const movieTypesArray = Array.isArray(movieTypesResponse)
          ? movieTypesResponse
          : Array.isArray(movieTypesResponse?.data)
            ? movieTypesResponse.data
            : [];
        const countriesArray = Array.isArray(countriesResponse)
          ? countriesResponse
          : Array.isArray(countriesResponse?.data)
            ? countriesResponse.data
            : [];
        const hotMoviesArray = Array.isArray(hotMoviesResponse)
          ? hotMoviesResponse
          : Array.isArray(hotMoviesResponse?.data)
            ? hotMoviesResponse.data
            : [];

        setTypes(categoriesArray);
        setMovieTypes(movieTypesArray);
        setCountries(countriesArray);
        setSuggestedMovies(hotMoviesArray.slice(0, 14));
      } catch (error) {
        console.error("Error fetching data:", error);
        setTypes([]);
        setMovieTypes([]);
        setCountries([]);
        setSuggestedMovies([]);
      }
    };
    fetchAll();
  }, [stateMovies?.length, inputMovies.length]);

  const fetchMoviesByCategory = async (categoryName) => {
    try {
      const movieData = await fetchMoviesByCategoryApi(categoryName, {
        page: 0,
        size: 60,
        sortBy: "createdAt",
        sortDir: "desc",
      });

      setAllMovies(Array.isArray(movieData) ? movieData : []);
      setFilteredMovies(Array.isArray(movieData) ? movieData : []);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setAllMovies([]);
      setFilteredMovies([]);
    }
  };

  const fetchMoviesBySourceEndpoint = async (endpoint) => {
    if (!endpoint) {
      return [];
    }

    try {
      const separator = endpoint.includes("?") ? "&" : "?";
      const fullEndpoint = `${endpoint}${separator}page=0&size=200&sortBy=createdAt&sortDir=desc`;
      const response = await fetchJson(fullEndpoint);
      const moviesArray = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data?.items)
            ? response.data.items
            : Array.isArray(response?.data)
              ? response.data
              : [];

      return moviesArray;
    } catch (error) {
      console.error("Error fetching movies from source endpoint:", error);
      return [];
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadMovies = async () => {
      if (stateMovies && Array.isArray(stateMovies)) {
        // Show initial list quickly while we refresh from endpoint if possible.
        setAllMovies(stateMovies);
        setFilteredMovies(stateMovies);
      }

      if (sourceEndpoint) {
        const endpointMovies =
          await fetchMoviesBySourceEndpoint(sourceEndpoint);
        if (isMounted && endpointMovies.length > 0) {
          setAllMovies(endpointMovies);
          setFilteredMovies(endpointMovies);
          return;
        }
      }

      if (categoryId) {
        const movieData = await fetchMoviesByCategoryApi(categoryId, {
          page: 0,
          size: 200,
          sortBy: "createdAt",
          sortDir: "desc",
        });
        const list = Array.isArray(movieData) ? movieData : [];
        if (isMounted) {
          setAllMovies(list);
          setFilteredMovies(list);
        }
        return;
      }

      if (categoryName) {
        const movieData = await fetchMoviesByCategoryApi(categoryName, {
          page: 0,
          size: 200,
          sortBy: "createdAt",
          sortDir: "desc",
        });
        const list = Array.isArray(movieData) ? movieData : [];
        if (isMounted) {
          setAllMovies(list);
          setFilteredMovies(list);
        }
        return;
      }

      const fallbackList = inputMovies;
      if (isMounted) {
        setAllMovies(fallbackList);
        setFilteredMovies(fallbackList);
      }
    };

    loadMovies();

    return () => {
      isMounted = false;
    };
  }, [categoryName, stateMovies, categoryId, sourceEndpoint, inputMovies]);

  // Auto-apply filters when any filter state changes
  useEffect(() => {
    if (allMovies.length > 0) {
      applyFiltersInternal();
    }
  }, [
    selectedCountry,
    selectedMovieType,
    selectedRating,
    selectedGenre,
    selectedVersion,
    selectedYear,
    selectedSort,
    allMovies,
  ]);

  // Internal filter function that doesn't close modal
  const applyFiltersInternal = () => {
    let filtered = [...allMovies];
    const stepLogs = [];

    const selectedCriteria = {
      selectedCountry,
      selectedMovieType,
      selectedRating,
      selectedGenre,
      selectedVersion,
      selectedYear,
      selectedSort,
      sourceMoviesCount: allMovies.length,
    };

    const logStep = (name, before, after, criterion) => {
      if (!isFilterDebugEnabled) {
        return;
      }
      stepLogs.push({
        step: name,
        criterion,
        before,
        after,
        removed: before - after,
      });
    };

    const matchYear = (movie) =>
      selectedYear === allLabel || getMovieYear(movie) === selectedYear;
    const matchCountry = (movie) =>
      selectedCountry === allLabel ||
      getMovieCountryName(movie) === selectedCountry;
    const matchMovieType = (movie) =>
      selectedMovieType === allLabel ||
      getMovieTypeNames(movie).includes(selectedMovieType);
    const matchRating = (movie) =>
      selectedRating === allLabel ||
      getMovieAgeRating(movie) === selectedRating;
    const matchGenre = (movie) =>
      selectedGenre === allLabel ||
      getMovieCategoryNames(movie).includes(selectedGenre);
    const matchVersion = (movie) => {
      if (selectedVersion === allLabel) {
        return true;
      }
      if (selectedVersion === subtitleVersionLabel) {
        return movie?.vietSub === true;
      }
      if (
        selectedVersion === dubbedVersionLabel ||
        selectedVersion === voiceoverVersionLabel
      ) {
        return movie?.vietSub === false;
      }
      return true;
    };

    // Filter by year
    if (selectedYear !== allLabel) {
      const before = filtered.length;
      filtered = filtered.filter((movie) => matchYear(movie));
      logStep("year", before, filtered.length, selectedYear);
    }

    // Filter by country
    if (selectedCountry !== allLabel) {
      const before = filtered.length;
      filtered = filtered.filter((movie) => matchCountry(movie));
      logStep("country", before, filtered.length, selectedCountry);
    }

    // Filter by movie type (loại phim) - sử dụng data thật từ movieTypes
    if (selectedMovieType !== allLabel) {
      const before = filtered.length;
      filtered = filtered.filter((movie) => matchMovieType(movie));
      logStep("movieType", before, filtered.length, selectedMovieType);
    }

    // Filter by age rating
    if (selectedRating !== allLabel) {
      const before = filtered.length;
      filtered = filtered.filter((movie) => matchRating(movie));
      logStep("ageRating", before, filtered.length, selectedRating);
    }

    // Filter by genre (thể loại)
    if (selectedGenre !== allLabel) {
      const before = filtered.length;
      filtered = filtered.filter((movie) => matchGenre(movie));
      logStep("genre", before, filtered.length, selectedGenre);
    }

    // Filter by version (phiên bản)
    if (selectedVersion !== allLabel) {
      const before = filtered.length;
      filtered = filtered.filter((movie) => matchVersion(movie));
      logStep("version", before, filtered.length, selectedVersion);
    }

    // Apply sorting
    if (selectedSort === newestSortLabel) {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (selectedSort === updatedSortLabel) {
      filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (selectedSort === viewsSortLabel) {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (selectedSort === yearSortLabel) {
      filtered.sort(
        (a, b) => Number(getMovieYear(b)) - Number(getMovieYear(a)),
      );
    }

    if (isFilterDebugEnabled) {
      const inspected = allMovies.slice(0, 20).map((movie) => {
        const snapshot = getMovieDebugSnapshot(movie);
        const checks = {
          year: matchYear(movie),
          country: matchCountry(movie),
          movieType: matchMovieType(movie),
          ageRating: matchRating(movie),
          genre: matchGenre(movie),
          version: matchVersion(movie),
        };
        const matchedAll =
          checks.year &&
          checks.country &&
          checks.movieType &&
          checks.ageRating &&
          checks.genre &&
          checks.version;

        return {
          id: snapshot.id,
          title: snapshot.title,
          year: snapshot.year,
          country: snapshot.country,
          movieTypes: snapshot.movieTypes.join(", "),
          categories: snapshot.categories.join(", "),
          ageRating: snapshot.ageRating,
          vietSub: snapshot.vietSub,
          yearMatch: checks.year,
          countryMatch: checks.country,
          movieTypeMatch: checks.movieType,
          ageRatingMatch: checks.ageRating,
          genreMatch: checks.genre,
          versionMatch: checks.version,
          matchedAll,
        };
      });

      const excludedSamples = inspected
        .filter((movie) => !movie.matchedAll)
        .slice(0, 10);
      const includedSamples = inspected
        .filter((movie) => movie.matchedAll)
        .slice(0, 10);

      console.groupCollapsed(
        `[MovieList][FilterDebug] Result ${filtered.length}/${allMovies.length}`,
      );
      console.log("Criteria:", selectedCriteria);
      if (stepLogs.length > 0) {
        console.table(stepLogs);
      }
      if (excludedSamples.length > 0) {
        console.log("Excluded sample movies (first 10):");
        console.table(excludedSamples);
      }
      if (includedSamples.length > 0) {
        console.log("Included sample movies (first 10):");
        console.table(includedSamples);
      }
      console.groupEnd();
    }

    setFilteredMovies(filtered);
    setCurrentPage(0); // Reset to first page
  };

  // Public apply filters function (for button)
  const applyFilters = () => {
    applyFiltersInternal();
    setShowFilter(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCountry(allLabel);
    setSelectedMovieType(allLabel);
    setSelectedRating(allLabel);
    setSelectedGenre(allLabel);
    setSelectedVersion(allLabel);
    setSelectedYear(allLabel);
    setSelectedSort(newestSortLabel);
    // Don't need to call applyFiltersInternal here as useEffect will handle it
  };

  const [currentPage, setCurrentPage] = useState(0);
  const moviesPerPage = 21; // 3x7 for better responsive distribution

  // Pagination logic
  const offset = currentPage * moviesPerPage;
  const currentMovies = filteredMovies.slice(offset, offset + moviesPerPage);
  const pageCount = Math.ceil(filteredMovies.length / moviesPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const handleMovieClick = (movieId) => {
    if (onMovieClick) {
      onMovieClick(movieId);
      return;
    }
    navigate(`/movie/${movieId}`);
  };

  const selectedFilterPillClass =
    "bg-orange-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2";
  const filterOptionClass = (isActive) =>
    `cursor-pointer px-2 py-1 rounded transition-colors ${
      isActive
        ? "bg-orange-600 text-white"
        : `${themeClasses.textSecondary} ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"} hover:text-orange-300`
    }`;
  const neutralButtonClass = `${themeClasses.cardSecondary} ${themeClasses.textPrimary} px-4 py-2 rounded border ${themeClasses.borderLight} hover:opacity-80 transition-colors`;

  return (
    <div
      className={`w-full h-full ${themeClasses.primary} ${themeClasses.textPrimary} p-3 sm:p-4 sm:px-8 lg:px-12 min-h-screen pt-24 sm:pt-28 lg:pt-32`}
    >
      {/* Title */}
      <h2 className="text-xl font-bold mb-4">{title || categoryName}</h2>

      {/* Selected Filters Display */}
      <div className="mb-4 flex flex-wrap gap-2">
        {selectedCountry !== allLabel && (
          <span className={selectedFilterPillClass}>
            {t("movie.country")}: {selectedCountry}
            <button
              onClick={() => setSelectedCountry(allLabel)}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedYear !== allLabel && (
          <span className={selectedFilterPillClass}>
            {t("movieList.labels.year")}: {selectedYear}
            <button
              onClick={() => setSelectedYear(allLabel)}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedGenre !== allLabel && (
          <span className={selectedFilterPillClass}>
            {t("movie.genre")}: {selectedGenre}
            <button
              onClick={() => setSelectedGenre(allLabel)}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedMovieType !== allLabel && (
          <span className={selectedFilterPillClass}>
            {t("movieList.labels.movie_type")}: {selectedMovieType}
            <button
              onClick={() => setSelectedMovieType(allLabel)}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedRating !== allLabel && (
          <span className={selectedFilterPillClass}>
            {t("movie.rating")}: {selectedRating}
            <button
              onClick={() => setSelectedRating(allLabel)}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedVersion !== allLabel && (
          <span className={selectedFilterPillClass}>
            {t("movieList.labels.version")}: {selectedVersion}
            <button
              onClick={() => setSelectedVersion(allLabel)}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation(); // Ngăn sự kiện lan ra ngoài để đóng modal
          setShowFilter((prev) => !prev);
        }}
        className={`flex items-center gap-1 cursor-pointer ${themeClasses.cardSecondary} border ${themeClasses.borderLight} p-2 px-4 rounded w-fit mb-4`}
      >
        <h3>{t("movieList.filter_title")}</h3>
        <span className={`flex items-center gap-2 ${themeClasses.textPrimary}`}>
          <FaFilter />
        </span>
      </button>

      {showFilter && (
        <div
          className={`${themeClasses.card} ${themeClasses.textPrimary} p-4 rounded-lg shadow-lg border`}
        >
          <div className="flex flex-col gap-4 px-1 sm:px-3 lg:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="font-semibold min-w-[100px] sm:text-right">
                {t("movie.country")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-2 sm:gap-3 sm:ml-4 items-center">
                {countryOptions.map((item) => (
                  <li
                    key={item}
                    className={filterOptionClass(selectedCountry === item)}
                    onClick={() => setSelectedCountry(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="font-semibold min-w-[100px] sm:text-right">
                {t("movieList.labels.movie_type")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-2 sm:gap-3 sm:ml-4 items-center">
                <li
                  className={filterOptionClass(selectedMovieType === allLabel)}
                  onClick={() => setSelectedMovieType(allLabel)}
                >
                  {allLabel}
                </li>
                {movieTypes.map((item) => (
                  <li
                    key={item.id}
                    className={filterOptionClass(
                      selectedMovieType === item.name,
                    )}
                    onClick={() => setSelectedMovieType(item.name)}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="font-semibold min-w-[100px] sm:text-right">
                {t("movie.rating")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-2 sm:gap-3 sm:ml-4 items-center">
                {[allLabel, "P", "T7", "T13", "T16", "T18", "T21"].map(
                  (item) => (
                    <li
                      key={item}
                      className={filterOptionClass(selectedRating === item)}
                      onClick={() => setSelectedRating(item)}
                    >
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="font-semibold min-w-[100px] sm:text-right">
                {t("movie.genre")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-2 sm:gap-3 sm:ml-4 items-center">
                <li
                  className={filterOptionClass(selectedGenre === allLabel)}
                  onClick={() => setSelectedGenre(allLabel)}
                >
                  {allLabel}
                </li>
                {types.map((item) => (
                  <li
                    key={item.id}
                    className={filterOptionClass(selectedGenre === item.name)}
                    onClick={() => setSelectedGenre(item.name)}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="font-semibold min-w-[100px] sm:text-right">
                {t("movieList.labels.version")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-2 sm:gap-3 sm:ml-4 items-center">
                {versionOptions.map((item) => (
                  <li
                    key={item}
                    className={filterOptionClass(selectedVersion === item)}
                    onClick={() => setSelectedVersion(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="font-semibold min-w-[100px] sm:text-right">
                {t("movieList.labels.production_year")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-2 sm:gap-3 sm:ml-4 items-center">
                {yearOptions.map((item) => (
                  <li
                    key={item}
                    className={filterOptionClass(selectedYear === item)}
                    onClick={() => setSelectedYear(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="font-semibold min-w-[100px] sm:text-right">
                {t("movieList.labels.sort")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-2 sm:gap-3 sm:ml-4 items-center">
                {sortOptions.map((item) => (
                  <li
                    key={item}
                    className={filterOptionClass(selectedSort === item)}
                    onClick={() => setSelectedSort(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap justify-start gap-3">
              <button
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded transition-colors"
                onClick={applyFilters}
              >
                {t("movieList.actions.apply_filters")}
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                onClick={resetFilters}
              >
                {t("movieList.actions.reset_filters")}
              </button>
              <button
                className={neutralButtonClass}
                onClick={() => setShowFilter(false)}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 lg:gap-6 xl:gap-8">
        {currentMovies.length > 0 ? (
          currentMovies.map((movie) => (
            <CardMovie
              key={movie.id}
              movie={movie}
              onMovieClick={handleMovieClick}
            />
          ))
        ) : (
          <div
            className={`col-span-full flex items-center justify-center h-80 ${themeClasses.textPrimary}`}
          >
            {t("movieList.no_movies_found")}
          </div>
        )}
      </div>

      {currentMovies.length === 0 && suggestedMovies.length > 0 && (
        <section className="mt-10">
          <h3 className="text-xl font-semibold mb-4">
            {t("search.suggestion_title")}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4 lg:gap-6 xl:gap-8">
            {suggestedMovies.map((movie) => (
              <CardMovie
                key={`suggested-${movie.id}`}
                movie={movie}
                onMovieClick={handleMovieClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="pagination flex justify-center mt-28">
          <ReactPaginate
            previousLabel={<span className="px-2">←</span>}
            nextLabel={<span className="px-2">→</span>}
            breakLabel={"..."}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={3}
            onPageChange={handlePageClick}
            containerClassName="flex items-center gap-2"
            activeClassName="bg-orange-600"
            pageClassName={`px-3 py-1 rounded ${themeClasses.cardSecondary} hover:opacity-80 cursor-pointer`}
            pageLinkClassName={themeClasses.textPrimary}
            previousClassName={`px-3 py-1 rounded ${themeClasses.cardSecondary} hover:opacity-80 cursor-pointer`}
            previousLinkClassName={themeClasses.textPrimary}
            nextClassName={`px-3 py-1 rounded ${themeClasses.cardSecondary} hover:opacity-80 cursor-pointer`}
            nextLinkClassName={themeClasses.textPrimary}
            breakClassName={`px-3 py-1 rounded ${themeClasses.cardSecondary}`}
            breakLinkClassName={themeClasses.textPrimary}
            disabledClassName="opacity-50 cursor-not-allowed"
          />
          <span className={`ml-2 ${themeClasses.textSecondary}`}>
            {t("movieList.pagination.page")} {currentPage + 1} / {pageCount}
          </span>
        </div>
      )}
    </div>
  );
}

export default MovieList;
