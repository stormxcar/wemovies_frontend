import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
// icon filter
import { FaFilter } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import CardMovie from "./CardMovie";
import {
  fetchJson,
  fetchCategories,
  fetchMovieType,
  fetchCountries,
  fetchMovieByHot,
} from "../services/api";
import useDocumentTitle from "../hooks/useDocumentTitle";

function MovieList({ movies = [], onMovieClick }) {
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
  } = location.state || {};
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
          .map((movie) => movie?.release_year)
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

        console.log("Categories response:", categoriesResponse); // Debug log
        console.log("Movie types response:", movieTypesResponse); // Debug log

        const categoriesArray = Array.isArray(categoriesResponse)
          ? categoriesResponse
          : [];
        const movieTypesArray = Array.isArray(movieTypesResponse)
          ? movieTypesResponse
          : [];
        const countriesArray = Array.isArray(countriesResponse)
          ? countriesResponse
          : [];
        const hotMoviesArray = Array.isArray(hotMoviesResponse)
          ? hotMoviesResponse
          : [];

        setTypes(categoriesArray); // Thể loại cho filter "Thể loại"
        setMovieTypes(movieTypesArray); // Loại phim (nếu cần dùng)
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
  }, [stateMovies?.length, movies?.length]);

  const fetchMoviesByCategory = async (categoryName) => {
    try {
      const movies = await fetchJson(`/api/movies/category/${categoryName}`);
      const movieData = Array.isArray(movies.data) ? movies.data : [];

      console.log("Movie data:", movieData); // Debug log
      if (movieData.length > 0) {
        console.log("Sample movie:", movieData[0]); // Debug log
        console.log("Movie categories:", movieData[0]?.movieCategories); // Debug log
      }

      setAllMovies(movieData);
      setFilteredMovies(movieData);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setAllMovies([]);
      setFilteredMovies([]);
    }
  };

  useEffect(() => {
    if (stateMovies && Array.isArray(stateMovies)) {
      // Nếu có stateMovies từ navigate (ví dụ: từ HorizontalMovies), sử dụng nó
      setAllMovies(stateMovies);
      setFilteredMovies(stateMovies);
    } else if (categoryId) {
      // Nếu có categoryId, gọi API để lấy danh sách phim
      fetchMoviesByCategory(categoryId);
    } else if (categoryName) {
      // Nếu chỉ có categoryName (truy cập trực tiếp), gọi API với tên category
      fetchMoviesByCategory(categoryName);
    } else {
      // Sử dụng movies mặc định nếu không có dữ liệu
      setAllMovies(movies);
      setFilteredMovies(movies);
    }
  }, [categoryName, stateMovies, categoryId, movies]);

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

    // Filter by year
    if (selectedYear !== allLabel) {
      filtered = filtered.filter(
        (movie) =>
          movie.release_year && movie.release_year.toString() === selectedYear,
      );
    }

    // Filter by country
    if (selectedCountry !== allLabel) {
      filtered = filtered.filter(
        (movie) => movie.country && movie.country.name === selectedCountry,
      );
    }

    // Filter by movie type (loại phim) - sử dụng data thật từ movieTypes
    if (selectedMovieType !== allLabel) {
      filtered = filtered.filter(
        (movie) =>
          movie.movieTypes &&
          movie.movieTypes.some((type) => type.name === selectedMovieType),
      );
    }

    // Filter by age rating
    if (selectedRating !== allLabel) {
      filtered = filtered.filter((movie) => movie.ageRating === selectedRating);
    }

    // Filter by genre (thể loại)
    if (selectedGenre !== allLabel) {
      filtered = filtered.filter(
        (movie) =>
          movie.movieCategories &&
          movie.movieCategories.some((cat) => cat.name === selectedGenre),
      );
    }

    // Filter by version (phiên bản)
    if (selectedVersion !== allLabel) {
      if (selectedVersion === subtitleVersionLabel) {
        filtered = filtered.filter((movie) => movie.vietSub === true);
      } else if (
        selectedVersion === dubbedVersionLabel ||
        selectedVersion === voiceoverVersionLabel
      ) {
        filtered = filtered.filter((movie) => movie.vietSub === false);
      }
    }

    // Apply sorting
    if (selectedSort === newestSortLabel) {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (selectedSort === updatedSortLabel) {
      filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (selectedSort === viewsSortLabel) {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (selectedSort === yearSortLabel) {
      filtered.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
    }

    console.log("Final filtered count:", filtered.length);
    console.log("=== END FILTER DEBUG ===");

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
    "bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2";
  const filterOptionClass = (isActive) =>
    `cursor-pointer px-2 py-1 rounded transition-colors ${
      isActive
        ? "bg-blue-600 text-white"
        : `${themeClasses.textSecondary} ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"} hover:text-blue-500`
    }`;
  const neutralButtonClass = `${themeClasses.cardSecondary} ${themeClasses.textPrimary} px-4 py-2 rounded border ${themeClasses.borderLight} hover:opacity-80 transition-colors`;

  return (
    <div
      className={`w-full h-full ${themeClasses.primary} ${themeClasses.textPrimary} p-4 px-12 min-h-screen pt-32`}
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
          <div className="flex flex-col gap-4 pr-10 pl-6">
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                {t("movie.country")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
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
            <div className="flex items-center ">
              <h4 className="font-semibold min-w-[100px] text-right">
                {t("movieList.labels.movie_type")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                <li
                  className={filterOptionClass(selectedMovieType === allLabel)}
                  onClick={() => setSelectedMovieType(allLabel)}
                >
                  {allLabel}
                </li>
                {movieTypes.map((item) => (
                  <li
                    key={item.id}
                    className={filterOptionClass(selectedMovieType === item.name)}
                    onClick={() => setSelectedMovieType(item.name)}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                {t("movie.rating")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                {[allLabel, "P", "K", "T13", "T16", "T18"].map((item) => (
                  <li
                    key={item}
                    className={filterOptionClass(selectedRating === item)}
                    onClick={() => setSelectedRating(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex">
              <h4 className="font-semibold min-w-[100px] text-right">
                {t("movie.genre")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
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
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                {t("movieList.labels.version")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
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
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                {t("movieList.labels.production_year")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
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
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                {t("movieList.labels.sort")}:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
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
            <div className="mt-8 flex justify-start space-x-4">
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
