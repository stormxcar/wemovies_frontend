import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchJson } from "../../services/api";
import { toast } from "@toast";
import { useAuth } from "../../context/AuthContext";
import { getMovieDetailPath, getMovieWatchPath } from "../../utils/movieRoutes";

const WatchLaterTab = ({ movies, loading, onRefresh }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("watch-later");
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [scheduledMovies, setScheduledMovies] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Load data for both tabs
  const loadSchedules = async () => {
    if (!user) return;

    setTabLoading(true);
    try {
      // Load watch later movies
      const watchLaterResponse = await fetchJson("/api/schedules/watch-later");
      setWatchLaterMovies(watchLaterResponse || []);

      // Load scheduled movies (PENDING status)
      const scheduledResponse = await fetchJson(
        "/api/schedules?status=PENDING",
      );
      setScheduledMovies(scheduledResponse || []);
    } catch (error) {
      toast.error(t("watchLater.toasts.load_error"));
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [user]);

  const handleRemoveFromWatchLater = async (movieId) => {
    try {
      await fetchJson(`/api/schedules/watch-later/${movieId}`, {
        method: "DELETE",
      });
      toast.success(t("watchLater.toasts.removed_watch_later"));
      loadSchedules(); // Refresh data
    } catch (error) {
      toast.error(t("watchLater.toasts.remove_movie_error"));
    }
  };

  const handleRemoveSchedule = async (scheduleId) => {
    try {
      await fetchJson(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });
      toast.success(t("watchLater.toasts.removed_schedule"));
      loadSchedules(); // Refresh data
    } catch (error) {
      toast.error(t("watchLater.toasts.remove_schedule_error"));
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const MovieCard = ({ item, onRemove, showScheduleTime = false }) => {
    const movie = item.movie || item; // Handle different data structures
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-gray-600 transition-colors">
        <div className="relative">
          <img
            src={movie.thumb_url || movie.poster}
            alt={movie.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center">
            <Link
              to={getMovieWatchPath(movie, movie.id)}
              className="bg-orange-600 text-white p-3 rounded-full hover:bg-orange-700 transition-colors"
            >
              <Play className="h-6 w-6" />
            </Link>
          </div>
          {showScheduleTime && item.scheduledDateTime && (
            <div className="absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 rounded text-xs">
              {formatDateTime(item.scheduledDateTime)}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
            {movie.title}
          </h3>
          <p className="text-gray-400 text-xs mb-3">
            {movie.release_year || movie.year}
          </p>

          {item.notes && (
            <p className="text-gray-300 text-xs mb-3 italic">"{item.notes}"</p>
          )}

          <div className="flex items-center justify-between">
            <Link
              to={getMovieDetailPath(movie, movie.id)}
              className="text-orange-400 hover:text-orange-300 text-sm font-medium"
            >
              {t("watchLater.view_detail")}
            </Link>
            <button
              onClick={() => onRemove(showScheduleTime ? item.id : movie.id)}
              className="text-red-400 hover:text-red-300 text-sm font-medium"
              title={
                showScheduleTime
                  ? t("watchLater.remove_schedule")
                  : t("watchLater.remove_watch_later")
              }
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          {t("watchLater.title")}
        </h3>
        <button
          onClick={loadSchedules}
          disabled={tabLoading}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${tabLoading ? "animate-spin" : ""}`}
          />
          <span>{t("watchLater.refresh")}</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("watch-later")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "watch-later"
              ? "bg-orange-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          {t("watchLater.tab_watch_later", { count: watchLaterMovies.length })}
        </button>
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "scheduled"
              ? "bg-orange-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          {t("watchLater.tab_scheduled", { count: scheduledMovies.length })}
        </button>
      </div>

      {/* Tab Content */}
      {tabLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : activeTab === "watch-later" ? (
        // Watch Later Tab
        watchLaterMovies.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {t("watchLater.empty_watch_later_title")}
            </h3>
            <p className="text-gray-500">
              {t("watchLater.empty_watch_later_subtitle")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {watchLaterMovies.map((item) => (
              <MovieCard
                key={item.id}
                item={item}
                onRemove={handleRemoveFromWatchLater}
                showScheduleTime={false}
              />
            ))}
          </div>
        )
      ) : // Scheduled Tab
      scheduledMovies.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {t("watchLater.empty_scheduled_title")}
          </h3>
          <p className="text-gray-500">
            {t("watchLater.empty_scheduled_subtitle")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {scheduledMovies.map((item) => (
            <MovieCard
              key={item.id}
              item={item}
              onRemove={handleRemoveSchedule}
              showScheduleTime={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchLaterTab;
