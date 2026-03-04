import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Banner from "../components/Banner";
import TrendingSection from "../components/TrendingSection";
import ShowMovies from "../components/ShowMovies";
import PageLoader from "../components/loading/PageLoader";
import { useGlobalLoading } from "../context/UnifiedLoadingContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { fetchJson, fetchMovies } from "../services/api";

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [moviesLoaded, setMoviesLoaded] = useState(false);
  const [allContentReady, setAllContentReady] = useState(false);
  const [homeMovies, setHomeMovies] = useState([]);
  const [topCategorySections, setTopCategorySections] = useState([]);
  const [topCountrySections, setTopCountrySections] = useState([]);
  const [topReviewedMovies, setTopReviewedMovies] = useState([]);
  const [topReviewEntries, setTopReviewEntries] = useState([]);
  const reviewSummaryCacheRef = useRef(new Map());
  const { updateProgress } = useGlobalLoading();

  // Set document title for homepage
  useDocumentTitle(t("home.title"));

  console.log("🏠 Home component mounted");

  // Check if both components are ready
  useEffect(() => {
    console.log("🏠 Home state check:", { bannerLoaded, moviesLoaded });
    if (bannerLoaded && moviesLoaded) {
      updateProgress(95, t("home.loading.finishing_ui"));
      console.log("✅ All content ready, finalizing...");

      // Small delay to ensure smooth transition
      setTimeout(() => {
        updateProgress(100, t("home.loading.completed"));
        setTimeout(() => {
          console.log("🚀 Home page fully loaded!");
          setAllContentReady(true);
        }, 200);
      }, 300);
    }
  }, [bannerLoaded, moviesLoaded, updateProgress, t]);

  const handleBannerLoaded = (success) => {
    console.log("🎬 Banner loaded:", success);
    setBannerLoaded(true);
  };

  const handleMoviesLoaded = (success) => {
    console.log("🎭 Movies loaded:", success);
    setMoviesLoaded(true);
  };

  useEffect(() => {
    let mounted = true;

    const buildHomeSections = async () => {
      try {
        const movies = await fetchMovies();
        if (!mounted) return;

        const safeMovies = Array.isArray(movies) ? movies : [];
        setHomeMovies(safeMovies);

        const categoryMap = new Map();
        const countryMap = new Map();

        safeMovies.forEach((movie) => {
          const categories = Array.isArray(movie?.movieCategories)
            ? movie.movieCategories
            : [];

          categories.forEach((category) => {
            if (!category?.id) return;
            const key = String(category.id);

            if (!categoryMap.has(key)) {
              categoryMap.set(key, {
                id: category.id,
                name: category.name || t("navigation.genres"),
                slug: category.slug || "",
                movies: [],
              });
            }

            categoryMap.get(key).movies.push(movie);
          });

          const country = movie?.country;
          if (country?.id) {
            const countryKey = String(country.id);

            if (!countryMap.has(countryKey)) {
              countryMap.set(countryKey, {
                id: country.id,
                name: country.name || t("header.countries"),
                slug: country.slug || "",
                movies: [],
              });
            }

            countryMap.get(countryKey).movies.push(movie);
          }
        });

        const topCategories = Array.from(categoryMap.values())
          .sort((a, b) => b.movies.length - a.movies.length)
          .slice(0, 2)
          .map((section) => ({
            ...section,
            movies: section.movies.slice(0, 18),
          }));

        const topCountries = Array.from(countryMap.values())
          .sort((a, b) => b.movies.length - a.movies.length)
          .slice(0, 2)
          .map((section) => ({
            ...section,
            movies: section.movies.slice(0, 18),
          }));

        setTopCategorySections(topCategories);
        setTopCountrySections(topCountries);

        const ratingCandidates = [...safeMovies]
          .sort((a, b) => (b?.views || 0) - (a?.views || 0))
          .slice(0, 12);

        const loadReviewHighlights = async () => {
          const reviewedCandidates = await Promise.all(
            ratingCandidates.map(async (movie) => {
              const cacheKey = String(movie.id);
              const cachedSummary = reviewSummaryCacheRef.current.get(cacheKey);

              if (cachedSummary) {
                return { ...movie, ...cachedSummary };
              }

              try {
                const [averageRes, reviewsRes] = await Promise.allSettled([
                  fetchJson(`/api/reviews/${movie.id}/average-rating`),
                  fetchJson(`/api/reviews/${movie.id}/reviews`),
                ]);

                const averageRating =
                  averageRes.status === "fulfilled"
                    ? Number(averageRes.value?.data ?? averageRes.value ?? 0)
                    : 0;
                const reviewsRaw =
                  reviewsRes.status === "fulfilled"
                    ? reviewsRes.value?.data || reviewsRes.value || []
                    : [];
                const reviews = Array.isArray(reviewsRaw) ? reviewsRaw : [];

                const summary = {
                  averageRating,
                  reviewCount: reviews.length,
                  reviews,
                };

                reviewSummaryCacheRef.current.set(cacheKey, summary);

                return {
                  ...movie,
                  ...summary,
                };
              } catch (error) {
                const fallback = {
                  averageRating: 0,
                  reviewCount: 0,
                  reviews: [],
                };
                reviewSummaryCacheRef.current.set(cacheKey, fallback);
                return {
                  ...movie,
                  ...fallback,
                };
              }
            }),
          );

          if (!mounted) return;

          const topReviewed = reviewedCandidates
            .filter((movie) => movie.averageRating > 0 || movie.reviewCount > 0)
            .sort((a, b) => {
              if (b.averageRating !== a.averageRating) {
                return b.averageRating - a.averageRating;
              }
              return b.reviewCount - a.reviewCount;
            })
            .slice(0, 6);

          setTopReviewedMovies(topReviewed);

          const reviewFeed = reviewedCandidates
            .flatMap((movie) =>
              (movie.reviews || []).map((review) => ({
                ...review,
                movieId: movie.id,
                movieTitle: movie.title,
                movieThumb: movie.thumb_url,
              })),
            )
            .filter((review) => review?.comment || review?.rating)
            .sort((a, b) => {
              if ((b?.rating || 0) !== (a?.rating || 0)) {
                return (b?.rating || 0) - (a?.rating || 0);
              }
              return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
            })
            .slice(0, 8);

          setTopReviewEntries(reviewFeed);
        };

        setTimeout(() => {
          loadReviewHighlights();
        }, 0);
      } catch (error) {
        if (!mounted) return;
        setHomeMovies([]);
        setTopCategorySections([]);
        setTopCountrySections([]);
        setTopReviewedMovies([]);
        setTopReviewEntries([]);
      }
    };

    buildHomeSections();

    return () => {
      mounted = false;
    };
  }, [t]);

  const rankedMovies = useMemo(() => {
    const reviewMap = new Map(
      topReviewedMovies.map((movie) => [
        String(movie.id),
        movie.averageRating || 0,
      ]),
    );

    const now = Date.now();

    return [...homeMovies]
      .map((movie) => {
        const views = Number(movie?.views || 0);
        const rating = Number(reviewMap.get(String(movie.id)) || 0);
        const isHot = Boolean(movie?.hot);

        const updatedAt = movie?.updatedAt
          ? new Date(movie.updatedAt).getTime()
          : 0;
        const diffDays =
          updatedAt > 0
            ? Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24))
            : 365;
        const recencyBoost = diffDays <= 7 ? 20 : diffDays <= 30 ? 10 : 0;

        const score =
          views * 0.02 + rating * 20 + (isHot ? 25 : 0) + recencyBoost;

        return {
          ...movie,
          averageRating: rating,
          rankingScore: Number(score.toFixed(2)),
        };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .slice(0, 10);
  }, [homeMovies, topReviewedMovies]);

  const maxRankingScore = useMemo(
    () =>
      rankedMovies.reduce(
        (max, movie) => Math.max(max, movie.rankingScore || 0),
        1,
      ),
    [rankedMovies],
  );

  // Show loading until both components are ready
  if (!allContentReady) {
    console.log("🏠 Home showing PageLoader");
    return (
      <>
        <PageLoader
          isVisible={true}
          message={t("home.loading.preparing_home")}
          progress={
            bannerLoaded && moviesLoaded
              ? 95
              : bannerLoaded || moviesLoaded
                ? 50
                : 10
          }
          showProgress={true}
        />
        {/* Render components in background to start loading */}
        <div style={{ display: "none" }}>
          <Banner onDataLoaded={handleBannerLoaded} />
          <ShowMovies onDataLoaded={handleMoviesLoaded} />
        </div>
      </>
    );
  }

  console.log("🏠 Home rendering main content");

  return (
    <div
      className="opacity-0"
      style={{
        animation: "fadeInHome 1s ease-out forwards",
      }}
    >
      <style>{`
        @keyframes fadeInHome {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>

      {/* Banner Section */}
      <Banner onDataLoaded={handleBannerLoaded} />

      {/* Trending Section */}
      <div className="container mx-auto px-4 py-8">
        <TrendingSection compact={true} maxItems={12} className="mb-8" />
      </div>

      {/* Top categories with varied layouts */}
      {topCategorySections.length > 0 && (
        <div className="container mx-auto px-4 py-8 space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {t("home.sections.by_category")}
          </h2>

          {topCategorySections[0] && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div
                className="lg:col-span-2 relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() =>
                  topCategorySections[0].movies[0]?.id &&
                  navigate(`/movie/${topCategorySections[0].movies[0].id}`)
                }
              >
                <img
                  src={
                    topCategorySections[0].movies[0]?.banner_url ||
                    topCategorySections[0].movies[0]?.thumb_url
                  }
                  alt={
                    topCategorySections[0].movies[0]?.title ||
                    topCategorySections[0].name
                  }
                  className="w-full h-[360px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="absolute bottom-0 left-0 p-5">
                  <p className="text-red-400 text-sm mb-1">
                    {t("home.featured_prefix")}: {topCategorySections[0].name}
                  </p>
                  <h3 className="text-white text-2xl font-bold line-clamp-2">
                    {topCategorySections[0].movies[0]?.title ||
                      t("home.featured_movie_fallback")}
                  </h3>
                  <button
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate("/allmovies", {
                        state: {
                          category: topCategorySections[0].name,
                          movies: topCategorySections[0].movies,
                          categoryId: topCategorySections[0].id,
                        },
                      });
                    }}
                  >
                    {t("home.view_all")}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {topCategorySections[0].movies.slice(1, 5).map((movie) => (
                  <button
                    key={`cat-spot-${movie.id}`}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 transition-colors"
                  >
                    <img
                      src={movie.thumb_url}
                      alt={movie.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="text-left">
                      <p className="text-white line-clamp-2 text-sm font-medium">
                        {movie.title}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {movie.release_year || t("home.not_available")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {topCategorySections[1] && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl text-white font-bold">
                  {topCategorySections[1].name}
                </h3>
                <button
                  onClick={() =>
                    navigate("/allmovies", {
                      state: {
                        category: topCategorySections[1].name,
                        movies: topCategorySections[1].movies,
                        categoryId: topCategorySections[1].id,
                      },
                    })
                  }
                  className="text-sm px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20"
                >
                  {t("home.view_all")}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {topCategorySections[1].movies.slice(0, 12).map((movie) => (
                  <button
                    key={`cat-grid-${movie.id}`}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    className="text-left"
                  >
                    <img
                      src={movie.thumb_url}
                      alt={movie.title}
                      className="w-full h-40 object-cover rounded-lg mb-2"
                    />
                    <p className="text-white text-sm line-clamp-2">
                      {movie.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top countries with varied layouts */}
      {topCountrySections.length > 0 && (
        <div className="container mx-auto px-4 py-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-5">
            {t("home.sections.by_country")}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topCountrySections.map((section) => (
              <div
                key={`country-section-${section.id}`}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl text-white font-bold">
                    {section.name}
                  </h3>
                  <button
                    onClick={() =>
                      navigate("/allmovies", {
                        state: {
                          category: section.name,
                          movies: section.movies,
                          categoryId: section.id,
                        },
                      })
                    }
                    className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    {t("home.view_all")}
                  </button>
                </div>

                <div className="space-y-2">
                  {section.movies.slice(0, 5).map((movie, index) => (
                    <button
                      key={`country-movie-${movie.id}`}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10"
                    >
                      <span className="text-gray-400 w-6 text-sm">
                        #{index + 1}
                      </span>
                      <img
                        src={movie.thumb_url}
                        alt={movie.title}
                        className="w-14 h-16 object-cover rounded"
                      />
                      <div className="text-left">
                        <p className="text-white text-sm line-clamp-2">
                          {movie.title}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {Number(movie.views || 0).toLocaleString()}{" "}
                          {t("home.views")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movies Section */}
      <ShowMovies onDataLoaded={handleMoviesLoaded} />

      {/* User review highlight cards */}
      {(topReviewedMovies.length > 0 || topReviewEntries.length > 0) && (
        <div className="container mx-auto px-4 py-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            {t("home.sections.community_reviews")}
          </h2>

          {/* Grid cho top reviewed movies với rating & count */}
          {topReviewedMovies.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {topReviewedMovies.map((movie) => (
                <div
                  key={`review-${movie.id}`}
                  className="flex flex-col justify-between bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex">
                    <img
                      src={movie.thumb_url}
                      alt={movie.title}
                      className=" h-48 object-cover object-top"
                    />
                    <div className="p-4">
                      <h3 className="text-white font-semibold text-lg line-clamp-2 mb-2">
                        {movie.title}
                      </h3>
                      <div className="flex items-center mb-3 gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded bg-yellow-600/30 text-yellow-200 text-sm font-medium">
                          ⭐ {movie.averageRating.toFixed(1)} / 5
                        </span>
                        <span className="text-sm text-gray-300">
                          ({movie.reviewCount} {t("home.reviews")})
                        </span>
                      </div>

                      {/* Hiển thị 1-2 review mẫu liên quan nếu có (lọc từ topReviewEntries dựa trên movieId) */}
                      <div className="space-y-3 mb-4">
                        {topReviewEntries
                          .filter((review) => review.movieId === movie.id)
                          .slice(0, 3)
                          .map((review, idx) => (
                            <div
                              key={idx}
                              className="bg-white/5 p-3 rounded-lg"
                            >
                              <span className="inline-flex items-center px-2 py-1 rounded bg-blue-600/30 text-blue-200 text-xs font-medium mb-1">
                                {review.rating || 0}/5
                              </span>
                              <p className="text-gray-300 text-sm line-clamp-3">
                                {review.comment ||
                                  t("home.defaults.positive_review")}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-bl-lg rounded-br-lg transition-colors font-medium"
                  >
                    {t("home.buttons.view_top_rated_movie")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Nếu còn review không thuộc phim top, hiển thị ở dưới như feed bổ sung */}
          {topReviewEntries.filter(
            (review) =>
              !topReviewedMovies.some((movie) => movie.id === review.movieId),
          ).length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                {t("home.sections.more_community_reviews")}{" "}
                {/* Subheader cho review bổ sung */}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {topReviewEntries
                  .filter(
                    (review) =>
                      !topReviewedMovies.some(
                        (movie) => movie.id === review.movieId,
                      ),
                  )
                  .map((review, index) => (
                    <div
                      key={`review-feed-${review.movieId}-${index}`}
                      className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-blue-600/30 text-blue-200 text-sm font-medium">
                          {t("home.rating")}: {review.rating || 0}/5
                        </span>
                      </div>
                      <p className="text-gray-200 text-sm line-clamp-4 min-h-[80px]">
                        {review.comment || t("home.defaults.positive_review")}
                      </p>
                      <button
                        onClick={() => navigate(`/movie/${review.movieId}`)}
                        className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-medium"
                      >
                        {t("home.buttons.view_movie")}: {review.movieTitle}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranking chart với thumbnail và thông tin bổ sung */}
      {rankedMovies.length > 0 && (
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-5">
            {t("home.sections.top10_chart")}
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-6">
            {rankedMovies.map((movie, index) => {
              const scorePercent = Math.max(
                8,
                Math.round(((movie.rankingScore || 0) / maxRankingScore) * 100),
              );

              return (
                <div
                  key={`chart-rank-${movie.id}`}
                  className="flex items-start gap-4 bg-black/30 p-4 rounded-xl hover:bg-black/50 transition-colors"
                >
                  {/* Thumbnail phim ở đầu row */}
                  <img
                    src={movie.thumb_url}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded-md shadow-md"
                  />

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => navigate(`/movie/${movie.id}`)}
                        className="text-left text-white hover:text-red-400 font-semibold text-lg"
                      >
                        #{index + 1} • {movie.title}
                      </button>
                      <div className="text-right text-sm text-gray-300">
                        <span className="mr-3">
                          {Number(movie.views || 0).toLocaleString()}{" "}
                          {t("home.views")}
                        </span>
                        <span>
                          {movie.rankingScore} {t("home.points")}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>

                    {/* Thông tin bổ sung: Rating với stars icon, Featured badge, và có thể thêm year nếu data có (giả sử thêm placeholder) */}
                    <div className="mt-1 text-xs text-gray-400 flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        ⭐{" "}
                        {movie.averageRating
                          ? movie.averageRating.toFixed(1)
                          : "-"}{" "}
                        / 5
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${movie.hot ? "bg-green-600/30 text-green-300" : "bg-gray-600/30 text-gray-300"}`}
                      >
                        {movie.hot
                          ? t("home.featured")
                          : t("home.not_featured")}
                      </span>

                      <span>
                        {movie.release_year ? `Năm: ${movie.release_year}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
