// components/TrendingMovies.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFire, FaEye, FaPlay, FaChevronRight, FaSync } from "react-icons/fa";
import { toast } from "react-hot-toast";
import useTrending from "../hooks/useTrending";
import useViewTracking from "../hooks/useViewTracking";
import { useAuth } from "../context/AuthContext";
import { fetchJson } from "../services/api";

const TrendingMovies = ({
  className = "",
  showTitle = true,
  maxItems = 6,
  showStats = false,
}) => {
  const [movieDetails, setMovieDetails] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const {
    trendingMovies,
    trendingStats,
    isLoading,
    error,
    refreshTrending,
    clearError,
  } = useTrending();

  const { viewCounts, getBatchViewCounts } = useViewTracking();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch movie details from your existing API
  const fetchMovieDetails = async (movieIds) => {
    try {
      const detailEntries = await Promise.all(
        movieIds.map(async (id) => {
          try {
            const response = await fetchJson(`/api/movies/${id}`);
            const movie = response?.data || response;
            return movie?.id
              ? [
                  id,
                  {
                    id: movie.id,
                    title: movie.title,
                    thumb_url: movie.thumb_url,
                    category:
                      movie.movieCategories?.[0]?.name ||
                      movie.movieTypes?.[0]?.name ||
                      "N/A",
                    year: movie.release_year || movie.year,
                    duration: movie.totalDuration || 7200,
                    description: movie.description || "",
                  },
                ]
              : null;
          } catch {
            return null;
          }
        }),
      );

      const mappedDetails = Object.fromEntries(detailEntries.filter(Boolean));
      setMovieDetails(mappedDetails);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      toast.error("Không thể tải thông tin phim");
    }
  };

  // Load movie details when trending movies change
  useEffect(() => {
    if (trendingMovies.length > 0) {
      const movieIds = [...trendingMovies];
      fetchMovieDetails(movieIds);
      getBatchViewCounts(movieIds);
    }
  }, [trendingMovies, maxItems, getBatchViewCounts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    clearError();
    await refreshTrending(maxItems);
    setRefreshing(false);
    toast.success("Đã cập nhật phim trending");
  };

  const handleWatchMovie = (movieId) => {
    const movie = movieDetails[movieId];
    if (!movie) {
      toast.error("Không tìm thấy thông tin phim");
      return;
    }

    navigate(`/watch/${movieId}`, {
      state: {
        movieDetail: movie,
      },
    });
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count?.toString() || "0";
  };

  if (error) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <FaFire className="text-orange-500 mr-2" />
              Phim Trending
            </h2>
            <button
              onClick={handleRefresh}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors"
              title="Thử lại"
            >
              <FaSync className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-300 mb-2">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && trendingMovies.length === 0) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-700 h-8 w-48 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(maxItems)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4">
              <div className="bg-gray-600 h-32 rounded mb-2"></div>
              <div className="bg-gray-600 h-4 rounded mb-2"></div>
              <div className="bg-gray-600 h-3 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayedMovies = trendingMovies.slice(0, maxItems);

  if (displayedMovies.length === 0) {
    return (
      <div className={className}>
        {showTitle && (
          <h2 className="text-xl font-bold mb-4 text-white flex items-center">
            <FaFire className="text-orange-500 mr-2" />
            Phim Trending
          </h2>
        )}
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
          <FaFire className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Chưa có phim trending</p>
          <p className="text-sm mt-2">Hệ thống đang tính toán phim phổ biến</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FaFire className="text-orange-500 mr-2" />
            Phim Trending ({displayedMovies.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              title="Cập nhật trending"
            >
              <FaSync
                className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Trending Stats */}
      {showStats && trendingStats && (
        <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-lg p-4 mb-6 border border-orange-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-300">
                {trendingStats.totalTrendingMovies || 0}
              </div>
              <div className="text-orange-100 text-sm">Phim hot</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-300">
                {trendingStats.activeHours || 24}h
              </div>
              <div className="text-red-100 text-sm">Chu kỳ</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300">
                {formatViewCount(trendingStats.totalViewsToday || 0)}
              </div>
              <div className="text-yellow-100 text-sm">Lượt xem hôm nay</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-300">
                {trendingStats.topTrendingScore || 0}
              </div>
              <div className="text-pink-100 text-sm">Điểm trending</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedMovies.map((movieId, index) => {
          const movie = movieDetails[movieId];
          const viewCount = viewCounts[movieId];

          if (!movie) {
            return (
              <div
                key={movieId}
                className="bg-gray-800 rounded-lg p-4 animate-pulse"
              >
                <div className="bg-gray-600 h-32 rounded mb-2"></div>
                <div className="bg-gray-600 h-4 rounded mb-2"></div>
                <div className="bg-gray-600 h-3 rounded"></div>
              </div>
            );
          }

          return (
            <div
              key={movieId}
              className="bg-gray-800 rounded-lg overflow-hidden group hover:bg-gray-700 transition-colors relative"
            >
              {/* Trending Badge */}
              <div className="absolute top-2 left-2 z-10">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <FaFire className="mr-1" />#{index + 1}
                </div>
              </div>

              {/* Movie Poster */}
              <div className="relative h-48 bg-gray-600">
                <img
                  src={movie.thumb_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/api/placeholder/300/400";
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <button
                    onClick={() => handleWatchMovie(movieId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all"
                  >
                    <FaPlay className="text-lg" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                  {movie.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>
                    {movie.category} • {movie.year}
                  </span>
                  {viewCount !== undefined && (
                    <div className="flex items-center">
                      <FaEye className="mr-1" />
                      <span>{formatViewCount(viewCount)}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleWatchMovie(movieId)}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-sm py-2 px-3 rounded flex items-center justify-center gap-2 transition-all"
                >
                  <FaPlay className="text-xs" />
                  Xem ngay
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Button */}
      {trendingMovies.length > maxItems && (
        <div className="mt-6 text-center">
          <button
            onClick={() =>
              navigate("/movies/trending", {
                state: {
                  category: "trending",
                  movies: trendingMovies
                    .map((id) => movieDetails[id])
                    .filter(Boolean),
                  title: "Phim Trending",
                  categoryId: "trending",
                },
              })
            }
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg flex items-center gap-2 transition-all mx-auto"
          >
            Xem tất cả phim trending
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default TrendingMovies;
