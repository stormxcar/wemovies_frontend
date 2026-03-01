import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, Eye, Calendar, Trash2, CheckCircle } from "lucide-react";
import { fetchJson } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useWatchingProgress } from "../../hooks/useWatchingProgress";
import ViewCountDisplay from "../ViewCountDisplay";
import { toast } from "react-hot-toast";

const WatchingHistoryTab = ({
  movies,
  loading,
  onRefresh,
  title = "Phim đang xem",
}) => {
  const [watchingMovies, setWatchingMovies] = useState(movies || []);
  const [watchingStats, setWatchingStats] = useState(null);
  const [isLoading, setIsLoading] = useState(loading || true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const {
    watchingList,
    refreshList,
    refreshStats,
    markCompleted,
    removeFromWatching,
    isAPIAvailable,
    isLoading: hookLoading,
    error: hookError,
  } = useWatchingProgress(user);

  // Enhanced helper function để get user ID từ user object
  const getUserId = useCallback((userObj) => {
    if (!userObj) return null;

    // More comprehensive user ID extraction
    const possibleIds = [
      userObj.id,
      userObj.email,
      userObj.username,
      userObj.sub,
      userObj.user_id,
      userObj.userId,
    ];

    return possibleIds.find((id) => id && typeof id === "string") || null;
  }, []);

  // Enhanced data fetching with better error handling
  const fetchWatchingData = useCallback(async () => {
    const userId = getUserId(user);
    if (!userId) {
      console.warn("No valid userId found, cannot fetch watching data");
      setError("Không thể xác định người dùng");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("🎬 Fetching watching data for user:", userId);

      // Try to get fresh data first by calling refreshList
      await refreshList();

      // Wait for a brief moment for state to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Use the most current watchingList data
      const hybridWatchingData = watchingList.length > 0 ? watchingList : [];

      console.log(
        "📋 Current watching list data:",
        hybridWatchingData.length,
        "items",
        hybridWatchingData,
      );

      // Enhanced data validation and transformation
      const transformedData = Array.isArray(hybridWatchingData)
        ? hybridWatchingData
            .filter((item) => {
              const isValid = item && item.movieId && item.movieTitle;
              if (!isValid) {
                console.warn("Filtered out invalid item:", item);
              }
              return isValid;
            })
            .map((item) => ({
              movieId: item.movieId,
              movieTitle: item.movieTitle || "Không có tên",
              currentTime: Math.max(0, Math.floor(item.currentTime || 0)), // Ensure non-negative
              totalDuration: Math.max(1, item.totalDuration || 7200), // Avoid division by zero
              percentage: Math.min(
                100,
                Math.max(0, Math.round(item.percentage || 0)),
              ), // Clamp between 0-100
              lastWatched: item.lastWatched || new Date().toISOString(),
              startedAt: item.startedAt,
              sessionId: item.sessionId,
              moviePoster: item.moviePoster || "/api/placeholder/300/400",
              source: item.source || "hybrid",
            }))
        : [];

      console.log(
        "📊 Transformed watching data:",
        transformedData.length,
        "items",
        transformedData,
      );
      setWatchingMovies(transformedData);

      // Show success message only if we have data
      if (transformedData.length > 0) {
        console.log(
          "✅ Successfully loaded",
          transformedData.length,
          "movies for user",
        );
      } else {
        console.log("⚠️ No movies found in watching list");
      }
    } catch (error) {
      console.error("❌ Error fetching watching data:", error);
      setError("Không thể tải danh sách phim đang xem");
      setWatchingMovies([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, getUserId, watchingList, hookLoading, refreshList, isAPIAvailable]);

  const fetchWatchingStats = useCallback(async () => {
    const userId = getUserId(user);
    if (!userId) return;

    try {
      console.log("📊 Fetching watching stats for user:", userId);

      // Use refreshStats from hook to get updated stats
      await refreshStats();

      // Use watchingList to calculate stats
      const currentData =
        watchingList.length > 0 ? watchingList : watchingMovies;

      // Create stats from current data
      const stats = {
        totalMovies: Array.isArray(currentData) ? currentData.length : 0,
        totalWatchTime: Array.isArray(currentData)
          ? currentData.reduce((sum, item) => sum + (item.currentTime || 0), 0)
          : 0,
        averageProgress:
          Array.isArray(currentData) && currentData.length > 0
            ? currentData.reduce(
                (sum, item) => sum + (item.percentage || 0),
                0,
              ) / currentData.length
            : 0,
        completedMovies: Array.isArray(currentData)
          ? currentData.filter((item) => (item.percentage || 0) >= 95).length
          : 0,
        lastUpdated: new Date().toISOString(),
      };

      console.log("📊✅ Calculated watching stats:", stats);
      setWatchingStats(stats);
    } catch (error) {
      console.error("❌ Error fetching watching stats:", error);
    }
  }, [
    user,
    getUserId,
    refreshStats,
    watchingList,
    watchingMovies,
    isAPIAvailable,
  ]);

  // Enhanced refresh function
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    setError(null);
    setIsLoading(true);

    try {
      console.log("🔄 Manually refreshing watching data...");

      // Force refresh from hook first
      await refreshList();

      // Then update local data
      await Promise.all([fetchWatchingData(), fetchWatchingStats()]);

      toast.success("Đã làm mới danh sách phim!");

      // Call external refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("❌ Error during manual refresh:", error);
      toast.error("Có lỗi khi làm mới dữ liệu");
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  }, [
    refreshing,
    fetchWatchingData,
    fetchWatchingStats,
    onRefresh,
    refreshList,
  ]);

  useEffect(() => {
    if (movies !== undefined) {
      // Using external movies data
      setWatchingMovies(movies);
      setIsLoading(loading || false);
    } else {
      // Let the auto-sync handle data from hook
      const userId = getUserId(user);
      if (userId && watchingList.length === 0 && !hookLoading) {
        console.log("🎬 Initial load: fetching data for user:", userId);
        fetchWatchingData();
        fetchWatchingStats();
      } else if (!userId) {
        console.warn("⚠️ No valid user found, clearing data");
        setWatchingMovies([]);
        setWatchingStats(null);
        setIsLoading(false);
      }
    }
  }, [movies, loading, user, getUserId]);

  // Auto-refresh when watchingList from hook updates
  useEffect(() => {
    console.log("🔄 Auto-sync useEffect triggered");
    console.log("📊 watchingList length:", watchingList.length);
    console.log("📊 hookLoading:", hookLoading);
    console.log("📊 Raw watchingList:", watchingList);

    if (watchingList.length > 0) {
      console.log("🔄 Hook watchingList updated, syncing local state");

      const transformedData = watchingList
        .filter((item) => {
          const isValid = item && item.movieId && item.movieTitle;
          if (!isValid) {
            console.warn("Filtered out invalid item in auto-sync:", item);
          }
          return isValid;
        })
        .map((item) => ({
          movieId: item.movieId,
          movieTitle: item.movieTitle,
          currentTime: Math.floor(item.currentTime || 0),
          totalDuration: item.totalDuration || 7200,
          percentage: Math.round(item.percentage || 0),
          lastWatched: item.lastWatched,
          startedAt: item.startedAt,
          sessionId: item.sessionId,
          moviePoster: item.moviePoster || "/api/placeholder/300/400",
          source: item.source || "hybrid",
        }));

      console.log("📋 Auto-synced transformed data:", transformedData);
      setWatchingMovies(transformedData);
      setIsLoading(false); // Ensure isLoading is false when we have data

      // Update stats from current data
      if (transformedData.length > 0) {
        const autoStats = {
          totalMovies: transformedData.length,
          totalWatchTime: transformedData.reduce(
            (sum, item) => sum + (item.currentTime || 0),
            0,
          ),
          averageProgress:
            transformedData.reduce(
              (sum, item) => sum + (item.percentage || 0),
              0,
            ) / transformedData.length,
          completedMovies: transformedData.filter(
            (item) => (item.percentage || 0) >= 95,
          ).length,
          lastUpdated: new Date().toISOString(),
        };
        console.log("📊 Auto-updated stats:", autoStats);
        setWatchingStats(autoStats);
      }
    } else if (!hookLoading) {
      console.log(
        "⚠️ watchingList is empty and not loading, clearing local state",
      );
      setWatchingMovies([]);
    }
  }, [watchingList, hookLoading, isAPIAvailable]);

  // Handle hook errors
  useEffect(() => {
    if (hookError) {
      setError(hookError);
    }
  }, [hookError]);

  const handleRemoveFromWatching = async (movieId) => {
    const userId = getUserId(user);
    if (!userId) {
      toast.error("Không thể xác định người dùng");
      return;
    }

    try {
      console.log("🗑️ Removing movie from watching list:", { userId, movieId });

      // Use the hybrid system removeFromWatching method
      const result = await removeFromWatching(movieId); // Hook handles userId internally

      if (result?.success !== false) {
        toast.success("Đã xóa khỏi danh sách đang xem!");

        // Optimistically update local state
        setWatchingMovies((prev) =>
          prev.filter((movie) => movie.movieId !== movieId),
        );

        // Refresh data to ensure consistency
        setTimeout(() => {
          fetchWatchingData();
          fetchWatchingStats();
        }, 500);
      } else {
        toast.error(
          `Không thể xóa khỏi danh sách: ${result?.message || "Lỗi không xác định"}`,
        );
      }
    } catch (error) {
      console.error("❌ Error removing from watching list:", error);
      toast.error("Có lỗi xảy ra khi xóa phim!");
    }
  };

  const markAsCompleted = async (movieId) => {
    const userId = getUserId(user);
    if (!userId) {
      toast.error("Không thể xác định người dùng");
      return;
    }

    try {
      console.log("✅ Marking movie as completed:", { userId, movieId });

      // Use the hybrid system markCompleted method
      const result = await markCompleted(movieId); // Hook handles userId internally

      if (result?.success !== false) {
        toast.success("Đã đánh dấu hoàn thành!");

        // Optimistically update local state
        setWatchingMovies((prev) =>
          prev.map((movie) =>
            movie.movieId === movieId
              ? { ...movie, percentage: 100, isCompleted: true }
              : movie,
          ),
        );

        // Refresh data to ensure consistency
        setTimeout(() => {
          fetchWatchingData();
          fetchWatchingStats();
        }, 500);
      } else {
        toast.error(
          `Không thể đánh dấu hoàn thành: ${result?.message || "Lỗi không xác định"}`,
        );
      }
    } catch (error) {
      console.error("❌ Error marking as completed:", error);
      toast.error("Có lỗi xảy ra khi đánh dấu hoàn thành!");
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
    return date.toLocaleDateString("vi-VN");
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${(seconds % 60)
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-400">Đang tải danh sách phim...</span>
      </div>
    );
  }

  console.log(
    "🎬 RENDER DEBUG: watchingMovies.length =",
    watchingMovies.length,
    ", isLoading =",
    isLoading,
  );
  console.log("🎬 RENDER DEBUG: watchingMovies =", watchingMovies);

  return (
    <div>
      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-2">⚠️</div>
            <div>
              <p className="text-red-200 font-medium">Có lỗi xảy ra</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        {onRefresh && (
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {refreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Làm mới
            </button>
            <button
              onClick={() => {
                console.log("🐛 DEBUG INFO:");
                console.log("watchingList from hook:", watchingList);
                console.log("local watchingMovies:", watchingMovies);
                console.log("hookLoading:", hookLoading);
                console.log("isAPIAvailable:", isAPIAvailable);
                console.log("user:", user);
                console.log("getUserId(user):", getUserId(user));
                console.log("isLoading:", isLoading);
                console.log("refreshing:", refreshing);
                console.log("error:", error);
                toast.success("Debug info logged to console!");
              }}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              title="Debug thông tin trong Console"
            >
              🐛
            </button>
          </div>
        )}
      </div>

      {/* Watching Stats - chỉ hiển thị cho continue watching */}
      {title === "Phim đang xem" && watchingStats && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            📊 Thống kê xem phim
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {watchingStats.totalMovies || 0}
              </div>
              <div className="text-gray-400 text-sm">Đang xem</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {Math.floor((watchingStats.totalWatchTime || 0) / 3600)}h
              </div>
              <div className="text-gray-400 text-sm">Tổng thời gian</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {watchingStats.averageProgress?.toFixed(1) || 0}%
              </div>
              <div className="text-gray-400 text-sm">TB tiến trình</div>
            </div>
          </div>
        </div>
      )}

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
          {console.log("🎬 RENDERING MOVIES LIST:", watchingMovies)}
          {watchingMovies.map((movie) => (
            <div
              key={movie.movieId}
              className="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-all duration-200"
            >
              <div className="flex items-start space-x-4">
                {/* Movie Poster */}
                <div className="flex-shrink-0">
                  <img
                    src={movie.moviePoster || "/placeholder-professional.svg"}
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
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold text-lg line-clamp-1">
                          {movie.movieTitle}
                        </h4>
                        {movie.source && (
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              movie.source === "hybrid"
                                ? "bg-green-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {movie.source === "hybrid"
                              ? "⚡ Hybrid"
                              : `📊 ${movie.source}`}
                          </span>
                        )}
                      </div>

                      {/* Episode info for series */}
                      {movie.episodeNumber && movie.totalEpisodes && (
                        <p className="text-blue-400 text-sm mb-2">
                          Tập {movie.episodeNumber} / {movie.totalEpisodes}
                        </p>
                      )}

                      {/* Last watched */}
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span>
                          Xem lần cuối: {formatLastWatched(movie.lastWatched)}
                        </span>
                      </div>

                      {/* View Count Display */}
                      <div className="flex items-center mb-3">
                        <ViewCountDisplay
                          movieId={movie.movieId}
                          userId={getUserId(user) || "guest"}
                          size="small"
                          className="text-gray-400"
                        />
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
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                              movie.percentage,
                            )}`}
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
                        to={`/watch/${movie.movieId}?t=${
                          movie.currentTime || 0
                        }`}
                        state={{
                          movieDetail: {
                            id: movie.movieId,
                            title: movie.movieTitle,
                            thumb_url: movie.moviePoster,
                          },
                          startTime: movie.currentTime || 0,
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
                          onClick={() =>
                            handleRemoveFromWatching(movie.movieId)
                          }
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
