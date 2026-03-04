import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWatchingProgress } from "../hooks/useWatchingProgress";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import PageLoader from "./loading/PageLoader";

const ContinueWatchingSection = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const {
    watchingList,
    isLoading: loading,
    error,
    removeFromWatching,
    isAPIAvailable,
  } = useWatchingProgress(user);

  // Show only first 6 movies for homepage
  const watchingMovies = watchingList.slice(0, 6);

  const handleRemoveFromWatching = async (movieId) => {
    try {
      const success = await removeFromWatching(movieId);
      if (success) {
        toast.success(t("continue.removed"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const formatProgress = (percentage) => {
    if (percentage >= 95) return t("continueSection.progress.almost_done");
    if (percentage >= 75) return t("continueSection.progress.watching");
    if (percentage >= 50) return t("continueSection.progress.following");
    if (percentage >= 25) return t("continueSection.progress.just_started");
    return t("continueSection.progress.initialized");
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 95) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-gray-400";
  };

  if (!isAuthenticated) {
    return null; // Don't show section if user not logged in
  }

  if (loading) {
    return <PageLoader isVisible={true} message={t("common.loading")} />;
  }

  if (watchingMovies.length === 0) {
    return null; // Don't show empty section
  }

  return (
    <div className="my-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Clock className="mr-2 h-6 w-6 text-blue-500" />
          {t("continue.title")}
          {!isAPIAvailable && (
            <span className="ml-2 px-2 py-1 bg-yellow-600 bg-opacity-30 border border-yellow-500 rounded text-xs text-yellow-300">
              Dev Mode
            </span>
          )}
        </h2>
        <Link
          to="/profile?tab=watching"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          {t("continue.view_all")} →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {watchingMovies.map((movie) => (
          <div
            key={movie.movieId}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-200 group"
          >
            {/* Movie Poster */}
            <div className="relative aspect-[2/3]">
              <img
                src={movie.moviePoster || "/placeholder-professional.svg"}
                alt={movie.movieTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />

              {/* Progress overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="w-full bg-gray-600 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full ${getProgressColor(
                      movie.percentage,
                    )}`}
                    style={{ width: `${movie.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-white">
                  <span>{formatProgress(movie.percentage)}</span>
                  <span>{movie.percentage.toFixed(0)}%</span>
                </div>
              </div>

              {/* Live indicator */}
              {movie.isCurrentlyWatching && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                    🔴 LIVE
                  </span>
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleRemoveFromWatching(movie.movieId)}
                  className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title={t("continueSection.remove")}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Play button overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Link
                  to={`/watch/${movie.movieId}?t=${movie.currentTime || 0}`}
                  state={{
                    movieDetail: {
                      id: movie.movieId,
                      title: movie.movieTitle,
                      thumb_url: movie.moviePoster,
                    },
                    startTime: movie.currentTime || 0,
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  <Play className="mr-1 h-4 w-4" />
                  {Number(movie.percentage || 0) <= 0
                    ? t("watchingHistory.start_watching")
                    : t("continueSection.continue")}
                </Link>
              </div>
            </div>

            {/* Movie Info */}
            <div className="p-3">
              <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                {movie.movieTitle}
              </h3>
              {movie.episodeNumber && movie.totalEpisodes && (
                <p className="text-blue-400 text-xs">
                  {t("continueSection.episode", {
                    current: movie.episodeNumber,
                    total: movie.totalEpisodes,
                  })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContinueWatchingSection;
