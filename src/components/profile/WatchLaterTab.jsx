import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, Trash2, Calendar, RefreshCw } from "lucide-react";
import { fetchJson } from "../../services/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const WatchLaterTab = ({ movies, loading, onRefresh }) => {
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
        "/api/schedules?status=PENDING"
      );
      setScheduledMovies(scheduledResponse || []);
    } catch (error) {
      console.error("Error loading schedules:", error);
      toast.error("Có lỗi khi tải danh sách phim!");
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
      toast.success("Đã xóa khỏi danh sách xem sau!");
      loadSchedules(); // Refresh data
    } catch (error) {
      console.error("Error removing from watch later:", error);
      toast.error("Có lỗi xảy ra khi xóa phim!");
    }
  };

  const handleRemoveSchedule = async (scheduleId) => {
    try {
      await fetchJson(`/api/schedules/${scheduleId}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa lịch xem phim!");
      loadSchedules(); // Refresh data
    } catch (error) {
      console.error("Error removing schedule:", error);
      toast.error("Có lỗi xảy ra khi xóa lịch!");
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString("vi-VN", {
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
              to={`/movie/watch/${movie.id}`}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
            >
              <Play className="h-6 w-6" />
            </Link>
          </div>
          {showScheduleTime && item.scheduledDateTime && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
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
              to={`/movie/${movie.id}`}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Xem chi tiết
            </Link>
            <button
              onClick={() => onRemove(showScheduleTime ? item.id : movie.id)}
              className="text-red-400 hover:text-red-300 p-1"
              title={showScheduleTime ? "Xóa lịch xem" : "Xóa khỏi xem sau"}
            >
              <Trash2 className="h-4 w-4" />
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
        <h3 className="text-xl font-semibold text-white">Danh sách phim</h3>
        <button
          onClick={loadSchedules}
          disabled={tabLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${tabLoading ? "animate-spin" : ""}`}
          />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("watch-later")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeTab === "watch-later"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Xem sau ({watchLaterMovies.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
            activeTab === "scheduled"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Đã lên lịch ({scheduledMovies.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {tabLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : activeTab === "watch-later" ? (
        // Watch Later Tab
        watchLaterMovies.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Chưa có phim nào trong danh sách xem sau
            </h3>
            <p className="text-gray-500">
              Thêm phim vào danh sách xem sau để xem sau này!
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
          <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            Chưa có lịch xem phim nào
          </h3>
          <p className="text-gray-500">
            Tạo lịch xem phim với thời gian cụ thể!
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
