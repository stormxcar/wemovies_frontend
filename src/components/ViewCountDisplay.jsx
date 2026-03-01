// components/ViewCountDisplay.jsx
import React, { useState, useEffect } from "react";
import { FaEye, FaSync } from "react-icons/fa";
import useViewTracking from "../hooks/useViewTracking";

const ViewCountDisplay = ({
  movieId,
  userId,
  size = "normal", // "small", "normal", "large"
  showRefresh = false,
  className = "",
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
}) => {
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const { getViewCount } = useViewTracking(userId);

  const fetchViewCount = async () => {
    if (!movieId) return;

    setLoading(true);
    try {
      const count = await getViewCount(movieId);
      setViewCount(count || 0);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching view count:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViewCount();
  }, [movieId]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !movieId) return;

    const interval = setInterval(() => {
      fetchViewCount();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, movieId]);

  const formatViewCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count?.toLocaleString() || "0";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "text-xs";
      case "large":
        return "text-lg";
      default:
        return "text-sm";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return "text-xs";
      case "large":
        return "text-lg";
      default:
        return "text-sm";
    }
  };

  return (
    <div className={`flex items-center gap-1 ${getSizeClasses()} ${className}`}>

      <span className="text-gray-300">
        {loading ? "..." : formatViewCount(viewCount)}
      </span>

      {showRefresh && (
        <button
          onClick={fetchViewCount}
          disabled={loading}
          className="ml-1 p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh view count"
        >
          <FaSync
            className={`${getIconSize()} ${loading ? "animate-spin" : ""}`}
          />
        </button>
      )}

      {lastRefresh && size !== "small" && (
        <span className="text-xs text-gray-500 ml-1">
          ({lastRefresh.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};

export default ViewCountDisplay;
