import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const WatchingHistoryTab = () => {
  const [watchingHistory, setWatchingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch watching history from API
    // For now, using mock data
    setTimeout(() => {
      setWatchingHistory([
        {
          id: 1,
          movie: {
            id: "1",
            title: "Avengers: Endgame",
            posterUrl: "https://via.placeholder.com/300x450",
            release_year: 2019,
          },
          lastWatched: "2024-12-20T10:30:00Z",
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Chưa có lịch sử xem phim
        </h3>
        <p className="text-gray-600 mb-6">
          Bắt đầu xem phim để theo dõi tiến trình của bạn
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Xem phim ngay
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Phim đang xem ({watchingHistory.length})
        </h2>
        <div className="flex items-center space-x-2">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="recent">Xem gần đây</option>
            <option value="progress">Theo tiến trình</option>
            <option value="title">Theo tên phim</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {watchingHistory.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <Link to={`/movie/${item.movie.id}`} className="flex-shrink-0">
                <img
                  src={item.movie.posterUrl}
                  alt={item.movie.title}
                  className="w-20 h-28 object-cover rounded-lg"
                />
              </Link>

              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <Link to={`/movie/${item.movie.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-1">
                        {item.movie.title}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.movie.release_year}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      Xem lần cuối:{" "}
                      {new Date(item.lastWatched).toLocaleDateString("vi-VN")}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${getProgressColor(
                        item.progress
                      )}`}
                    >
                      {formatProgress(item.progress)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      {item.totalEpisodes > 1
                        ? `Tập ${item.episode}/${item.totalEpisodes}`
                        : "Phim lẻ"}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(
                        item.progress
                      )}`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/movie/watch/${item.movie.id}`}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 5v10l8-5-8-5z" />
                    </svg>
                    <span>Tiếp tục xem</span>
                  </Link>

                  <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors text-sm">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Xóa khỏi lịch sử</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchingHistoryTab;
