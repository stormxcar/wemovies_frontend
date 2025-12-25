import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import {
  addToWatchlist,
  removeFromWatchlist,
  checkIsInWatchlist,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const WatchlistButton = ({ movieId, size = "normal" }) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && movieId) {
      checkWatchlistStatus();
    }
  }, [movieId, isAuthenticated]);

  const checkWatchlistStatus = async () => {
    try {
      const inList = await checkIsInWatchlist(movieId);
      setIsInWatchlist(inList);
    } catch (error) {
      console.error("Error checking watchlist status:", error);
    }
  };

  const handleToggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
      return;
    }

    setLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(movieId);
        setIsInWatchlist(false);
        toast.success("Đã xóa khỏi danh sách yêu thích");
      } else {
        await addToWatchlist(movieId);
        setIsInWatchlist(true);
        toast.success("Đã thêm vào danh sách yêu thích");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại");
      console.error("Error toggling watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Ẩn button nếu chưa đăng nhập
  }

  const buttonSize = size === "large" ? "p-3" : "p-2";
  const iconSize = size === "large" ? "w-6 h-6" : "w-5 h-5";

  return (
    <button
      onClick={handleToggleWatchlist}
      disabled={loading}
      className={`
        ${buttonSize} rounded-full transition-all duration-300 
        ${
          isInWatchlist
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}
        flex items-center justify-center
      `}
      title={isInWatchlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
    >
      {loading ? (
        <div
          className={`${iconSize} animate-spin rounded-full border-2 border-white border-t-transparent`}
        ></div>
      ) : (
        <Heart
          className={iconSize}
          fill={isInWatchlist ? "currentColor" : "none"}
          stroke="currentColor"
        />
      )}
    </button>
  );
};

export default WatchlistButton;
