import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useWatchingProgress } from "../hooks/useWatchingProgress";
import { fetchJson } from "../services/api";
import UnifiedVideoPlayer from "./UnifiedVideoPlayer";
import ReviewSection from "./ReviewSection";
import useDocumentTitle from "../hooks/useDocumentTitle";

const Watch = React.memo(() => {
  const location = useLocation();
  const { id: paramId } = useParams();
  const { movieDetail, id = paramId } = location.state || {};
  const navigate = useNavigate();
  const { user } = useAuth();
  const { autoPlay } = useSettings();
  const { t } = useTranslation();

  // Set document title for watching page
  useDocumentTitle(
    movieDetail?.title
      ? `${t("movie.watch_now")} - ${movieDetail.title}`
      : t("movie.watch_now"),
  );

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const navigationStartTime = useMemo(
    () => parseInt(searchParams.get("t") || location.state?.startTime || 0),
    [searchParams, location.state],
  );

  const [relatedMovies, setRelatedMovies] = useState([]);
  const [currentMovieData, setCurrentMovieData] = useState(movieDetail || null);
  const [watchingSession, setWatchingSession] = useState(null);
  const [resolvedStartTime, setResolvedStartTime] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  const [progressBuffer, setProgressBuffer] = useState(null); // Buffer for progress updates before session ready
  const [sessionReady, setSessionReady] = useState(false); // Track when session setup is complete
  const [currentViewCount, setCurrentViewCount] = useState(0); // View count for current movie

  const movieCategoriesText = useMemo(() => {
    const categoryNames = Array.isArray(currentMovieData?.movieCategories)
      ? currentMovieData.movieCategories
          .map((item) => item?.name)
          .filter(Boolean)
      : [];

    if (categoryNames.length > 0) {
      return categoryNames.join(", ");
    }

    const legacyCategories = Array.isArray(currentMovieData?.categories)
      ? currentMovieData.categories.filter(Boolean)
      : [];

    if (legacyCategories.length > 0) {
      return legacyCategories.join(", ");
    }

    return currentMovieData?.category || t("home.not_available");
  }, [currentMovieData, t]);

  const movieTypesText = useMemo(() => {
    const typeNames = Array.isArray(currentMovieData?.movieTypes)
      ? currentMovieData.movieTypes.map((item) => item?.name).filter(Boolean)
      : [];

    if (typeNames.length > 0) {
      return typeNames.join(", ");
    }

    const legacyTypes = Array.isArray(currentMovieData?.types)
      ? currentMovieData.types.filter(Boolean)
      : [];

    if (legacyTypes.length > 0) {
      return legacyTypes.join(", ");
    }

    return currentMovieData?.type || t("home.not_available");
  }, [currentMovieData, t]);

  const {
    startWatching,
    updateProgress,
    getResumePosition,
    attachWatchingSession,
    stopProgressTracking,
    getViewCount,
  } = useWatchingProgress(user);

  const latestProgressRef = useRef({ currentTime: 0, duration: 0 });

  useEffect(() => {
    setResolvedStartTime(Math.max(0, Number(navigationStartTime) || 0));
  }, [navigationStartTime, id]);

  // Helper to get user ID
  const getUserId = useCallback((userObj) => {
    if (!userObj) return null;
    return (
      userObj.id || userObj.email || userObj.username || userObj.sub || null
    );
  }, []);

  // Fetch related movies
  const fetchRelatedMovies = useCallback(async (categoryName) => {
    if (!categoryName) {
      setRelatedMovies([]);
      return;
    }
    try {
      const data = await fetchJson(`/api/movies/category/${categoryName}`);
      setRelatedMovies(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      setRelatedMovies([]);
    }
  }, []);

  // Start watching session with hybrid storage
  const startWatchingSession = useCallback(
    async (movieData) => {
      const userId = getUserId(user);

      // Reset session ready flag
      setSessionReady(false);

      if (!userId || !movieData?.id) return;

      try {
        // First check for resume position
        const resumeInfo = await getResumePosition(movieData.id);

        const derivedDuration =
          movieData.totalDuration ||
          (movieData.duration ? Number(movieData.duration) * 60 : null);

        if (resumeInfo?.success && (resumeInfo?.resumeTime || 0) > 0) {
          attachWatchingSession({
            movieId: movieData.id,
            movieTitle: movieData.title,
            totalDuration: resumeInfo?.totalDuration || derivedDuration,
            resumeTime: resumeInfo.resumeTime,
          });

          setWatchingSession({
            status: "SUCCESS",
            resumeTime: resumeInfo.resumeTime,
            isFromResume: true,
            source: "hybrid-resume",
          });

          setTimeout(() => {
            setSessionReady(true);
          }, 0);

          return {
            status: "SUCCESS",
            resumeTime: resumeInfo.resumeTime,
            isFromResume: true,
          };
        }

        // Start new watching session

        const sessionResult = await startWatching(
          movieData.id,
          movieData.title,
          derivedDuration,
        );

        if (sessionResult?.status === "SUCCESS") {
          setWatchingSession({
            ...sessionResult,
            resumeTime: resumeInfo?.resumeTime || 0,
            isFromResume: resumeInfo?.resumeTime > 0,
            source: "hybrid",
          });

          // Mark session as ready after state update
          setTimeout(() => {
            setSessionReady(true);
          }, 0);

          return sessionResult;
        }
      } catch (error) {
        console.error("Error starting watching session:", error);
      }
    },
    [user, startWatching, getResumePosition, attachWatchingSession, getUserId],
  );

  // Handle video time updates with throttling
  const handleTimeUpdate = useCallback(
    async ({ currentTime, duration }) => {
      if (typeof currentTime !== "number" || typeof duration !== "number") {
        console.warn("❌ Invalid time update data:", { currentTime, duration });
        return;
      }

      // If session is not ready yet, buffer the latest progress update
      if (!sessionReady || !watchingSession) {
        setProgressBuffer({ currentTime, duration });
        return;
      }

      // Throttle updates to every 5 seconds for testing (was 10)
      if (currentTime - lastProgressUpdate < 5) {
        return;
      }
      setLastProgressUpdate(currentTime);

      if (!currentMovieData) {
        console.warn("❌ No movie data available");
        return;
      }

      const userId = getUserId(user);
      if (!userId) {
        console.warn("❌ No userId available");
        return;
      }

      try {
        latestProgressRef.current = { currentTime, duration };
        await updateProgress(currentMovieData.id, currentTime, duration);
      } catch (error) {
        console.error("❌ Error updating progress:", error);
      }
    },
    [
      watchingSession,
      currentMovieData,
      user,
      updateProgress,
      lastProgressUpdate,
      getUserId,
    ],
  );

  // Process buffered progress update when session becomes available
  useEffect(() => {
    if (sessionReady && watchingSession && progressBuffer) {
      handleTimeUpdate(progressBuffer);
      setProgressBuffer(null); // Clear buffer after processing
    }
  }, [sessionReady, watchingSession, progressBuffer, handleTimeUpdate]);

  // Handle video metadata loaded
  const handleVideoLoadedMetadata = useCallback(
    ({ duration }) => {
      if (
        currentMovieData &&
        (!currentMovieData.totalDuration ||
          currentMovieData.totalDuration === 0)
      ) {
        setCurrentMovieData((prev) => ({
          ...prev,
          totalDuration: duration,
        }));
      }
    },
    [currentMovieData],
  );

  // Handle video play event
  const handleVideoPlay = useCallback(() => {
    // Video play handler - no special action needed
  }, []);

  // Handle video pause event
  const handleVideoPause = useCallback(
    async ({ currentTime }) => {
      if (watchingSession && currentMovieData && currentTime > 0) {
        const userId = getUserId(user);
        if (userId) {
          latestProgressRef.current = {
            currentTime,
            duration: currentMovieData.totalDuration || 0,
          };
          await updateProgress(
            currentMovieData.id,
            currentTime,
            currentMovieData.totalDuration || 0,
          );
        }
      }
    },
    [watchingSession, currentMovieData, user, updateProgress, getUserId],
  );

  // Handle video ended event
  const handleVideoEnded = useCallback(
    async ({ duration }) => {
      if (watchingSession && currentMovieData && duration > 0) {
        const userId = getUserId(user);
        if (userId) {
          // Mark as completed (100% watched)
          await updateProgress(currentMovieData.id, duration, duration);
        }
      }
    },
    [watchingSession, currentMovieData, user, updateProgress, getUserId],
  );

  // Fetch view count for current movie
  const fetchViewCount = useCallback(
    async (movieId) => {
      if (!movieId) return;

      try {
        const count = await getViewCount(movieId);
        setCurrentViewCount(count || 0);
      } catch (error) {
        console.error("Error fetching view count:", error);
      }
    },
    [getViewCount],
  );

  // Load movie data and start watching session
  React.useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const data = await fetchJson(`/api/movies/${id}`);
        setCurrentMovieData(data.data);

        if (data.data.movieCategories?.length) {
          fetchRelatedMovies(data.data.movieCategories[0].name);
        }

        // Start watching session with hybrid storage
        const sessionResult = await startWatchingSession(data.data);

        const resumeTimeFromSession = Math.max(
          0,
          Number(sessionResult?.resumeTime) || 0,
        );
        const safeNavigationStartTime = Math.max(
          0,
          Number(navigationStartTime) || 0,
        );

        setResolvedStartTime(
          Math.max(safeNavigationStartTime, resumeTimeFromSession),
        );

        // Fetch view count for this movie
        await fetchViewCount(data.data.id);
      } catch (error) {
        console.error("Error fetching movie detail:", error);
      }
    };

    if (id) {
      fetchMovieDetail();
    }
  }, [
    id,
    fetchRelatedMovies,
    startWatchingSession,
    fetchViewCount,
    navigationStartTime,
  ]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (currentMovieData?.id) {
        const latestProgress = latestProgressRef.current;
        if ((latestProgress?.currentTime || 0) > 0) {
          updateProgress(
            currentMovieData.id,
            latestProgress.currentTime,
            latestProgress.duration || currentMovieData.totalDuration || 0,
          ).catch(() => {});
        }
        stopProgressTracking();
      }
    };
  }, [
    currentMovieData?.id,
    currentMovieData?.totalDuration,
    updateProgress,
    stopProgressTracking,
  ]);

  const handleSeeAllMovies = () => {
    navigate("/allmovies", {
      state: { movies: relatedMovies, title: t("watchPage.recommendations") },
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentMovieData) {
    return (
      <div className="watch bg-gray-800 w-full h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t("watchPage.loading_movie")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="watch bg-gray-800 w-full h-auto flex flex-col text-white pt-28 px-4 pb-8 flex-1">
      <div>
        <div className="flex items-center px-5 mb-4">
          <div
            className="rounded-full text-white flex items-center justify-center border-2 p-3 mr-3 cursor-pointer hover:bg-gray-700"
            onClick={() => navigate(-1)}
          >
            <FaChevronLeft className="text-xl" />
          </div>
          <div>
            <p className="text-xl">
              {t("watchPage.watch_title", { title: currentMovieData.title })}
            </p>
            {/* {startTime > 0 && (
              <span className="text-blue-400 text-sm">
                (Resume from {formatTime(startTime)})
              </span>
            )} */}
          </div>
        </div>

        <div className="rounded-lg overflow-hidden shadow-lg mb-4">
          {useMemo(() => {
            const videoSrc = currentMovieData.link;

            if (!videoSrc || videoSrc.trim() === "") {
              return (
                <div className="w-full h-64 bg-gray-900 flex items-center justify-center border-2 border-yellow-500 rounded-lg">
                  <div className="text-center p-6">
                    <div className="text-yellow-400 text-4xl mb-4">⚠️</div>
                    <h3 className="text-white text-lg font-bold mb-2">
                      {t("watchPage.video_unavailable")}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {t("watchPage.video_unavailable_desc")}
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
                      <p>
                        {t("watchPage.movie_id")}: {currentMovieData.id}
                      </p>
                      <p>
                        {t("watchPage.movie_title")}: {currentMovieData.title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <UnifiedVideoPlayer
                key={`${currentMovieData.id}-${resolvedStartTime}`}
                src={videoSrc}
                startTime={resolvedStartTime}
                autoPlay={autoPlay}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
              />
            );
          }, [
            currentMovieData.id,
            currentMovieData.link,
            resolvedStartTime,
            autoPlay,
            handleTimeUpdate,
            handleVideoPlay,
            handleVideoPause,
            handleVideoEnded,
          ])}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 px-5 w-full">
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-800 to-gray-900 border border-slate-700 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="w-40 h-60 relative shrink-0">
              <img
                src={currentMovieData.thumb_url}
                alt={currentMovieData.title}
                className="h-full w-full object-cover rounded-xl shadow-lg"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3 text-white">
                {t("watchPage.movie_information")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-700/60 rounded-lg px-3 py-2">
                  <p className="text-gray-300 text-xs uppercase tracking-wide">
                    {t("watchPage.fields.categories")}
                  </p>
                  <p className="text-white font-medium mt-1">
                    {movieCategoriesText}
                  </p>
                </div>

                <div className="bg-slate-700/60 rounded-lg px-3 py-2">
                  <p className="text-gray-300 text-xs uppercase tracking-wide">
                    {t("watchPage.fields.movie_type")}
                  </p>
                  <p className="text-white font-medium mt-1">
                    {movieTypesText}
                  </p>
                </div>

                <div className="bg-slate-700/60 rounded-lg px-3 py-2">
                  <p className="text-gray-300 text-xs uppercase tracking-wide">
                    {t("watchPage.fields.director")}
                  </p>
                  <p className="text-white font-medium mt-1">
                    {currentMovieData.director || t("home.not_available")}
                  </p>
                </div>

                <div className="bg-slate-700/60 rounded-lg px-3 py-2 sm:col-span-2">
                  <p className="text-gray-300 text-xs uppercase tracking-wide">
                    {t("watchPage.fields.cast")}
                  </p>
                  <p className="text-white font-medium mt-1">
                    {currentMovieData.actors || t("home.not_available")}
                  </p>
                </div>

                <div className="bg-slate-700/60 rounded-lg px-3 py-2">
                  <p className="text-gray-300 text-xs uppercase tracking-wide">
                    {t("watchPage.fields.year")}
                  </p>
                  <p className="text-white font-medium mt-1">
                    {currentMovieData.year ||
                      currentMovieData.release_year ||
                      t("home.not_available")}
                  </p>
                </div>

                <div className="bg-slate-700/60 rounded-lg px-3 py-2">
                  <p className="text-gray-300 text-xs uppercase tracking-wide">
                    {t("watchPage.fields.duration")}
                  </p>
                  <p className="text-white font-medium mt-1">
                    {currentMovieData.totalDuration
                      ? formatTime(currentMovieData.totalDuration)
                      : t("home.not_available")}
                  </p>
                </div>
              </div>

              <div className="mt-4 inline-flex items-center bg-blue-600/20 border border-blue-500/40 rounded-full px-4 py-2">
                <span className="text-blue-300 text-sm font-semibold">
                  {t("watchPage.fields.views")}:{" "}
                  {currentViewCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-gray-900/70 border border-gray-700 rounded-2xl p-5">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {t("watchPage.description")}
            </h2>
            <p
              className="text-gray-300"
              dangerouslySetInnerHTML={{
                __html: currentMovieData.description || t("home.not_available"),
              }}
            />
          </div>

          <ReviewSection movieId={id} />

          <div className="mt-8 border-t-[1px] border-gray-600 pt-8">
            <div className="flex items-center justify-between">
              <h2>{t("watchPage.recommendations")}</h2>
              <button
                onClick={handleSeeAllMovies}
                className="text-white hover:bg-blue-700 rounded px-4 py-2 flex items-center"
              >
                {t("home.view_all")}
                <FaChevronRight className="inline ml-2" />
              </button>
            </div>

            {relatedMovies.length > 0 ? (
              <div className="mt-4">
                {relatedMovies.slice(0, 5).map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => navigate(`/watch/${movie.id}`)}
                    className="flex mb-4 items-center rounded-lg hover:bg-gray-700 p-2 w-full text-left"
                  >
                    <div className="flex-shrink-0 h-24">
                      <img
                        src={movie.thumb_url}
                        alt={movie.title}
                        className="h-full object-contain rounded-lg mr-4"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-normal">{movie.title}</h3>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p>{t("watchPage.no_related_movies")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

Watch.displayName = "Watch";

export default Watch;
