import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HorizontalMovies from "./HorizontalMovies";
import {
  fetchJson,
  fetchScheduleData,
  fetchMovieByIdentifier,
} from "../services/api";
import {
  FaChevronRight,
  FaHeart,
  FaShare,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import WatchlistButton from "./WatchlistButton";
import { useAuth } from "../context/AuthContext";
import { toast } from "@toast";
import { useLoading } from "../context/UnifiedLoadingContext";
import { trackMovieView, trackUserAction } from "../services/analytics";
import { useWatchingTracker } from "../hooks/useWatchingTracker";
import ReviewSection from "./ReviewSection";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  getMovieDetailPath,
  getMovieEpisodePath,
  getMovieWatchPath,
} from "../utils/movieRoutes";

const DetailMovie = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  // loading context might not be present in some standalone usages (e.g. tests)
  // wrap in try/catch so the component still renders without provider
  let setLoading = () => {};
  let isLoading = () => false;
  try {
    const loadingCtx = useLoading();
    setLoading = loadingCtx.setLoading;
    isLoading = loadingCtx.isLoading;
  } catch (err) {
    // provider missing, fall back to no-op
  }
  const { t } = useTranslation();
  const [movieDetail, setMovieDetail] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Set document title based on movie title
  useDocumentTitle(movieDetail?.data?.title || t("movieDetail.page_title"));
  // Initialize watching tracker
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleReminder, setScheduleReminder] = useState(true);
  const currentMovieId = movieDetail?.data?.id || identifier;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);
  const { startWatching } = useWatchingTracker(
    movieDetail?.data?.id || identifier,
    movieDetail?.data?.title,
    user?.id,
    isAuthenticated,
  );

  const fetchRelatedMovies = useCallback(async (categoryName) => {
    if (!categoryName) {
      setRelatedMovies([]);
      return;
    }
    try {
      const data = await fetchJson(`/api/movies/category/${categoryName}`);

      setRelatedMovies(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setRelatedMovies([]);
    }
  }, []);

  const checkScheduleStatus = useCallback(
    async (movieIdToCheck) => {
      if (!isAuthenticated || !movieIdToCheck) return;
      try {
        // Use safe schedule data fetcher
        const scheduled = await fetchScheduleData(
          `/api/schedules/check/${movieIdToCheck}`,
          false,
        );
        setIsScheduled(Boolean(scheduled)); // Ensure boolean value

        // Check watch later status with safe fetcher
        const watchLaterList = await fetchScheduleData(
          "/api/schedules/watch-later",
          [],
        );
        const isInList = Array.isArray(watchLaterList)
          ? watchLaterList.some((item) => item.movie?.id === movieIdToCheck)
          : false;
        setIsInWatchLater(isInList);
      } catch (error) {
        // Set defaults on error
        setIsScheduled(false);
        setIsInWatchLater(false);
      }
    },
    [isAuthenticated],
  );

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error(t("movieDetail.toasts.login_required_schedule"));
      return;
    }

    try {
      await fetchJson("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: currentMovieId,
          scheduledDateTime: scheduleDateTime,
          reminderEnabled: scheduleReminder,
          notes: scheduleNotes,
        }),
      });
      toast.success(t("movieDetail.toasts.schedule_created"));
      setShowScheduleForm(false);
      setScheduleDateTime("");
      setScheduleNotes("");
      setScheduleReminder(true);
      checkScheduleStatus(currentMovieId);
    } catch (error) {
      toast.error(t("movieDetail.toasts.schedule_create_error"));
    }
  };

  const handleToggleWatchLater = async () => {
    if (!isAuthenticated) {
      toast.error(t("movieDetail.toasts.login_required_feature"));
      return;
    }

    try {
      if (isInWatchLater) {
        // Remove from watch later
        await fetchJson(`/api/schedules/watch-later/${currentMovieId}`, {
          method: "DELETE",
        });
        setIsInWatchLater(false);
        toast.success(t("movieDetail.toasts.removed_watch_later"));
      } else {
        // Add to watch later
        try {
          // Send a far future date instead of null to avoid database constraint
          const farFutureDate = "2099-12-31T23:59:59";

          const response = await fetchJson("/api/schedules/watch-later", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              movieId: currentMovieId,
              scheduledDateTime: farFutureDate, // Use far future date instead of null
              reminderEnabled: false,
              notes: "Added to watch later",
            }),
          });
          setIsInWatchLater(true);
          toast.success(t("movie.add_to_favorites"));
        } catch (error) {
          // Check if it's a "already exists" error
          if (
            error.response?.status === 400 &&
            error.response?.data?.message?.includes("đã có")
          ) {
            setIsInWatchLater(true);
            toast.info("Phim đã có trong danh sách xem sau");
          } else {
            toast.error(t("movieDetail.toasts.generic_error_retry"));
          }
        }
      }
    } catch (error) {
      toast.error(t("movieDetail.toasts.generic_error_retry"));
    }
  };

  const startWatchingSession = async () => {
    if (isAuthenticated && movieDetail?.data) {
      const estimatedDuration = movieDetail.data.duration
        ? movieDetail.data.duration * 60
        : null;
      await startWatching(estimatedDuration);
    }
  };

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        setLoading("movieDetail", true, t("movieDetail.loading_message"));
        const resolvedMovie = await fetchMovieByIdentifier(identifier);
        const data = { data: resolvedMovie };

        setMovieDetail(data);

        // Keep canonical, professional URL format: /movie/:slug
        if (resolvedMovie?.slug && identifier !== resolvedMovie.slug) {
          navigate(getMovieDetailPath(resolvedMovie), {
            replace: true,
          });
        }

        // Track movie view with analytics (respects cookie consent)
        if (data?.data?.title) {
          trackMovieView(data.data.id || identifier, data.data.title);
        }

        if (data.data.movieCategories?.length) {
          fetchRelatedMovies(data.data.movieCategories[0].name);
        }

        if (data.data?.id) {
          checkScheduleStatus(data.data.id);
        }
      } catch (e) {
        setMovieDetail(null);
      } finally {
        setLoading("movieDetail", false);
      }
    };
    fetchMovieDetail();
  }, [
    identifier,
    fetchRelatedMovies,
    checkScheduleStatus,
    setLoading,
    t,
    navigate,
  ]);

  const isLoadingMovieDetail = isLoading("movieDetail");
  const movieData = movieDetail?.data;

  // when movie has episodes, navigate to first episode instead of generic watch page
  const initialWatchPath =
    Array.isArray(movieData?.episodes) && movieData.episodes.length > 0
      ? getMovieEpisodePath(movieData, 0, identifier)
      : getMovieWatchPath(movieData, identifier);

  const episodeLinks = useMemo(() => {
    const episodes = Array.isArray(movieData?.episodes)
      ? movieData.episodes
      : [];

    return [...episodes]
      .sort((firstEpisode, secondEpisode) => {
        const firstNumber = Number(firstEpisode?.episodeNumber) || 0;
        const secondNumber = Number(secondEpisode?.episodeNumber) || 0;
        return firstNumber - secondNumber;
      })
      .map((episode) => ({
        link: episode.link,
        episodeNumber: episode.episodeNumber,
      }));
  }, [movieData]);

  const movieTypesText = useMemo(() => {
    const types = Array.isArray(movieData?.movieTypes)
      ? movieData.movieTypes.map((item) => item?.name).filter(Boolean)
      : [];
    return types.length > 0 ? types.join(", ") : t("movieDetail.no_info");
  }, [movieData, t]);

  const movieCategoriesText = useMemo(() => {
    const categories = Array.isArray(movieData?.movieCategories)
      ? movieData.movieCategories.map((item) => item?.name).filter(Boolean)
      : [];
    return categories.length > 0
      ? categories.join(", ")
      : t("movieDetail.no_info");
  }, [movieData, t]);

  if (isLoadingMovieDetail || !movieData) {
    return null; // LoadingContext sẽ handle loading display
  }

  const convertToEmbedUrl = (url) => {
    const match = url.match(
      /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const category = movieData.movieCategories?.[0];

  const handleMovieClick = (movieId) => {
    // navigate(`/movie/${movieId}`);
    // Add navigation logic here
  };

  return (
    <div className="bg-gray-800 w-full flex-1">
      <div className="relative w-full h-[72vh] sm:h-[80vh]">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <img
          src={movieDetail.data.banner_url}
          alt={movieDetail.data.title}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center" }}
        />
        <div className="absolute bottom-0 w-full p-4 sm:p-8 lg:p-12 bg-gradient-to-t from-black to-transparent font-bold text-white rounded-b-lg uppercase">
          <span>{movieDetail.data.title}</span>
          <span className="mr-4"> ({movieDetail.data.release_year}) </span>
          {movieDetail.data.vietSub && (
            <div className="my-3 mb-6">
              <span className="bg-green-500 text-white px-2 py-1 rounded-lg">
                {t("movieDetail.viet_sub")}
              </span>
            </div>
          )}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mt-4 gap-4">
            {/* Left group - Watch and Trailer buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                to={initialWatchPath}
                state={{ movieDetail: movieDetail.data }}
                onClick={startWatchingSession}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t("movieDetail.watch_movie")}</span>
              </Link>
              {movieDetail.data.trailer && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <span>Trailer</span>
                </button>
              )}
            </div>

            {/* Right group - Like, Watch Later, Share buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="min-w-[120px]">
                <WatchlistButton movieId={movieDetail.data.id} size="large" />
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error(t("movieDetail.toasts.login_required_feature"));
                    return;
                  }
                  handleToggleWatchLater();
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2 ${
                  isInWatchLater
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-amber-500 hover:to-orange-500 text-white"
                }`}
              >
                <FaClock />
                <span>
                  {isInWatchLater
                    ? t("movieDetail.added")
                    : t("movie.watch_later")}
                </span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: movieDetail.data.title,
                      text: t("movieDetail.share_text", {
                        title: movieDetail.data.title,
                      }),
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success(t("movieDetail.toasts.link_copied"));
                  }
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2"
              >
                <FaShare />
                <span>{t("movieDetail.share")}</span>
              </button>
            </div>
          </div>
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-black/50 border-2 border-white rounded-lg shadow-lg p-2 w-[95vw] sm:w-3/4 max-w-2xl">
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white float-right mb-8"
                >
                  {t("common.close")}
                </button>
                <iframe
                  src={convertToEmbedUrl(movieDetail.data.trailer)}
                  title="Trailer"
                  width="100%"
                  height="320px"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="my-10 mx-3 sm:mx-8 lg:mx-16 mb-8">
        <nav className="mb-8 flex items-center space-x-2">
          <Link
            to="/"
            className="text-white text-base sm:text-xl font-semibold"
          >
            {t("navigation.movies")}
          </Link>{" "}
          <span className="text-white mx-2">{<FaChevronRight />}</span>
          {category && (
            <>
              <Link
                to={`/movies/${category.name}`}
                className="text-white text-base sm:text-xl font-semibold"
              >
                {category.name.toLowerCase()}
              </Link>{" "}
              <span className="text-white mx-2">{<FaChevronRight />}</span>
            </>
          )}
          <span className="text-orange-500 text-base sm:text-xl font-semibold line-clamp-1">
            {movieDetail.data.title}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
          <div className="relative w-full lg:w-[30%] h-auto lg:h-[300px] flex items-start flex-col justify-start mb-3 lg:mb-6">
            <img
              src={movieDetail.data.thumb_url}
              alt={movieDetail.data.title}
              className="w-full lg:w-auto h-auto lg:h-full max-h-[360px] object-cover lg:object-contain rounded-lg"
            />
            <div className="w-full font-bold text-white rounded-b-lg uppercase mt-4">
              <span>{movieDetail.data.title}</span>
              <span> ({movieDetail.data.release_year}) </span>
            </div>
          </div>

          <div className="w-full lg:w-[70%] lg:pl-12">
            <h2 className="font-bold my-4 text-white sm:text-xl md:text-2xl">
              {t("movieDetail.detail_content")}
            </h2>
            <h1 className="text-2xl mb-2 text-white">
              {movieDetail.data.title}
            </h1>
            <div>
              <div className="my-3">
                <span className="text-white">{t("movie.director")}: </span>
                <span className="text-white">
                  {movieDetail.data.director || t("movieDetail.no_info")}
                </span>
              </div>
              <div className="my-3">
                <span className="text-white">{t("movie.cast")}: </span>
                <span className="text-white">
                  {movieDetail.data.actors || t("movieDetail.no_info")}
                </span>
              </div>
              <div className="my-3">
                <span className="text-white">
                  {t("movieDetail.labels.movie_types")}:
                </span>
                <span className="text-white">{movieTypesText}</span>
              </div>
              <div className="my-3">
                <span className="text-white">
                  {t("movieDetail.labels.movie_categories")}:
                </span>
                <span className="text-white">{movieCategoriesText}</span>
              </div>
              <div className="my-3">
                <span className="text-white">{t("movie.duration")}: </span>
                <span className="text-white">
                  {t("movieDetail.duration_minutes", {
                    value: movieDetail.data.duration,
                  })}
                </span>
              </div>
              <div className="my-3">
                <span className="text-white">
                  {t("movieDetail.description")}:{" "}
                </span>
                <span
                  className="text-white"
                  dangerouslySetInnerHTML={{
                    __html:
                      movieDetail.data.description || t("movieDetail.no_info"),
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-3 mt-6 mb-6">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error(
                        t("movieDetail.toasts.login_required_feature"),
                      );
                      return;
                    }
                    handleToggleWatchLater();
                  }}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    isInWatchLater
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-amber-500 hover:to-orange-500 text-white"
                  }`}
                >
                  <FaClock />
                  <span>
                    {isInWatchLater
                      ? t("movieDetail.added")
                      : t("movie.watch_later")}
                  </span>
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: movieDetail.data.title,
                        text: t("movieDetail.share_text", {
                          title: movieDetail.data.title,
                        }),
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success(t("movieDetail.toasts.link_copied"));
                    }
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <FaShare />
                  <span>{t("movieDetail.share")}</span>
                </button>
                {isScheduled ? (
                  <span className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 text-gray-300 px-4 py-2.5 rounded-lg font-medium">
                    <FaCalendarAlt />
                    <span>{t("movieDetail.scheduled")}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error(
                          t("movieDetail.toasts.login_required_schedule"),
                        );
                        return;
                      }
                      setShowScheduleForm(true);
                    }}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <FaCalendarAlt />
                    <span>{t("movieDetail.schedule_watch")}</span>
                  </button>
                )}
              </div>

              <ReviewSection movieId={movieData?.id || identifier} />

              <div className="mt-8">
                <h3 className="text-white text-xl font-semibold mb-4">
                  {t("movieDetail.episode_list_title", "Episodes")}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {episodeLinks.length > 0
                    ? episodeLinks.map((link, idx) => (
                        <Link
                          key={idx}
                          to={getMovieEpisodePath(movieData, idx, identifier)}
                          state={{ movieDetail: movieDetail.data }}
                          className="group bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <div className="relative h-24">
                            <img
                              src={movieData?.thumb_url}
                              alt={movieData?.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70" />
                            <span className="absolute bottom-2 left-2 text-xs font-bold text-white bg-black/60 px-2 py-1 rounded">
                              EP {link.episodeNumber}
                            </span>
                          </div>
                          <div className="p-2 text-center text-white text-sm font-medium">
                            {t("movieDetail.episode", {
                              number: link.episodeNumber,
                            })}
                          </div>
                        </Link>
                      ))
                    : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="my-4 mt-12"></div> */}

      <div className="mx-3 sm:mx-8 lg:mx-12 mt-16 sm:mt-24">
        <HorizontalMovies
          title={t("movieDetail.related_movies")}
          movies={relatedMovies}
          to="/allmovies"
          onMovieClick={handleMovieClick}
          categoryId={null}
        />
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-2xl w-full max-w-md relative border border-slate-600">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
              onClick={() => setShowScheduleForm(false)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <h3 className="text-xl text-white font-semibold mb-6 pr-8">
              {t("movieDetail.schedule_modal.title")}
            </h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  {t("movieDetail.schedule_modal.watch_time")}
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  {t("movieDetail.schedule_modal.notes_optional")}
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  rows="3"
                  placeholder={t(
                    "movieDetail.schedule_modal.notes_placeholder",
                  )}
                />
              </div>
              <div>
                <label className="flex items-center text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleReminder}
                    onChange={(e) => setScheduleReminder(e.target.checked)}
                    className="mr-3 w-4 h-4 text-orange-600 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="font-medium">
                    {t("movieDetail.schedule_modal.remind_30m")}
                  </span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg mt-6"
              >
                {t("movieDetail.schedule_modal.create")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailMovie;
