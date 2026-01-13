import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, Eye, Calendar, Trash2, CheckCircle } from "lucide-react";
import { fetchJson } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const WatchingHistoryTab = () => {
  const [watchingMovies, setWatchingMovies] = useState([]);
  const [watchingStats, setWatchingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchWatchingData();
      fetchWatchingStats();
    }
  }, [user]);

  const fetchWatchingData = async () => {
    try {
      setLoading(true);
      const response = await fetchJson(`/api/redis-watching/current/${user.id}`);
      setWatchingMovies(response.watchingMovies || []);
    } catch (error) {
      console.error("Error fetching watching data:", error);
      setWatchingMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchingStats = async () => {
    try {
      const response = await fetchJson(`/api/redis-watching/stats/${user.id}`);
      setWatchingStats(response.stats);
    } catch (error) {
      console.error("Error fetching watching stats:", error);
    }
  };

  const removeFromWatching = async (movieId) => {
    try {
      await fetchJson(`/api/redis-watching/stop?userId=${user.id}&movieId=${movieId}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa khỏi danh sách đang xem!");
      fetchWatchingData(); // Refresh list
      fetchWatchingStats(); // Refresh stats
    } catch (error) {
      console.error("Error removing from watching:", error);
      toast.error("Có lỗi xảy ra khi xóa phim!");
    }
  };

  const markAsCompleted = async (movieId) => {
    try {
      await fetchJson(`/api/redis-watching/complete?userId=${user.id}&movieId=${movieId}`, {
        method: "POST",
      });
      toast.success("Đã đánh dấu hoàn thành!");
      fetchWatchingData();
      fetchWatchingStats();
    } catch (error) {
      console.error("Error marking as completed:", error);
      toast.error("Có lỗi xảy ra!");
    }
  };

  const formatProgress = (percentage) => {
    if (percentage >= 95) return "Sắp xong";
    if (percentage >= 75) return "Đang xem";
    if (percentage >= 50) return "Đang theo dõi";
    if (percentage >= 25) return "Mới bắt đầu";
    return "Vừa khởi tạo";
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 95) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-gray-400";
  };

  const formatLastWatched = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} tuần trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Watching Stats */}
      {watchingStats && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            📊 Thống kê xem phim
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{watchingStats.currentlyWatching}</div>
              <div className="text-gray-400 text-sm">Đang xem</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{watchingStats.completedMovies}</div>
              <div className="text-gray-400 text-sm">Đã xem xong</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{watchingStats.totalWatchTimeHours}h</div>
              <div className="text-gray-400 text-sm">Tổng thời gian</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{Math.round(watchingStats.totalWatchTimeHours / 24)}d</div>
              <div className="text-gray-400 text-sm">Tổng ngày</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-500" />
          Phim đang xem ({watchingMovies.length})
        </h3>
        <button
          onClick={() => {
            fetchWatchingData();
            fetchWatchingStats();
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Làm mới
        </button>
      </div>

      {watchingMovies.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Chưa có phim nào đang xem
          </h3>
          <p className="text-gray-400 mb-6">
            Bắt đầu xem phim để theo dõi tiến trình của bạn
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="mr-2 h-4 w-4" />
            Khám phá phim
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {watchingMovies.map((movie) => (
            <div
              key={movie.movieId}
              className="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                {/* Movie Poster */}
                <div className="flex-shrink-0">
                  <img
                    src={movie.moviePoster || "https://via.placeholder.com/120x180"}
                    alt={movie.movieTitle}
                    className="w-20 h-28 object-cover rounded-lg"
                  />
                  {movie.isCurrentlyWatching && (
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                        🔴 LIVE
                      </span>
                    </div>
                  )}
                </div>

                {/* Movie Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg mb-1 line-clamp-1">
                        {movie.movieTitle}
                      </h4>
                      
                      {/* Episode info for series */}
                      {movie.episodeNumber && movie.totalEpisodes && (
                        <p className="text-blue-400 text-sm mb-2">
                          Tập {movie.episodeNumber} / {movie.totalEpisodes}
                        </p>
                      )}
                      
                      {/* Last watched */}
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>Xem lần cuối: {formatLastWatched(movie.lastWatched)}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400 text-sm">
                            {formatProgress(movie.percentage)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {movie.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(movie.percentage)}`}
                            style={{ width: `${movie.percentage}%` }}
                          ></div>
                        </div>
                        {movie.currentTime && movie.totalDuration && (
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatTime(movie.currentTime)}</span>
                            <span>{formatTime(movie.totalDuration)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Link
                        to={`/watch/${movie.movieId}?t=${movie.currentTime || 0}`}
                        state={{ 
                          movieDetail: {
                            id: movie.movieId,
                            title: movie.movieTitle,
                            thumb_url: movie.moviePoster
                          },
                          startTime: movie.currentTime || 0 
                        }}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Play className="mr-1 h-4 w-4" />
                        {movie.percentage < 10 ? "Bắt đầu xem" : "Tiếp tục"}
                      </Link>
                      
                      <div className="flex space-x-1">
                        {movie.percentage >= 90 && (
                          <button
                            onClick={() => markAsCompleted(movie.movieId)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            title="Đánh dấu hoàn thành"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => removeFromWatching(movie.movieId)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                          title="Xóa khỏi danh sách"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchingHistoryTab;
