import React, { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useStartWatching } from "../hooks/useStartWatching";
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

  // Set document title for watching page
  useDocumentTitle(
    movieDetail?.title ? `Xem phim - ${movieDetail.title}` : "Xem phim",
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

  const {
    startWatchingMovie,
    updateWatchingProgress,
    stopWatchingSession,
    validateUserSession,
  } = useStartWatching();

  const getUserId = useCallback((userObj) => {
    if (userObj) {
      return (
        userObj.id ||
        userObj.email ||
        userObj.username ||
        userObj.sub ||
        userObj.user_id ||
        null
      );
    }

    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        return (
          parsedUser.id ||
          parsedUser.email ||
          parsedUser.username ||
          parsedUser.sub ||
          parsedUser.user_id ||
          null
        );
      }
    } catch (error) {}

    try {
      const token = localStorage.getItem("jwtToken");
      if (token) {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
        );
        const decoded = JSON.parse(jsonPayload);
        return (
          decoded.sub ||
          decoded.userId ||
          decoded.id ||
          decoded.email ||
          decoded.username ||
          null
        );
      }
    } catch (error) {}

    return null;
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

  const startWatchingSession = useCallback(
    async (movieData) => {
      const userId = getUserId(user);
      if (!userId || !movieData?.id) return;

      const isValidSession = validateUserSession(userId, movieData.id);

      try {
        const sessionResult = await startWatchingMovie(
          movieData.id,
          movieData.title,
          userId,
          movieData.totalDuration || 7200,
        );

        if (sessionResult?.success) {
          setWatchingSession(sessionResult);

          if (sessionResult.resumeTime && sessionResult.resumeTime > 0) {
            setStartTime(sessionResult.resumeTime);
          }

          return sessionResult;
        }
      } catch (error) {}
    },
    [user, startWatchingMovie, validateUserSession],
  );

  const handleTimeUpdate = useCallback(
    async ({ currentTime, duration, percentage }) => {
      if (typeof currentTime !== "number" || typeof duration !== "number") {
        return;
      }

      if (currentTime - lastProgressUpdate < 10) return;

      setLastProgressUpdate(currentTime);

      if (!watchingSession || !currentMovieData) return;

      const userId = getUserId(user);
      if (!userId) return;

      try {
        await updateWatchingProgress(
          userId,
          currentMovieData.id,
          currentTime,
          duration,
        );
      } catch (error) {}
    },
    [
      watchingSession,
      currentMovieData,
      user,
      updateWatchingProgress,
      lastProgressUpdate,
      getUserId,
    ],
  );

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

  const handleVideoPlay = useCallback(() => {
    // Video play handler
  }, []);

  const handleVideoPause = useCallback(
    async ({ currentTime }) => {
      if (watchingSession && currentMovieData) {
        const userId = getUserId(user);
        if (userId) {
          await updateWatchingProgress(
            userId,
            currentMovieData.id,
            currentTime,
            currentMovieData.totalDuration || 7200,
          );
        }
      }
    },
    [
      watchingSession,
      currentMovieData,
      user,
      updateWatchingProgress,
      getUserId,
    ],
  );

  const handleVideoEnded = useCallback(
    async ({ duration }) => {
      if (watchingSession && currentMovieData) {
        const userId = getUserId(user);
        if (userId) {
          await updateWatchingProgress(
            userId,
            currentMovieData.id,
            duration,
            duration,
          );
        }
      }
    },
    [
      watchingSession,
      currentMovieData,
      user,
      updateWatchingProgress,
      getUserId,
    ],
  );

  React.useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const data = await fetchJson(`/api/movies/${id}`);
        setCurrentMovieData(data.data);

        if (data.data.movieCategories?.length) {
          fetchRelatedMovies(data.data.movieCategories[0].name);
        }

        await startWatchingSession(data.data);
      } catch (error) {}
    };

    fetchMovieDetail();
  }, [id, fetchRelatedMovies, startWatchingSession]);

  React.useEffect(() => {
    return () => {
      if (currentMovieData?.id) {
        stopWatchingSession(currentMovieData.id);
      }
    };
  }, [currentMovieData?.id, stopWatchingSession]);

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
            {startTime > 0 && (
              <span className="text-blue-400 text-sm">
                (Resume from {formatTime(startTime)})
              </span>
            )}
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
                      Video không khả dụng
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Phim này hiện tại không có link xem. Vui lòng thử lại sau.
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
            handleTimeUpdate,
            handleVideoPlay,
            handleVideoPause,
            handleVideoEnded,
          ])}
        </div>

        {/* Watching Session Status */}
        {watchingSession && (
          <div
            className={`mb-4 p-3 rounded-lg border ${
              watchingSession.source === "redis" ||
              watchingSession.source === "redis-resume" ||
              watchingSession.source === "redis-new"
                ? "bg-green-900 border-green-600 text-green-100"
                : "bg-yellow-900 border-yellow-600 text-yellow-100"
            }`}
          >
            <div className="flex items-center text-sm">
              <span className="mr-2">
                {watchingSession.source?.startsWith("redis") ? "☁️" : "💾"}
              </span>
              <span className="font-semibold">
                {watchingSession.source?.startsWith("redis")
                  ? "Cloud Tracking Active"
                  : "Local Tracking Active"}
              </span>
              <span className="ml-auto">🔄 Progress saved every 10s</span>
            </div>

            {/* Debug info for resume */}
            {watchingSession.resumeTime > 0 && (
              <div className="text-xs mt-1 opacity-75">
                ⏰ Resuming from: {Math.floor(watchingSession.resumeTime / 60)}m{" "}
                {Math.floor(watchingSession.resumeTime % 60)}s
                {watchingSession.source === "redis-resume" && " (from cloud)"}
              </div>
            )}

            {watchingSession.source === "local" && (
              <p className="text-xs mt-1 opacity-75">
                Note: Progress will sync when cloud service is available
              </p>
            )}
          </div>
        )}

        {/* Video Status Warning */}
        {currentMovieData.link && (
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="text-yellow-400 mr-2">⚠️</div>
              <div className="text-sm">
                <p className="text-yellow-200 font-medium">Lưu ý về video</p>
                <p className="text-yellow-300">
                  Video có thể không khả dụng nếu link đã hết hạn. Nếu gặp lỗi,
                  hãy thử refresh trang hoặc quay lại sau.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <details className="text-sm">
            <summary className="text-gray-300 cursor-pointer hover:text-white">
              🔍 Debug Info (Click to expand)
            </summary>
            <div className="mt-2 space-y-1 text-xs text-gray-400">
              <p>Movie ID: {currentMovieData.id}</p>
              <p>Title: {currentMovieData.title}</p>
              <p>Video URL: {currentMovieData.link || "No URL"}</p>
              <p>Resume Time: {startTime}s</p>
              <p>Session: {watchingSession?.source || "None"}</p>
            </div>
          </details>
        </div>

        {/* Progress Indicator */}
        {watchingSession && (
          <div className="bg-gray-700 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span>Session: {watchingSession.source}</span>
              <span className="text-blue-400">
                🔄 Auto-saving progress every 10s
              </span>
            </div>
          </div>
        )}
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
