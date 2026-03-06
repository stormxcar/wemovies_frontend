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

const HOME_MAX_BLOCKING_LOADER_MS = 12000;

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
  const homeLoadStartRef = useRef(performance.now());
  const { updateProgress } = useGlobalLoading();

  const loadingMessages = useMemo(
    () => [
      t("loading.movie_tip_1"),
      t("loading.movie_tip_2"),
      t("loading.movie_tip_3"),
      t("loading.movie_tip_4"),
    ],
    [t],
  );

  useEffect(() => {
    const startedAt = homeLoadStartRef.current;
    console.info("[Home] Loading started", {
      startedAt,
    });
  }, []);

  useEffect(() => {
    if (allContentReady) return;

    const unlockTimer = window.setTimeout(() => {
      console.warn("[Home] Fail-open activated to avoid blocking UI", {
        timeoutMs: HOME_MAX_BLOCKING_LOADER_MS,
        bannerLoaded,
        moviesLoaded,
        elapsedMs: Math.round(performance.now() - homeLoadStartRef.current),
      });
      updateProgress(100, t("home.loading.completed"));
      setAllContentReady(true);
    }, HOME_MAX_BLOCKING_LOADER_MS);

    return () => {
      window.clearTimeout(unlockTimer);
    };
  }, [allContentReady, bannerLoaded, moviesLoaded, t, updateProgress]);

  // Set document title for homepage
  useDocumentTitle(t("home.title"));

  // Check if both components are ready
  useEffect(() => {
    if (bannerLoaded && moviesLoaded) {
      const totalMs = Math.round(performance.now() - homeLoadStartRef.current);
      console.info("[Home] Core sections ready", {
        bannerLoaded,
        moviesLoaded,
        totalMs,
      });

      updateProgress(95, t("home.loading.finishing_ui"));
      // Small delay to ensure smooth transition
      setTimeout(() => {
        updateProgress(100, t("home.loading.completed"));
        setTimeout(() => {
          setAllContentReady(true);
          console.info("[Home] Page visible", {
            visibleAfterMs: Math.round(
              performance.now() - homeLoadStartRef.current,
            ),
          });
        }, 200);
      }, 300);
    }
  }, [bannerLoaded, moviesLoaded, updateProgress, t]);

  const handleBannerLoaded = (success) => {
    console.info("[Home] Banner loaded callback", {
      success,
      elapsedMs: Math.round(performance.now() - homeLoadStartRef.current),
    });
    setBannerLoaded(true);
  };

  const handleMoviesLoaded = (success) => {
    console.info("[Home] ShowMovies loaded callback", {
      success,
      elapsedMs: Math.round(performance.now() - homeLoadStartRef.current),
    });
    setMoviesLoaded(true);
  };

  useEffect(() => {
    let mounted = true;

    const buildHomeSections = async () => {
      const sectionStart = performance.now();
      try {
        const movies = await fetchMovies();
        const durationMs = Math.round(performance.now() - sectionStart);
        console.info("[Home] buildHomeSections fetchMovies completed", {
          durationMs,
          count: Array.isArray(movies) ? movies.length : 0,
        });

        if (durationMs > 10000) {
          console.warn("[Home] fetchMovies is very slow", {
            durationMs,
          });
        }

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
          .slice(0, 3)
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
        console.error("[Home] buildHomeSections failed", {
          durationMs: Math.round(performance.now() - sectionStart),
          error,
        });
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

  const topRankChartData = useMemo(
    () => rankedMovies.slice(0, 6),
    [rankedMovies],
  );

  const topRankSummary = useMemo(() => {
    if (rankedMovies.length === 0) {
      return {
        totalViews: 0,
        avgRating: 0,
      };
    }

    const totalViews = rankedMovies.reduce(
      (sum, movie) => sum + Number(movie?.views || 0),
      0,
    );
    const avgRatingRaw = rankedMovies.reduce(
      (sum, movie) => sum + Number(movie?.averageRating || 0),
      0,
    );

    return {
      totalViews,
      avgRating: Number((avgRatingRaw / rankedMovies.length).toFixed(1)),
    };
  }, [rankedMovies]);

  const topRankExtras = useMemo(() => {
    const hottestCount = rankedMovies.filter((movie) =>
      Boolean(movie?.hot),
    ).length;
    const bestScoreMovie = rankedMovies[0] || null;
    const bestRatedMovie =
      [...rankedMovies].sort(
        (a, b) => Number(b?.averageRating || 0) - Number(a?.averageRating || 0),
      )[0] || null;

    return {
      hottestCount,
      bestScoreMovie,
      bestRatedMovie,
    };
  }, [rankedMovies]);

  const topRankComboChart = useMemo(() => {
    const chartData = topRankChartData;
    const width = 860;
    const height = 460;
    const padding = { top: 36, right: 24, bottom: 54, left: 44 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const hasViewsData = chartData.some(
      (movie) => Number(movie?.views || 0) > 0,
    );
    const barMetric = hasViewsData
      ? chartData.map((movie) => Number(movie?.views || 0))
      : chartData.map((movie) => Number(movie?.rankingScore || 0));
    const maxViews = Math.max(1, ...barMetric);
    const maxRating = Math.max(
      1,
      ...chartData.map((movie) => Number(movie?.averageRating || 0)),
      5,
    );

    const slotWidth = chartData.length > 0 ? innerWidth / chartData.length : 0;
    const barWidth = Math.max(18, Math.min(52, slotWidth * 0.55));

    const bars = chartData.map((movie, index) => {
      const value = barMetric[index] || 0;
      const valueRatio = value / maxViews;
      const barHeight = valueRatio * innerHeight;
      const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
      const y = padding.top + innerHeight - barHeight;

      return {
        id: movie.id,
        label: `#${index + 1}`,
        x,
        y,
        barWidth,
        barHeight: Math.max(4, barHeight),
      };
    });

    const points = chartData.map((movie, index) => {
      const rating = Number(movie?.averageRating || 0);
      const valueRatio = rating / maxRating;
      const x = padding.left + index * slotWidth + slotWidth / 2;
      const y = padding.top + innerHeight - valueRatio * innerHeight;
      return { x, y, rating };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" ");

    return {
      width,
      height,
      padding,
      innerHeight,
      bars,
      points,
      linePath,
      maxViews,
      maxRating,
      hasViewsData,
      labels: [0, 0.25, 0.5, 0.75, 1],
    };
  }, [topRankChartData]);

  // Show loading until both components are ready
  if (!allContentReady) {
    return (
      <>
        <PageLoader
          isVisible={true}
          messages={loadingMessages}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                              <span className="inline-flex items-center px-2 py-1 rounded bg-orange-600/30 text-orange-200 text-xs font-medium mb-1">
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
                        <span className="inline-flex items-center px-2 py-1 rounded bg-orange-600/30 text-orange-200 text-sm font-medium">
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
              {rankedMovies.map((movie, index) => {
                const scorePercent = Math.max(
                  8,
                  Math.round(
                    ((movie.rankingScore || 0) / maxRankingScore) * 100,
                  ),
                );

                return (
                  <div
                    key={`chart-rank-${movie.id}`}
                    className="flex items-start gap-3 sm:gap-4 bg-black/30 p-3 sm:p-4 rounded-xl hover:bg-black/50 transition-colors"
                  >
                    <img
                      src={movie.thumb_url}
                      alt={movie.title}
                      className="w-14 h-20 sm:w-16 sm:h-24 object-cover rounded-md shadow-md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
                        <button
                          onClick={() => navigate(`/movie/${movie.id}`)}
                          className="text-left text-white hover:text-red-400 font-semibold text-base sm:text-lg line-clamp-1"
                        >
                          #{index + 1} • {movie.title}
                        </button>
                        <div className="text-left sm:text-right text-xs sm:text-sm text-gray-300">
                          <span className="mr-2 sm:mr-3">
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

                      <div className="mt-1 text-xs text-gray-400 flex items-center gap-3 sm:gap-4 flex-wrap">
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
                          {movie.release_year
                            ? `Năm: ${movie.release_year}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="bg-gradient-to-br from-red-950/45 via-black/60 to-orange-950/35 border border-orange-200/20 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
              <h3 className="text-white text-lg font-semibold mb-4">
                {t("home.overview", { defaultValue: "Tổng quan Top 10" })}
              </h3>

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-sm">
                  <span className="text-gray-300">Top 10 lượt xem</span>
                  <span className="text-white font-semibold">
                    {topRankSummary.totalViews.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-sm">
                  <span className="text-gray-300">Rating trung bình</span>
                  <span className="text-white font-semibold">
                    {topRankSummary.avgRating}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-sm">
                  <span className="text-gray-300">Phim HOT</span>
                  <span className="text-white font-semibold">
                    {topRankExtras.hottestCount}
                  </span>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                  <p className="text-gray-400">Top theo điểm</p>
                  <p className="text-orange-300 font-semibold line-clamp-1">
                    {topRankExtras.bestScoreMovie?.title || "N/A"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                  <p className="text-gray-400">Top theo rating</p>
                  <p className="text-amber-200 font-semibold line-clamp-1">
                    {topRankExtras.bestRatedMovie?.title || "N/A"}
                  </p>
                </div>
              </div>

              <div className="relative rounded-xl border border-white/10 bg-black/35 p-3">
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.2),transparent_60%)]" />

                <svg
                  viewBox={`0 0 ${topRankComboChart.width} ${topRankComboChart.height}`}
                  className="relative z-10 w-full h-[280px] sm:h-[340px]"
                  role="img"
                  aria-label="Top 10 combo chart"
                >
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f97316"
                        stopOpacity="0.95"
                      />
                      <stop
                        offset="55%"
                        stopColor="#ef4444"
                        stopOpacity="0.82"
                      />
                      <stop
                        offset="100%"
                        stopColor="#7f1d1d"
                        stopOpacity="0.45"
                      />
                    </linearGradient>
                    <linearGradient
                      id="lineGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fb7185" />
                    </linearGradient>
                  </defs>

                  {topRankComboChart.labels.map((step, index) => {
                    const y =
                      topRankComboChart.padding.top +
                      topRankComboChart.innerHeight -
                      topRankComboChart.innerHeight * step;
                    return (
                      <g key={`grid-${index}`}>
                        <line
                          x1={topRankComboChart.padding.left}
                          x2={
                            topRankComboChart.width -
                            topRankComboChart.padding.right
                          }
                          y1={y}
                          y2={y}
                          stroke="rgba(255,255,255,0.14)"
                          strokeDasharray="5 6"
                        />
                      </g>
                    );
                  })}

                  {topRankComboChart.bars.map((bar) => (
                    <g key={`combo-bar-${bar.id}`}>
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.barWidth}
                        height={bar.barHeight}
                        rx="6"
                        fill="url(#barGradient)"
                      />
                      <text
                        x={bar.x + bar.barWidth / 2}
                        y={topRankComboChart.height - 20}
                        textAnchor="middle"
                        className="fill-gray-300"
                        fontSize="12"
                      >
                        {bar.label}
                      </text>
                    </g>
                  ))}

                  {topRankComboChart.linePath ? (
                    <path
                      d={topRankComboChart.linePath}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  ) : null}

                  {topRankComboChart.points.map((point, index) => (
                    <g key={`combo-point-${index}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="4.2"
                        fill="#fef08a"
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="9"
                        fill="rgba(254,240,138,0.2)"
                      />
                    </g>
                  ))}
                </svg>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-2 text-orange-300">
                    <span className="h-2 w-2 rounded-full bg-orange-400" />
                    Cột:{" "}
                    {topRankComboChart.hasViewsData
                      ? t("home.views")
                      : t("home.points")}
                  </span>
                  <span className="inline-flex items-center gap-2 text-amber-200">
                    <span className="h-[2px] w-4 bg-amber-300" /> Đường: Rating
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
