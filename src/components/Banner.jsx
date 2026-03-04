import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { fetchMovies } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import SkeletonWrapper from "./SkeletonWrapper";
import { FaPlay } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useGlobalLoading } from "../context/UnifiedLoadingContext";
import { fetchJson } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";

// Import Swiper styles
import "swiper/css";
import "swiper/css/scrollbar";

// import required modules
import { Scrollbar } from "swiper/modules";

function Banner({ onDataLoaded }) {
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [watchLaterIds, setWatchLaterIds] = useState(new Set());
  const [addingMovieId, setAddingMovieId] = useState(null);
  const [activeTrailerMovieId, setActiveTrailerMovieId] = useState(null);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const trailerHoverTimeoutRef = useRef(null);
  const { setComponentsLoaded, updateProgress } = useGlobalLoading();
  const { isAuthenticated } = useAuth();
  const { themeClasses } = useTheme();
  const { t } = useTranslation();

  console.log("🎬 Banner component mounted with onDataLoaded:", !!onDataLoaded);

  useEffect(() => {
    console.log("🎬 Banner: Starting fetch...");
    setLoading(true);

    // Update global progress for banner loading
    updateProgress(85, t("home.loading.banner"));

    fetchMovies()
      .then((movies) => {
        console.log("🎬 Banner: Movies fetched:", movies?.length || 0);
        const shuffled = movies.sort(() => 0.5 - Math.random());
        setMovies(shuffled.slice(0, 5));

        // Mark banner as loaded
        setComponentsLoaded((prev) => ({ ...prev, banner: true }));

        console.log("✅ Banner: Data loaded, notifying parent...");

        // Notify parent that banner data is ready
        if (onDataLoaded) {
          onDataLoaded(true);
        }
      })
      .catch((error) => {
        console.error("❌ Banner error:", error);
        // Even on error, mark as loaded to prevent infinite loading
        if (onDataLoaded) {
          onDataLoaded(false);
        }
      })
      .finally(() => {
        console.log("🎬 Banner: Loading finished");
        setLoading(false);
      });
  }, []); // FIXED: Empty dependency array to prevent infinite re-renders

  useEffect(() => {
    const loadWatchLater = async () => {
      if (!isAuthenticated) {
        setWatchLaterIds(new Set());
        return;
      }

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

  const getReleaseYear = (movie) => {
    if (movie?.release_year) return movie.release_year;
    const dateSource =
      movie?.release_date || movie?.updatedAt || movie?.createdAt;
    if (!dateSource) return "N/A";
    const year = new Date(dateSource).getFullYear();
    return Number.isNaN(year) ? "N/A" : year;
  };

  const getGenreLabel = (movie) => {
    const genres = Array.isArray(movie?.movieCategories)
      ? movie.movieCategories.map((item) => item?.name).filter(Boolean)
      : [];

    if (genres.length > 0) return genres.slice(0, 2).join(" • ");
    return t("movie.genre");
  };

  const getMovieTypeLabel = (movie) => {
    const types = Array.isArray(movie?.movieTypes)
      ? movie.movieTypes.map((item) => item?.name).filter(Boolean)
      : [];

    if (types.length > 0) return types.slice(0, 2).join(" • ");
    return t("movie.type");
  };

  const getTrailerEmbedUrl = (url) => {
    if (!url) return "";
    const match = url.match(
      /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (match?.[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&fs=0&iv_load_policy=3`;
    }
    return url;
  };

  const clearTrailerHoverTimer = () => {
    if (trailerHoverTimeoutRef.current) {
      clearTimeout(trailerHoverTimeoutRef.current);
      trailerHoverTimeoutRef.current = null;
    }
  };

  const handleSlideMouseEnter = (movie) => {
    clearTrailerHoverTimer();
    if (!isDesktop || !movie?.trailer) return;

    trailerHoverTimeoutRef.current = setTimeout(() => {
      setActiveTrailerMovieId(movie.id);
    }, 800);
  };

  const handleSlideMouseLeave = (movie) => {
    clearTrailerHoverTimer();
    if (activeTrailerMovieId === movie?.id) {
      setActiveTrailerMovieId(null);
    }
  };

  useEffect(() => {
    return () => {
      clearTrailerHoverTimer();
    };
  }, []);

  useEffect(() => {
    const syncViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!swiperInstance?.autoplay) return;

    if (activeTrailerMovieId) {
      swiperInstance.autoplay.stop();
    } else {
      swiperInstance.autoplay.start();
    }
  }, [activeTrailerMovieId, swiperInstance]);

  const handleAddWatchLater = async (movieId) => {
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

      setWatchLaterIds((prev) => new Set(prev).add(movieId));
      toast.success(t("banner.added_watch_later"));
    } catch (error) {
      const message = error?.response?.data?.message || "";
      if (
        message.includes("đã có") ||
        message.toLowerCase().includes("already")
      ) {
        setWatchLaterIds((prev) => new Set(prev).add(movieId));
        toast(t("banner.already_in_watch_later"));
      } else {
        toast.error(t("movieDetail.toasts.generic_error_retry"));
      }
    } finally {
      setAddingMovieId(null);
    }
  };

  return (
    <div
      className={`relative w-full h-[90vh] overflow-hidden flex-1 ${themeClasses.primary}`}
    >
      {movies.length > 0 && (
        <Swiper
          onSwiper={setSwiperInstance}
          onSlideChange={() => setActiveTrailerMovieId(null)}
          scrollbar={{
            hide: true,
            draggable: true,
            snapOnRelease: true,
            autoFocus: true,
          }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          speed={800}
          allowTouchMove={true}
          modules={[Scrollbar]}
          className="mySwiper overflow-hidden"
        >
          {movies.map((movie, index) => (
            <SwiperSlide
              key={index}
              className="w-full h-full relative"
              onMouseEnter={() => handleSlideMouseEnter(movie)}
              onMouseLeave={() => handleSlideMouseLeave(movie)}
            >
              {isDesktop &&
                activeTrailerMovieId === movie.id &&
                movie?.trailer && (
                  <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none select-none">
                    <iframe
                      src={getTrailerEmbedUrl(movie.trailer)}
                      title={`Trailer ${movie.title}`}
                      className="absolute top-1/2 left-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      tabIndex={-1}
                    />
                  </div>
                )}

              <div
                className={`relative w-full h-full inset-0 ml-20 transition-opacity duration-300 ${
                  isDesktop && activeTrailerMovieId === movie.id
                    ? "opacity-0"
                    : "opacity-100"
                }`}
                style={{
                  backgroundImage: `url(${movie.banner_url})`,
                  backgroundSize: "cover", // Zoom out để ảnh nhỏ hơn
                  backgroundPosition: "center 2px", // Di chuyển ảnh xuống dưới 100px từ top
                  backgroundRepeat: "no-repeat",
                  height: "100vh",
                  objectFit: "cover",
                }}
              >
                <SkeletonWrapper loading={loading} height="100%" width="100%">
                  <div className="w-full h-full skeleton-animation" />
                </SkeletonWrapper>
              </div>
              <div
                className={`absolute inset-0 bg-gradient-to-r from-black/100 via-black/80 via-40% to-transparent z-10 transition-opacity duration-300 ${
                  isDesktop && activeTrailerMovieId === movie.id
                    ? "opacity-0"
                    : "opacity-100"
                }`}
              ></div>
              <div
                className={`absolute top-80 left-12 text-left text-white z-30 max-w-2xl px-4 transition-opacity duration-300 ${
                  isDesktop && activeTrailerMovieId === movie.id
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-white/20 text-xs rounded-full">
                    {getReleaseYear(movie)}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/30 text-xs rounded-full">
                    {getGenreLabel(movie)}
                  </span>
                  <span className="px-2 py-1 bg-purple-500/30 text-xs rounded-full">
                    {getMovieTypeLabel(movie)}
                  </span>
                  {movie?.hot && (
                    <span className="px-2 py-1 bg-red-500/70 text-xs rounded-full">
                      HOT
                    </span>
                  )}
                </div>
                <SkeletonWrapper loading={loading} height={40}>
                  <h1 className="text-4xl font-bold">{movie.title}</h1>
                </SkeletonWrapper>
                <SkeletonWrapper loading={loading} height={20}>
                  <p
                    className="mt-2 text-lg"
                    dangerouslySetInnerHTML={{
                      __html:
                        movie.description.length > 150
                          ? movie.description.slice(0, 150) + "..."
                          : movie.description,
                    }}
                  ></p>
                </SkeletonWrapper>
                <div>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <SkeletonWrapper loading={loading} height={60}>
                      <Link
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-full text-lg flex items-center gap-2 cursor-pointer"
                        to={`/movie/${movie.id}`}
                        style={{ display: "inline-flex", width: "auto" }}
                      >
                        <span className="bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center w-[60px] h-[60px]">
                          <FaPlay size={30} className="text-black" />
                        </span>
                        <span className="font-semibold text-xl">
                          {t("movie.watch_now")}
                        </span>
                      </Link>
                    </SkeletonWrapper>

                    <button
                      type="button"
                      onClick={() => handleAddWatchLater(movie.id)}
                      disabled={
                        addingMovieId === movie.id ||
                        watchLaterIds.has(movie.id)
                      }
                      className="py-2 px-3 rounded-full text-base font-semibold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      <span className="bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center w-[60px] h-[60px]">
                        <FaPlus size={30} className="text-black" />
                      </span>

                      <span className="font-semibold text-xl">
                        {watchLaterIds.has(movie.id)
                          ? t("banner.in_watch_later")
                          : addingMovieId === movie.id
                            ? t("common.loading")
                            : t("banner.add_watch_later")}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      {movies.length === 0 && (
        <div className="w-full h-full flex items-center justify-center">
          <SkeletonWrapper loading={true} height="100%" width="100%">
            <div className="w-full h-full rounded-lg skeleton-animation" />
          </SkeletonWrapper>
        </div>
      )}
    </div>
  );
}

export default Banner;
