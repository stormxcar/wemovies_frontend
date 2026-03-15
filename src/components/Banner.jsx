import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LazyMotion,
  domAnimation,
  m as motion,
  AnimatePresence,
} from "framer-motion";
import { Link } from "react-router-dom";
import { FaHeart, FaPlay, FaRegHeart, FaStar } from "react-icons/fa";
import { toast } from "@toast";
import SkeletonWrapper from "./SkeletonWrapper";
import { fetchJson, fetchMovieByHot } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useGlobalLoading } from "../context/UnifiedLoadingContext";
import { useAuth } from "../context/AuthContext";

const AUTOPLAY_DURATION = 6000;
const TRANSITION_EASE = [0.65, 0, 0.35, 1];
const TRANSITION_DURATION = 0.6; // giảm nhẹ để mượt hơn
const BANNER_CACHE_KEY = "wemovies_banner_cache_v1";
const BANNER_READY_TIMEOUT_MS = 1200;
const VIDEO_LOAD_DELAY_MS = 250;
const TRAILER_HOVER_INTENT_MIN_DELAY_MS = 5000;
const TRAILER_HOVER_INTENT_MAX_DELAY_MS = 8000;

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:.*[?&]v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (!match?.[1]) return null;
  return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3`;
};

const pickHeroMovies = (data) =>
  (Array.isArray(data) ? data : [])
    .filter(
      (movie) =>
        Boolean(movie?.id) &&
        Boolean(
          movie?.banner_url ||
          movie?.poster_url ||
          movie?.thumb_url ||
          movie?.thumbnail_url,
        ),
    )
    .sort(() => 0.5 - Math.random())
    .slice(0, 8);

const readBannerCache = () => {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.sessionStorage.getItem(BANNER_CACHE_KEY);
    if (!raw) return [];
    return pickHeroMovies(JSON.parse(raw));
  } catch {
    return [];
  }
};

const writeBannerCache = (movies) => {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(BANNER_CACHE_KEY, JSON.stringify(movies));
  } catch {}
};

const formatDuration = (movie) => {
  const minutes = Number(
    movie?.duration ||
      movie?.durationMinutes ||
      movie?.runtime ||
      movie?.runtimeMinutes,
  );
  if (!minutes || Number.isNaN(minutes)) return "N/A";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatReleaseYear = (movie) => {
  const rawDate =
    movie?.release_date ||
    movie?.releaseDate ||
    movie?.release_year ||
    movie?.publishedAt;
  if (!rawDate) return "N/A";

  if (typeof rawDate === "number" || /^\d{4}$/.test(String(rawDate))) {
    return String(rawDate).slice(0, 4);
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "N/A";
  return String(date.getFullYear());
};

const getMovieRating = (movie) => {
  const value = Number(
    movie?.rating || movie?.voteAverage || movie?.imdbRating,
  );
  return !value || Number.isNaN(value) ? "N/A" : value.toFixed(1);
};

const getMovieCategories = (movie) => {
  const categories = Array.isArray(movie?.movieCategories)
    ? movie.movieCategories.map((item) => item?.name).filter(Boolean)
    : [];
  return [...new Set(categories)];
};

const getMovieTypes = (movie) => {
  const types = Array.isArray(movie?.movieTypes)
    ? movie.movieTypes.map((item) => item?.name).filter(Boolean)
    : [];
  return [...new Set(types)];
};

const getMovieDescription = (movie) => {
  const source = movie?.description || movie?.overview || "";
  return source.length <= 220 ? source : `${source.slice(0, 220)}...`;
};

const MetadataRow = memo(({ movie }) => {
  const categories = getMovieCategories(movie);
  const types = getMovieTypes(movie);
  const releaseYear = formatReleaseYear(movie);
  const rating = getMovieRating(movie);
  const duration = formatDuration(movie);
  const ageRating =
    movie?.ageRating ||
    movie?.age_rating ||
    movie?.rated ||
    movie?.limitAge ||
    movie?.censorship ||
    "";
  const country =
    movie?.country?.name ||
    movie?.countryName ||
    (Array.isArray(movie?.countries)
      ? movie.countries
          .map((c) => c?.name)
          .filter(Boolean)
          .join(" • ")
      : "");

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs md:text-sm text-white">
      {releaseYear !== "N/A" && (
        <span className="rounded-full border border-orange-300/60 bg-gradient-to-r from-orange-500/40 to-red-600/40 px-3 py-1 text-white font-semibold shadow-[0_0_0_1px_rgba(251,146,60,0.2)]">
          {releaseYear}
        </span>
      )}
      {rating !== "N/A" && (
        <span className="rounded-full border border-orange-300/60 bg-gradient-to-r from-orange-500/40 to-red-600/40 px-3 py-1 inline-flex items-center gap-1 text-white font-semibold shadow-[0_0_0_1px_rgba(251,146,60,0.2)]">
          <FaStar className="text-amber-400" /> {rating}
        </span>
      )}
      {duration !== "N/A" && (
        <span className="rounded-full border border-orange-300/60 bg-gradient-to-r from-orange-500/40 to-red-600/40 px-3 py-1 text-white font-semibold shadow-[0_0_0_1px_rgba(251,146,60,0.2)]">
          {duration}
        </span>
      )}
      {ageRating && (
        <span className="rounded-full border border-orange-300/60 bg-gradient-to-r from-orange-500/40 to-red-600/40 px-3 py-1 text-white font-semibold shadow-[0_0_0_1px_rgba(251,146,60,0.2)]">
          {ageRating}
        </span>
      )}
      {types.map((type) => (
        <span
          key={`type-${type}`}
          className="rounded-full border border-orange-300/60 bg-gradient-to-r from-orange-500/40 to-red-600/40 px-3 py-1 text-white font-semibold shadow-[0_0_0_1px_rgba(251,146,60,0.2)]"
        >
          {type}
        </span>
      ))}
      {categories.map((category) => (
        <span
          key={`category-${category}`}
          className="rounded-full border border-orange-300/60 bg-gradient-to-r from-orange-500/40 to-red-600/40 px-3 py-1 text-white font-semibold shadow-[0_0_0_1px_rgba(251,146,60,0.2)]"
        >
          {category}
        </span>
      ))}
      {country && (
        <span className="rounded-full border border-orange-300/60 bg-gradient-to-r from-orange-500/40 to-red-600/40 px-3 py-1 text-white font-semibold shadow-[0_0_0_1px_rgba(251,146,60,0.2)]">
          {country}
        </span>
      )}
    </div>
  );
});

const ThumbnailStrip = memo(
  ({
    movies,
    activeIndex,
    onSelect,
    onHoverStart,
    onHoverEnd,
    containerRef,
  }) => {
    const visibleEntries = useMemo(() => {
      const total = movies.length;
      if (total === 0) return [];

      const size = Math.min(4, total);
      return Array.from({ length: size }, (_, offset) => {
        const index = (activeIndex + offset) % total;
        return { movie: movies[index], index };
      });
    }, [activeIndex, movies]);

    return (
      <div
        ref={containerRef}
        className="absolute bottom-3 left-3 right-3 md:bottom-4 md:right-4 md:left-auto z-[110] pointer-events-auto"
      >
        <div className="flex gap-3 pb-1 pr-1 md:max-w-[46vw] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-4 pl-4 ">
          {visibleEntries.map(({ movie, index }) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={movie.id || `${movie.title}-${index}`}
                type="button"
                onClick={() => onSelect(index)}
                onMouseEnter={onHoverStart}
                onMouseLeave={onHoverEnd}
                onFocus={onHoverStart}
                onBlur={onHoverEnd}
                className={`relative shrink-0 h-[68px] w-[120px] sm:h-[78px] sm:w-[140px] rounded-lg overflow-hidden border transition-all duration-300 ${
                  isActive
                    ? "border-white scale-110 shadow-[0_0_0_2px_rgba(255,255,255,0.35)]"
                    : "border-white/30 hover:scale-105"
                }`}
              >
                <img
                  src={
                    movie?.banner_url ||
                    movie?.poster_url ||
                    movie?.thumb_url ||
                    movie?.thumbnail_url
                  }
                  alt={movie?.title || "movie"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${isActive ? "opacity-30" : "opacity-70"}`}
                />
                <span className="absolute bottom-1 left-2 right-2 text-[10px] sm:text-xs text-white text-left line-clamp-1">
                  {movie?.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);

function Banner({ onDataLoaded }) {
  const [movies, setMovies] = useState(readBannerCache);
  const [loading, setLoading] = useState(movies.length === 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isTrailerHover, setIsTrailerHover] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [watchLaterIds, setWatchLaterIds] = useState(new Set());
  const [addingMovieId, setAddingMovieId] = useState(null);

  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const thumbnailRef = useRef(null);
  const hoverIntentTimeoutRef = useRef(null);
  const activeVideoRef = useRef(null);
  const initRunCountRef = useRef(0);
  const onDataLoadedRef = useRef(onDataLoaded);
  const hasReportedReadyRef = useRef(false);
  const bannerStartRef = useRef(performance.now());

  const { setComponentsLoaded, updateProgress } = useGlobalLoading();
  const { isAuthenticated } = useAuth();
  const { themeClasses } = useTheme();
  const { t } = useTranslation();

  const canAutoplay =
    movies.length > 1 && !isUserInteracting && !isTrailerHover;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleMediaChange = () => {
      const desktop = mediaQuery.matches;
      setIsDesktop(desktop);
      if (!desktop) {
        clearHoverIntentTimer();
        setIsTrailerHover(false);
      }
    };

    handleMediaChange();
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
  }, [onDataLoaded]);

  const reportBannerReadyOnce = useCallback(
    (reason = "unknown") => {
      if (hasReportedReadyRef.current) return;
      hasReportedReadyRef.current = true;
      console.info("[Banner] Marked as ready", {
        reason,
        elapsedMs: Math.round(performance.now() - bannerStartRef.current),
      });
      setComponentsLoaded((prev) => ({ ...prev, banner: true }));
      onDataLoadedRef.current?.(true);
    },
    [setComponentsLoaded],
  );

  useEffect(() => {
    let isMounted = true;
    let readyTimeoutId = null;
    initRunCountRef.current += 1;
    const runId = initRunCountRef.current;
    const hasCache = movies.length > 0;

    console.info("[Banner] Init start", {
      runId,
      hasCache,
      cacheCount: movies.length,
    });

    if (hasCache) {
      setLoading(false);
      reportBannerReadyOnce("cache-hit");
    } else {
      readyTimeoutId = window.setTimeout(() => {
        if (isMounted) {
          console.warn("[Banner] Ready timeout fallback fired", {
            runId,
            timeoutMs: BANNER_READY_TIMEOUT_MS,
            elapsedMs: Math.round(performance.now() - bannerStartRef.current),
          });
          reportBannerReadyOnce("ready-timeout-fallback");
        }
      }, BANNER_READY_TIMEOUT_MS);
    }

    const loadMovies = async () => {
      const fetchStart = performance.now();
      if (movies.length === 0) setLoading(true);
      updateProgress(85, t("home.loading.banner"));

      try {
        const hotMovies = await fetchMovieByHot({
          page: 0,
          size: 12,
          sortDir: "desc",
        });
        if (!isMounted) return;
        const validMovies = pickHeroMovies(hotMovies || []);
        console.info("[Banner] fetchMovies completed", {
          runId,
          durationMs: Math.round(performance.now() - fetchStart),
          totalMovies: Array.isArray(hotMovies) ? hotMovies.length : 0,
          validMovies: validMovies.length,
        });
        setMovies(validMovies);
        writeBannerCache(validMovies);
        if (validMovies.length > 0) {
          reportBannerReadyOnce("fetch-success");
        } else {
          console.warn("[Banner] fetchMovies returned no valid hero movies", {
            runId,
          });
          reportBannerReadyOnce("fetch-empty");
        }
      } catch (error) {
        console.error("[Banner] fetchMovies failed", {
          runId,
          durationMs: Math.round(performance.now() - fetchStart),
          error,
        });
        reportBannerReadyOnce("fetch-error");
      } finally {
        if (isMounted) setLoading(false);
        if (readyTimeoutId) window.clearTimeout(readyTimeoutId);
      }
    };

    loadMovies();

    return () => {
      isMounted = false;
      console.info("[Banner] Init cleanup", {
        runId,
      });
      if (readyTimeoutId) window.clearTimeout(readyTimeoutId);
    };
  }, [reportBannerReadyOnce, t, updateProgress]);

  useEffect(() => {
    const loadWatchLater = async () => {
      if (!isAuthenticated) return setWatchLaterIds(new Set());
      try {
        const data = await fetchJson("/api/schedules/watch-later");
        const ids = Array.isArray(data)
          ? data.map((item) => item?.movie?.id || item?.movieId).filter(Boolean)
          : [];
        setWatchLaterIds(new Set(ids));
      } catch {
        setWatchLaterIds(new Set());
      }
    };
    loadWatchLater();
  }, [isAuthenticated]);

  const activeMovie = useMemo(
    () => movies[activeIndex] || null,
    [movies, activeIndex],
  );
  const movieTrailer = activeMovie?.trailer || "";

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.info("[Banner] Thumbnail strip updated", {
      moviesCount: movies.length,
      activeIndex,
      trailerHover: isTrailerHover,
      shouldLoadVideo,
    });
  }, [activeIndex, isTrailerHover, movies.length, shouldLoadVideo]);

  useEffect(() => {
    if (!activeMovie) return;
    setImageLoaded(false);
    setShouldLoadVideo(false);

    // Reset video load delay mỗi khi chuyển slide
    const videoTimer = setTimeout(() => {
      if (isDesktop && activeMovie?.trailer) setShouldLoadVideo(true);
    }, VIDEO_LOAD_DELAY_MS);

    return () => clearTimeout(videoTimer);
  }, [activeIndex, activeMovie, isDesktop]);

  useEffect(() => {
    const video = activeVideoRef.current;
    if (!video) return;

    if (isTrailerHover && shouldLoadVideo) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isTrailerHover, shouldLoadVideo]);

  useEffect(() => {
    if (!canAutoplay) return;

    setProgress(0);
    const start = performance.now();

    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - start;
      setProgress(Math.min(elapsed / AUTOPLAY_DURATION, 1) * 100);
    }, 40);

    const timeoutId = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length);
      setIsTrailerHover(false);
      setProgress(0);
    }, AUTOPLAY_DURATION);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [activeIndex, canAutoplay, movies.length]);

  const handleAddWatchLater = useCallback(
    async (movieId) => {
      if (!isAuthenticated) {
        toast.error(t("movieDetail.toasts.login_required_feature"));
        return;
      }
      if (watchLaterIds.has(movieId)) {
        toast(t("banner.already_in_watch_later"));
        return;
      }

      setAddingMovieId(movieId);
      try {
        await fetchJson("/api/schedules/watch-later", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId,
            scheduledDateTime: "2099-12-31T23:59:59",
            reminderEnabled: false,
            notes: "Added from homepage banner",
          }),
        });
        setWatchLaterIds((prev) => new Set([...prev, movieId]));
        toast.success(t("banner.added_watch_later"));
      } catch (error) {
        const msg = error?.response?.data?.message || "";
        if (msg.includes("đã có") || msg.toLowerCase().includes("already")) {
          setWatchLaterIds((prev) => new Set([...prev, movieId]));
          toast(t("banner.already_in_watch_later"));
        } else {
          toast.error(t("movieDetail.toasts.generic_error_retry"));
        }
      } finally {
        setAddingMovieId(null);
      }
    },
    [isAuthenticated, t, watchLaterIds],
  );

  const handleSelectMovie = useCallback((index) => {
    if (hoverIntentTimeoutRef.current) {
      window.clearTimeout(hoverIntentTimeoutRef.current);
      hoverIntentTimeoutRef.current = null;
    }
    setActiveIndex(index);
    setProgress(0);
    setIsTrailerHover(false);
  }, []);

  const clearHoverIntentTimer = useCallback(() => {
    if (hoverIntentTimeoutRef.current) {
      window.clearTimeout(hoverIntentTimeoutRef.current);
      hoverIntentTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearHoverIntentTimer();
    };
  }, [clearHoverIntentTimer]);

  const isPointInside = (rect, x, y) => {
    if (!rect) return false;
    return (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
  };

  const handleBannerMouseMove = useCallback(
    (event) => {
      if (!movieTrailer) {
        clearHoverIntentTimer();
        setIsTrailerHover(false);
        return;
      }

      if (!isDesktop) {
        clearHoverIntentTimer();
        setIsTrailerHover(false);
        return;
      }

      const { clientX, clientY } = event;
      const contentRect = contentRef.current?.getBoundingClientRect();
      const thumbRect = thumbnailRef.current?.getBoundingClientRect();

      const inContent = isPointInside(contentRect, clientX, clientY);
      const inThumbnail = isPointInside(thumbRect, clientX, clientY);
      const isInEmptyBannerArea = !inContent && !inThumbnail;

      if (isInEmptyBannerArea) {
        if (isTrailerHover) return;
        if (!hoverIntentTimeoutRef.current) {
          const hoverIntentDelay =
            TRAILER_HOVER_INTENT_MIN_DELAY_MS +
            Math.floor(
              Math.random() *
                (TRAILER_HOVER_INTENT_MAX_DELAY_MS -
                  TRAILER_HOVER_INTENT_MIN_DELAY_MS +
                  1),
            );

          hoverIntentTimeoutRef.current = window.setTimeout(() => {
            setIsTrailerHover(true);
            hoverIntentTimeoutRef.current = null;
          }, hoverIntentDelay);
        }
        return;
      }

      if (inThumbnail) {
        return;
      }

      clearHoverIntentTimer();
      if (isTrailerHover) {
        setIsTrailerHover(false);
      }
    },
    [clearHoverIntentTimer, isDesktop, isTrailerHover, movieTrailer],
  );

  if (loading) {
    return (
      <div
        className={`relative w-full h-[86vh] overflow-hidden ${themeClasses.primary}`}
      >
        <SkeletonWrapper loading={true} height="100%" width="100%">
          <div className="w-full h-full skeleton-animation" />
        </SkeletonWrapper>
      </div>
    );
  }

  if (!activeMovie) {
    return (
      <section
        className={`relative w-full h-[90vh] overflow-hidden ${themeClasses.primary}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="relative z-10 h-full w-full flex items-center justify-center px-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md px-6 py-5 text-center text-white/90">
            <p className="text-lg font-semibold">
              {t("home.banner_unavailable", {
                defaultValue: "Banner is temporarily unavailable",
              })}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {t("home.banner_unavailable_hint", {
                defaultValue: "Please continue browsing sections below.",
              })}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const movieDescription = getMovieDescription(activeMovie);
  const movieDescriptionHtml =
    activeMovie?.description || activeMovie?.overview || movieDescription;
  const movieBanner =
    activeMovie?.banner_url ||
    activeMovie?.poster_url ||
    activeMovie?.thumb_url ||
    activeMovie?.thumbnail_url ||
    "";
  const youtubeTrailerUrl = getYoutubeEmbedUrl(movieTrailer);
  const isYoutubeTrailer = Boolean(youtubeTrailerUrl);
  const canRenderVideoElement = Boolean(movieTrailer) && !isYoutubeTrailer;
  // Giả sử backend có low-res version, nếu không thì dùng ?w=480&q=60&fm=webp hoặc tương tự
  const placeholderSrc =
    activeMovie?.low_res_banner ||
    movieBanner +
      (movieBanner.includes("?") ? "&" : "?") +
      "w=480&q=50&fm=webp&blur=15";

  return (
    <LazyMotion features={domAnimation}>
      <section
        ref={sectionRef}
        className={`relative w-full h-[90vh] overflow-hidden ${themeClasses.primary}`}
        onMouseEnter={() => setIsUserInteracting(true)}
        onMouseMove={handleBannerMouseMove}
        onMouseLeave={() => {
          clearHoverIntentTimer();
          setIsUserInteracting(false);
          setIsTrailerHover(false);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMovie.id}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{
              duration: TRANSITION_DURATION,
              ease: TRANSITION_EASE,
            }}
          >
            {/* Placeholder (blur/low-res) */}
            <img
              src={placeholderSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover blur-md scale-110 transition-opacity duration-500"
              style={{ opacity: imageLoaded ? 0 : 1 }}
              aria-hidden="true"
            />

            {/* Main banner image - ưu tiên load */}
            <motion.img
              src={movieBanner}
              alt={activeMovie.title}
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
              loading="eager"
              onLoad={() => setImageLoaded(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0, scale: 1.05, x: -8 }}
              transition={{ duration: 0.7, ease: TRANSITION_EASE }}
            />

            {/* Video trailer - chỉ load khi cần */}
            {canRenderVideoElement && shouldLoadVideo && (
              <video
                ref={activeVideoRef}
                src={movieTrailer}
                preload="auto"
                muted
                loop
                playsInline
                tabIndex={-1}
                className={`absolute inset-0 z-40 h-full w-full object-cover transition-opacity duration-500 ${
                  isTrailerHover
                    ? "opacity-100 pointer-events-none"
                    : "opacity-0 pointer-events-none"
                }`}
              />
            )}

            {isYoutubeTrailer && shouldLoadVideo && (
              <iframe
                src={youtubeTrailerUrl}
                title={`Trailer ${activeMovie?.title || "movie"}`}
                tabIndex={-1}
                className={`absolute top-1/2 left-1/2 z-40 min-w-full min-h-full w-[177.78vh] h-[56.25vw] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${
                  isTrailerHover
                    ? "opacity-100 pointer-events-none"
                    : "opacity-0 pointer-events-none"
                }`}
                allow="autoplay; encrypted-media; picture-in-picture"
                loading="eager"
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div
          className={`absolute inset-0 z-10 bg-gradient-to-r from-black/95 via-black/70 via-35% to-black/20 transition-opacity duration-300 ${
            isTrailerHover ? "opacity-0" : "opacity-100"
          }`}
        />
        <div
          className={`absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-black/40 transition-opacity duration-300 ${
            isTrailerHover ? "opacity-0" : "opacity-100"
          }`}
        />

        <AnimatePresence mode="wait">
          <motion.div
            ref={contentRef}
            key={`content-${activeMovie.id}`}
            className={`absolute z-30 left-4 sm:left-6 md:left-10 lg:left-14 top-[30%] -translate-y-1/2 w-[92%] sm:w-[78%] md:w-[62%] lg:w-[52%] transition-opacity duration-300 ${
              isTrailerHover ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: TRANSITION_EASE }}
          >
            <div className="rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md p-4 sm:p-5 md:p-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-white text-2xl sm:text-3xl md:text-5xl font-bold leading-tight"
              >
                {activeMovie?.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4"
              >
                <MetadataRow movie={activeMovie} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-4 text-white/90 text-sm sm:text-base md:text-lg line-clamp-4"
                dangerouslySetInnerHTML={{ __html: movieDescriptionHtml }}
              ></motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 flex flex-wrap items-center gap-3"
              >
                <Link
                  to={`/movie/${activeMovie.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2.5 font-semibold hover:from-orange-600 hover:to-red-700 transition-colors"
                >
                  <FaPlay />
                  {t("movie.watch_now", { defaultValue: "Play" })}
                </Link>

                <button
                  type="button"
                  onClick={() => handleAddWatchLater(activeMovie.id)}
                  disabled={
                    addingMovieId === activeMovie.id ||
                    watchLaterIds.has(activeMovie.id)
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-orange-300/50 bg-gradient-to-r from-orange-500/85 to-red-600/85 text-white px-5 py-2.5 font-semibold hover:from-orange-600 hover:to-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {watchLaterIds.has(activeMovie.id) ? (
                    <FaHeart />
                  ) : (
                    <FaRegHeart />
                  )}
                  {watchLaterIds.has(activeMovie.id)
                    ? t("banner.in_watch_later", { defaultValue: "Favorited" })
                    : addingMovieId === activeMovie.id
                      ? t("common.loading", { defaultValue: "Loading..." })
                      : t("banner.add_watch_later", {
                          defaultValue: "Favorite",
                        })}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 z-[105] pointer-events-none transition-opacity duration-300 opacity-100 ">
          <ThumbnailStrip
            movies={movies}
            activeIndex={activeIndex}
            onSelect={handleSelectMovie}
            onHoverStart={() => setIsUserInteracting(true)}
            onHoverEnd={() => setIsUserInteracting(false)}
            containerRef={thumbnailRef}
          />
        </div>

        <div className="absolute bottom-0 left-0 z-50 h-1 w-full bg-white/15">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 to-orange-500"
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.08 }}
          />
        </div>
      </section>
    </LazyMotion>
  );
}

export default memo(Banner);
