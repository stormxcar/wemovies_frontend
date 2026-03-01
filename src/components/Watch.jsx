import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
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
  const startTime = useMemo(
    () => parseInt(searchParams.get("t") || location.state?.startTime || 0),
    [searchParams, location.state],
  );

  const [relatedMovies, setRelatedMovies] = useState([]);
  const [currentMovieData, setCurrentMovieData] = useState(movieDetail || null);
  const [watchingSession, setWatchingSession] = useState(null);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);
  const [progressBuffer, setProgressBuffer] = useState(null); // Buffer for progress updates before session ready
  const [sessionReady, setSessionReady] = useState(false); // Track when session setup is complete
  const [currentViewCount, setCurrentViewCount] = useState(0); // View count for current movie

  const {
    startWatching,
    updateProgress,
    getResumePosition,
    startProgressTracking,
    stopProgressTracking,
    getViewCount,
    trackView,
  } = useWatchingProgress(user);

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

        // Start new watching session
        const sessionResult = await startWatching(
          movieData.id,
          movieData.title,
          movieData.totalDuration || 7200,
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
    [user, startWatching, getResumePosition, getUserId, startTime],
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
          await updateProgress(
            currentMovieData.id,
            currentTime,
            currentMovieData.totalDuration || 7200,
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
        await startWatchingSession(data.data);

        // Fetch view count for this movie
        await fetchViewCount(data.data.id);
      } catch (error) {
        console.error("Error fetching movie detail:", error);
      }
    };

    if (id) {
      fetchMovieDetail();
    }
  }, [id, fetchRelatedMovies, startWatchingSession, fetchViewCount]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (currentMovieData?.id) {
        stopProgressTracking();
      }
    };
  }, [currentMovieData?.id, stopProgressTracking]);

  const handleSeeAllMovies = () => {
    navigate("/allmovies", {
      state: { movies: relatedMovies, title: "Related Movies" },
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
          <p>Loading movie...</p>
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
            <p className="text-xl">Watch {currentMovieData.title}</p>
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
                      Video unavailable
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      This movie currently has no available streaming links.
                      Please try again later.
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
                      <p>Movie ID: {currentMovieData.id}</p>
                      <p>Title: {currentMovieData.title}</p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <UnifiedVideoPlayer
                key={currentMovieData.id}
                src={videoSrc}
                startTime={startTime}
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
            startTime,
            autoPlay,
            handleTimeUpdate,
            handleVideoPlay,
            handleVideoPause,
            handleVideoEnded,
          ])}
        </div>
      </div>

      <div className="flex mt-8 px-5 w-full">
        <div className="w-[70%] flex items-start">
          <div className="w-1/4 h-64 relative">
            <img
              src={currentMovieData.thumb_url}
              alt={currentMovieData.title}
              className="h-full object-contain rounded-lg shadow-lg"
            />
          </div>
          <div className="mt-4 mx-4">
            <h2 className="text-2xl font-bold mb-2">Movie Information</h2>
            <p>
              <strong>Category:</strong> {currentMovieData.category || "N/A"}
            </p>
            <p>
              <strong>Director:</strong> {currentMovieData.director || "N/A"}
            </p>
            <p>
              <strong>Cast:</strong> {currentMovieData.actors || "N/A"}
            </p>
            <p>
              <strong>Year:</strong> {currentMovieData.year || "N/A"}
            </p>
            <p>
              <strong>Duration:</strong>{" "}
              {formatTime(currentMovieData.totalDuration || 7200)}
            </p>
            <p className="flex items-center">
              <strong>Views:</strong>
              <span className="ml-2 flex items-center text-blue-400">
                👁️ {currentViewCount.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        <div className="w-[30%] ml-8 pl-8 border-l-[1px] border-gray-600">
          <div>
            <h2 className="text-2xl font-bold mb-2">Description</h2>
            <p
              className="text-gray-300"
              dangerouslySetInnerHTML={{
                __html: currentMovieData.description || "N/A",
              }}
            />
          </div>

          <ReviewSection movieId={id} />

          <div className="mt-8 border-t-[1px] border-gray-600 pt-8">
            <div className="flex items-center justify-between">
              <h2>Recommendations</h2>
              <button
                onClick={handleSeeAllMovies}
                className="text-white hover:bg-blue-700 rounded px-4 py-2 flex items-center"
              >
                View All
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
              <p>No related movies found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

Watch.displayName = "Watch";

export default Watch;
