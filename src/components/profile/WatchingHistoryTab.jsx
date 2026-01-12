import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, Eye, Calendar } from "lucide-react";

const WatchingHistoryTab = ({ onRefresh }) => {
  const [watchingHistory, setWatchingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setWatchingHistory([
        {
          id: 1,
          movie: {
            id: "1",
            title: "Avatar: The Way of Water",
            posterUrl: "https://via.placeholder.com/300x450",
            release_year: 2022,
          },
          lastWatched: "2024-12-20T14:30:00Z",
          progress: 75, // percentage
          episode: 1,
          totalEpisodes: 1,
        },
        {
          id: 2,
          movie: {
            id: "2",
            title: "Breaking Bad",
            posterUrl: "https://via.placeholder.com/300x450",
            release_year: 2008,
          },
          lastWatched: "2024-12-19T20:15:00Z",
          progress: 45,
          episode: 3,
          totalEpisodes: 62,
        },
        {
          id: 3,
          movie: {
            id: "3",
            title: "The Witcher",
            posterUrl: "https://via.placeholder.com/300x450",
            release_year: 2019,
          },
          lastWatched: "2024-12-18T16:45:00Z",
          progress: 100,
          episode: 8,
          totalEpisodes: 8,
        },
        {
          id: 4,
          movie: {
            id: "4",
            title: "Stranger Things",
            posterUrl: "https://via.placeholder.com/300x450",
            release_year: 2016,
          },
          lastWatched: "2024-12-17T21:20:00Z",
          progress: 30,
          episode: 2,
          totalEpisodes: 34,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const formatProgress = (progress) => {
    if (progress === 100) return "Đã xem xong";
    if (progress >= 90) return "Sắp xong";
    if (progress >= 50) return "Đang xem";
    return "Mới bắt đầu";
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 90) return "bg-yellow-500";
    if (progress >= 50) return "bg-blue-500";
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
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (watchingHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📺</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Chưa có lịch sử xem
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
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Clock className="mr-2 h-5 w-5 text-blue-500" />
          Lịch sử xem ({watchingHistory.length})
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Làm mới
        </button>
      </div>

      <div className="space-y-4">
        {watchingHistory.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-all duration-200"
          >
            <div className="flex items-start space-x-4">
              {/* Movie Poster */}
              <div className="flex-shrink-0">
                <img
                  src={
                    item.movie.posterUrl ||
                    "https://via.placeholder.com/120x180"
                  }
                  alt={item.movie.title}
                  className="w-20 h-28 object-cover rounded-lg"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-lg mb-1 line-clamp-1">
                      {item.movie.title}
                    </h4>
                    <p className="text-gray-400 text-sm mb-2">
                      {item.movie.release_year}
                    </p>

                    {/* Episode info for series */}
                    {item.totalEpisodes > 1 && (
                      <p className="text-blue-400 text-sm mb-2">
                        Tập {item.episode} / {item.totalEpisodes}
                      </p>
                    )}

                    {/* Last watched */}
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <Calendar className="mr-1 h-3 w-3" />
                      <span>
                        Xem lần cuối: {formatLastWatched(item.lastWatched)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400 text-sm">
                          {formatProgress(item.progress)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {item.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                            item.progress
                          )}`}
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0 ml-4">
                    <Link
                      to={`/movie/${item.movie.id}`}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Play className="mr-1 h-4 w-4" />
                      {item.progress === 100 ? "Xem lại" : "Tiếp tục"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
          Tải thêm
        </button>
      </div>
    </div>
  );
};

export default WatchingHistoryTab;
