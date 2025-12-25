import React from "react";
import { Link } from "react-router-dom";
import WatchlistButton from "../WatchlistButton";

const WatchlistTab = ({ watchlist, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❤️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Chưa có phim yêu thích
        </h3>
        <p className="text-gray-600 mb-6">
          Khám phá và thêm những bộ phim bạn yêu thích vào danh sách
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Khám phá phim
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Phim yêu thích ({watchlist.length})
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {watchlist.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="relative">
              <Link to={`/movie/${item.movie.id}`}>
                <img
                  src={
                    item.movie.posterUrl ||
                    "https://via.placeholder.com/300x450"
                  }
                  alt={item.movie.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              </Link>
              <div className="absolute top-2 right-2">
                <WatchlistButton movieId={item.movie.id} />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-t-lg"></div>
            </div>

            <div className="p-4">
              <Link to={`/movie/${item.movie.id}`}>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                  {item.movie.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 mb-2">
                {item.movie.release_year}
              </p>
              <p className="text-xs text-gray-500">
                Thêm vào: {new Date(item.addedAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistTab;
