// components/WatchingList.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaPlay, FaTrash, FaCheck, FaSync, FaClock } from "react-icons/fa";
import { useWatchingProgress } from "../hooks/useWatchingProgress";
import { getMovieWatchPath } from "../utils/movieRoutes";

const WatchingList = ({
  userId,
  maxItems = null,
  showTitle = true,
  showActions = true,
  className = "",
  gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    watchingList,
    isLoading,
    error,
    markCompleted,
    removeFromWatching,
    refreshList,
    stats,
  } = useWatchingProgress(userId);

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      return t("watchingList.time.minutes_ago", { count: diffInMins });
    } else if (diffInHours < 24) {
      return t("watchingList.time.hours_ago", {
        count: Math.floor(diffInHours),
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get progress color
  const getProgressColor = (percentage) => {
    if (percentage >= 95) return "bg-green-500";
    if (percentage >= 75) return "bg-orange-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-gray-400";
  };

  // Get progress text
  const getProgressText = (percentage) => {
    if (percentage >= 95) return t("watchingList.progress.almost_done");
    if (percentage >= 75) return t("watchingList.progress.watched_most");
    if (percentage >= 50) return t("watchingList.progress.halfway");
    if (percentage >= 25) return t("watchingList.progress.just_started");
    return t("watchingList.progress.initialized");
  };

  // Handle continue watching
  const handleContinueWatching = (movie) => {
    navigate(
      getMovieWatchPath(
        {
          slug: movie.movieSlug,
          movieSlug: movie.movieSlug,
          id: movie.movieId,
        },
        movie.movieId,
      ),
      {
        state: {
          movieDetail: {
            id: movie.movieId,
            title: movie.movieTitle,
            thumb_url: movie.moviePoster,
          },
          startTime: movie.currentTime || 0,
          resumeFromProgress: true,
        },
      },
    );
  };

  // Handle mark completed
  const handleMarkCompleted = async (movieId) => {
    if (window.confirm(t("watchingList.confirm_mark_completed"))) {
      await markCompleted(movieId);
    }
  };

  // Handle remove from list
  const handleRemove = async (movieId, movieTitle) => {
    if (window.confirm(t("watchingList.confirm_remove", { movieTitle }))) {
      await removeFromWatching(movieId);
    }
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h2 className="text-xl font-bold text-white mb-4">
            <FaClock className="inline mr-2" />
            {t("continue.title")}
          </h2>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-400">
            {t("watchingList.loading")}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h2 className="text-xl font-bold text-white mb-4">
            <FaClock className="inline mr-2" />
            {t("continue.title")}
          </h2>
        )}
        <div className="bg-red-900 border border-red-600 rounded-lg p-4 text-red-100">
          <p className="font-medium">{t("watchingList.load_error_title")}</p>
          <p className="text-sm text-red-200">{error}</p>
          <button
            onClick={refreshList}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors flex items-center"
          >
            <FaSync className="mr-1" />
            {t("watchingList.retry")}
          </button>
        </div>
      </div>
    );
  }

  const displayList = maxItems ? watchingList.slice(0, maxItems) : watchingList;

  if (displayList.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h2 className="text-xl font-bold text-white mb-4">
            <FaClock className="inline mr-2" />
            {t("continue.title")} (0)
          </h2>
        )}
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <FaClock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">{t("watchingList.empty_title")}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t("watchingList.empty_subtitle")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FaClock className="mr-2" />
            {t("continue.title")} ({watchingList.length})
          </h2>

          <div className="flex items-center gap-3">
            {stats.totalSessions && (
              <span className="text-sm text-gray-400">
                {t("watchingList.stats.sessions", {
                  count: stats.totalSessions,
                })}
              </span>
            )}

            <button
              onClick={refreshList}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
              title={t("watchingList.sync_data")}
            >
              <FaSync className="w-3 h-3" />
            </button>

            {maxItems && watchingList.length > maxItems && (
              <Link
                to="/profile?tab=watching"
                className="text-orange-400 hover:text-orange-300 transition-colors text-sm"
              >
                {t("continue.view_all")} →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className={`grid ${gridCols} gap-4`}>
        {displayList.map((movie) => (
          <div
            key={movie.movieId}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-orange-500 transition-all duration-200 group"
          >
            {/* Movie Poster */}
            <div className="relative aspect-[2/3]">
              <img
                src={movie.moviePoster || "/placeholder-professional.svg"}
                alt={movie.movieTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />

              {/* Progress overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="w-full bg-gray-600 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(movie.percentage)} transition-all duration-300`}
                    style={{
                      width: `${Math.min(movie.percentage || 0, 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-white">
                  <span>{getProgressText(movie.percentage)}</span>
                  <span>{Math.round(movie.percentage || 0)}%</span>
                </div>
              </div>

              {/* Source indicator */}
              <div className="absolute top-2 left-2">
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    movie.source === "hybrid"
                      ? "bg-green-600 text-white"
                      : "bg-orange-600 text-white"
                  }`}
                >
                  {movie.source === "hybrid" ? "⚡" : "💾"}{" "}
                  {movie.source?.toUpperCase()}
                </span>
              </div>

              {/* Actions overlay */}
              {showActions && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => handleMarkCompleted(movie.movieId)}
                    className="p-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                    title={t("watchingList.mark_completed")}
                  >
                    <FaCheck className="h-3 w-3" />
                  </button>

                  <button
                    onClick={() =>
                      handleRemove(movie.movieId, movie.movieTitle)
                    }
                    className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title={t("watchingList.remove_from_list")}
                  >
                    <FaTrash className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleContinueWatching(movie)}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
                >
                  <FaPlay className="mr-1 h-4 w-4" />
                  {t("watchingList.continue")}
                </button>
              </div>
            </div>

            {/* Movie Info */}
            <div className="p-3">
              <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                {movie.movieTitle}
              </h3>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>
                  {formatTime(movie.currentTime)} /{" "}
                  {formatTime(movie.totalDuration)}
                </span>
                <span>{formatDate(movie.lastWatched)}</span>
              </div>

              {movie.episodeNumber && movie.totalEpisodes && (
                <p className="text-orange-400 text-xs">
                  {t("watchingList.episode", {
                    current: movie.episodeNumber,
                    total: movie.totalEpisodes,
                  })}
                </p>
              )}

              {showActions && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleContinueWatching(movie)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <FaPlay className="text-xs" />
                    {t("watchingList.continue")}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      {stats && Object.keys(stats).length > 0 && (
        <div className="mt-4 bg-gray-900 rounded-lg p-3 text-xs text-gray-400">
          <div className="flex justify-center gap-4 flex-wrap">
            {stats.totalSessions && (
              <span>
                {t("watchingList.stats.sessions", {
                  count: stats.totalSessions,
                })}
              </span>
            )}
            {stats.totalWatchTime && (
              <span>⏱️ {formatTime(stats.totalWatchTime)}</span>
            )}
            {stats.completedMovies && (
              <span>
                {t("watchingList.stats.completed", {
                  count: stats.completedMovies,
                })}
              </span>
            )}
            <span className="text-green-400">🔄 Hybrid Storage</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchingList;
