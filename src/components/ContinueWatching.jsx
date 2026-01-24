import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStartWatching } from "../hooks/useStartWatching";
import RedisWatchingService from "../services/RedisWatchingService";
import { FaPlay, FaTrash, FaClock, FaSync } from "react-icons/fa";
import { toast } from "react-hot-toast";

const ContinueWatching = ({
  className = "",
  showTitle = true,
  maxItems = 6,
}) => {
  const [continueWatchingList, setContinueWatchingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const { user } = useAuth();
  const { getContinueWatching, removeFromWatchingList } = useStartWatching();
  const navigate = useNavigate();

  // Create Redis service instance
  const redisService = React.useMemo(() => new RedisWatchingService(), []);

  // Helper function để get user ID từ user object
  const getUserId = (userObj) => {
    if (!userObj) return null;
    return (
      userObj.id || userObj.email || userObj.username || userObj.sub || null
    );
  };

  const loadContinueWatching = useCallback(async () => {
    const userId = getUserId(user);
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Try to get from Redis backend first
      let watchingList = [];
      let source = "local";

      try {
        const redisResult = await redisService.getContinueWatchingList(userId);
        if (redisResult.success && redisResult.data?.length > 0) {
          watchingList = redisResult.data;
          source = "redis";
          setLastSync(new Date());
          console.log(`📺 Loaded ${watchingList.length} items from Redis`);
        }
      } catch (redisError) {
        console.warn(
          "⚠️ Redis failed, falling back to local:",
          redisError.message,
        );
      }

      // Fallback to local storage if Redis failed or empty
      if (watchingList.length === 0) {
        watchingList = getContinueWatching(userId);
        console.log(
          `📺 Loaded ${watchingList.length} items from local storage`,
        );
      }

      // Process and limit items
      const processedList = watchingList.slice(0, maxItems).map((item) => ({
        ...item,
        progressPercent: Math.round(item.currentProgress || 0),
        timeWatched: formatTime(item.currentTime || 0),
        totalTime: formatTime(item.totalDuration || 7200),
        lastWatchedDate: formatRelativeTime(item.lastUpdateTime),
        source,
      }));

      setContinueWatchingList(processedList);

      if (processedList.length > 0) {
        console.log(
          `✅ Continue watching loaded: ${processedList.length} items (${source})`,
        );
      }
    } catch (error) {
      console.error("❌ Error loading continue watching:", error);
      setContinueWatchingList([]);
      toast.error("Không thể tải danh sách phim đang xem");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, maxItems, getContinueWatching]);

  useEffect(() => {
    loadContinueWatching();
  }, [loadContinueWatching]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContinueWatching();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const handleContinueWatching = (item) => {
    try {
      // Calculate start time from progress
      const startTimeSeconds = Math.floor(
        (item.currentProgress / 100) * item.totalDuration,
      );

      navigate(`/watch/${item.movieId}`, {
        state: {
          movieDetail: {
            id: item.movieId,
            title: item.movieTitle,
          },
          startTime: startTimeSeconds,
        },
      });

      toast.success(`Tiếp tục xem ${item.movieTitle}`);
    } catch (error) {
      console.error("❌ Error continuing movie:", error);
      toast.error("Không thể tiếp tục xem phim");
    }
  };

  const handleRemoveFromList = async (item) => {
    try {
      const userId = getUserId(user);
      const success = await removeFromWatchingList(userId, item.movieId);

      if (success) {
        // Remove from local state
        setContinueWatchingList((prev) =>
          prev.filter((session) => session.movieId !== item.movieId),
        );
        toast.success(`Đã xóa ${item.movieTitle} khỏi danh sách`);
      } else {
        toast.error("Không thể xóa khỏi danh sách");
      }
    } catch (error) {
      console.error("❌ Error removing item:", error);
      toast.error("Không thể xóa khỏi danh sách");
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-700 h-8 w-48 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
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

  if (continueWatchingList.length === 0) {
    return (
      <div className={className}>
        {showTitle && (
          <h2 className="text-xl font-bold mb-4 text-white">Tiếp tục xem</h2>
        )}
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
          <FaClock className="text-4xl mx-auto mb-4 opacity-50" />
          <p>Chưa có phim nào đang xem dở</p>
          <p className="text-sm mt-2">
            Bắt đầu xem phim để thấy tiến trình tại đây
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Tiếp tục xem ({continueWatchingList.length})
          </h2>
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="text-xs text-gray-400">
                Sync: {formatRelativeTime(lastSync.toISOString())}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              title="Đồng bộ từ server"
            >
              <FaSync
                className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {continueWatchingList.map((item, index) => (
          <div
            key={item.sessionId || `item-${index}`}
            className="bg-gray-800 rounded-lg overflow-hidden group hover:bg-gray-700 transition-colors"
          >
            {/* Progress indicator */}
            <div className="relative">
              <div className="w-full bg-gray-600 h-2">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${item.progressPercent}%` }}
                ></div>
              </div>
              <div className="absolute top-0 right-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-bl">
                {item.progressPercent}%
              </div>
              {/* Source badge */}
              <div
                className={`absolute top-0 left-0 text-xs px-2 py-1 rounded-br ${
                  item.source === "redis"
                    ? "bg-green-600 bg-opacity-90 text-white"
                    : "bg-yellow-600 bg-opacity-90 text-white"
                }`}
              >
                {item.source === "redis" ? "🔄 Redis" : "💾 Local"}
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                {item.movieTitle}
              </h3>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span>
                  {item.timeWatched} / {item.totalTime}
                </span>
                <span>{item.lastWatchedDate}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleContinueWatching(item)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <FaPlay className="text-xs" />
                  Tiếp tục
                </button>

                <button
                  onClick={() => handleRemoveFromList(item)}
                  className="bg-gray-600 hover:bg-red-600 text-white p-2 rounded transition-colors"
                  title="Xóa khỏi danh sách"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Local storage info */}
      <div className="mt-4 text-center">
        <LocalStorageInfo />
      </div>
    </div>
  );
};

// Component hiển thị thông tin localStorage
const LocalStorageInfo = () => {
  const [stats, setStats] = useState({});
  const { getWatchingStats } = useStartWatching();

  useEffect(() => {
    const loadStats = () => {
      try {
        const watchingStats = getWatchingStats();
        setStats(watchingStats);
      } catch (error) {
        console.error("❌ Error loading stats:", error);
      }
    };

    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);

    return () => clearInterval(interval);
  }, [getWatchingStats]);

  if (!stats || Object.keys(stats).length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-400">
      <div className="flex justify-center gap-4 flex-wrap">
        <span>📊 {stats.totalSessions || 0} session(s)</span>
        {stats.pendingSync > 0 && (
          <span className="text-yellow-400">
            ⏳ {stats.pendingSync} chờ sync
          </span>
        )}
        <span>💾 {stats.storageSize || "0 KB"}</span>
        {stats.hasActiveSession && stats.currentMovie && (
          <span className="text-green-400">▶️ {stats.currentMovie}</span>
        )}
      </div>
    </div>
  );
};

export default ContinueWatching;
