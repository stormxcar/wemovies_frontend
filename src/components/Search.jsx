import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MovieList from "./MovieList";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { fetchMovies } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

function Search() {
  const { state } = useLocation();
  const searchedMovies = Array.isArray(state?.movies) ? state.movies : [];
  const keyword = (state?.query || "").trim();
  const [suggestedMovies, setSuggestedMovies] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { t } = useTranslation();
  const { themeClasses, isDarkMode } = useTheme();

  useEffect(() => {
    const loadSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const movies = await fetchMovies();
        const safeMovies = Array.isArray(movies) ? movies : [];

        const boosted = [...safeMovies]
          .sort((a, b) => {
            const scoreA = Number(a?.views || 0) + (a?.hot ? 1000 : 0);
            const scoreB = Number(b?.views || 0) + (b?.hot ? 1000 : 0);
            return scoreB - scoreA;
          })
          .slice(0, 24);

        setSuggestedMovies(boosted);
      } catch {
        setSuggestedMovies([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    loadSuggestions();
  }, []);

  const displayMovies =
    searchedMovies.length > 0 ? searchedMovies : suggestedMovies;

  const topPopularMovies = useMemo(
    () =>
      [...suggestedMovies]
        .sort((a, b) => (b?.views || 0) - (a?.views || 0))
        .slice(0, 12),
    [suggestedMovies],
  );

  const recentlyUpdatedMovies = useMemo(
    () =>
      [...suggestedMovies]
        .sort(
          (a, b) =>
            new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
            new Date(a?.updatedAt || a?.createdAt || 0).getTime(),
        )
        .slice(0, 12),
    [suggestedMovies],
  );

  const hotMovies = useMemo(
    () => suggestedMovies.filter((movie) => Boolean(movie?.hot)).slice(0, 12),
    [suggestedMovies],
  );

  const categoryRows = useMemo(() => {
    const categoryMap = new Map();

    suggestedMovies.forEach((movie) => {
      const categories = Array.isArray(movie?.movieCategories)
        ? movie.movieCategories
        : [];

      categories.forEach((category) => {
        const name = category?.name;
        if (!name) return;

        if (!categoryMap.has(name)) {
          categoryMap.set(name, []);
        }

        if (categoryMap.get(name).length < 12) {
          categoryMap.get(name).push(movie);
        }
      });
    });

    return [...categoryMap.entries()]
      .filter(([, movies]) => movies.length >= 4)
      .slice(0, 3)
      .map(([name, movies]) => ({ name, movies }));
  }, [suggestedMovies]);

  const topicRows = useMemo(() => {
    const rows = [
      {
        key: "popular",
        title: t("search.popular_now"),
        movies: topPopularMovies,
      },
      {
        key: "updated",
        title: t("search.newly_updated"),
        movies: recentlyUpdatedMovies,
      },
    ];

    if (hotMovies.length > 0) {
      rows.unshift({
        key: "hot",
        title: t("search.hot_now"),
        movies: hotMovies,
      });
    }

    categoryRows.forEach((row) => {
      rows.push({
        key: `category-${row.name}`,
        title: t("search.by_category", { category: row.name }),
        movies: row.movies,
      });
    });

    return rows;
  }, [categoryRows, hotMovies, recentlyUpdatedMovies, t, topPopularMovies]);

  // Set document title for search page
  useDocumentTitle(t("common.search"));

  const SpotlightRow = ({ title, movies, rowKey }) => {
    if (!Array.isArray(movies) || movies.length === 0) return null;

    return (
      <section className="mb-8">
        <h3 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-4`}>
          {title}
        </h3>
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={12}
          slidesPerView={2.1}
          breakpoints={{
            640: { slidesPerView: 3.1 },
            1024: { slidesPerView: 4.2 },
            1280: { slidesPerView: 5.2 },
          }}
          className={`search-row-${rowKey}`}
        >
          {movies.map((movie) => (
            <SwiperSlide key={`${rowKey}-${movie.id}`}>
              <Link
                to={`/movie/${movie.id}`}
                className={`block rounded-lg overflow-hidden border transition-colors ${
                  isDarkMode
                    ? "bg-gray-800/70 border-gray-700 hover:border-blue-500"
                    : "bg-white border-gray-200 hover:border-blue-500"
                }`}
              >
                <img
                  src={movie.thumb_url || movie.banner_url}
                  alt={movie.title}
                  className="w-full h-44 object-cover"
                />
                <div className="p-2">
                  <p className={`text-sm ${themeClasses.textPrimary} line-clamp-1`}>
                    {movie.title}
                  </p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>
                    {(movie.release_year || movie.year || "N/A") + " • "}
                    {Number(movie.views || 0).toLocaleString()}{" "}
                    {t("home.views")}
                  </p>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    );
  };

  return (
    <div
      className={`${themeClasses.primary} ${themeClasses.textPrimary} px-4 md:px-10 w-full pt-20 min-h-screen`}
    >
      <div className="max-w-7xl mx-auto">
        <section
          className={`mb-8 rounded-2xl border ${themeClasses.borderLight} ${
            isDarkMode
              ? "bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/20"
              : "bg-gradient-to-r from-blue-100/80 via-indigo-100/70 to-purple-100/80"
          } p-5 mt-8 md:p-7`}
        >
          <p className="text-sm text-blue-300 mb-2">
            {t("search.explore_title")}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {searchedMovies.length > 0
              ? t("search.result_for", { keyword })
              : t("search.suggestion_title")}
          </h2>
          <p className={themeClasses.textSecondary}>
            {searchedMovies.length > 0
              ? t("search.found_count", { count: searchedMovies.length })
              : t("search.suggestion_subtitle")}
          </p>
        </section>

        {searchedMovies.length === 0 && (
          <>
            {topicRows.map((row) => (
              <SpotlightRow
                key={row.key}
                rowKey={row.key}
                title={row.title}
                movies={row.movies}
              />
            ))}
          </>
        )}

        <div>
          {loadingSuggestions && searchedMovies.length === 0 ? (
            <p className={themeClasses.textMuted}>{t("common.loading")}</p>
          ) : displayMovies.length > 0 ? (
            <MovieList movies={displayMovies} title={t("common.search")} />
          ) : (
            <p>{t("search.no_results")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;
