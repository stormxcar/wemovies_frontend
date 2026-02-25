import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import {
  addToWatchlist,
  removeFromWatchlist,
  checkIsInWatchlist,
  fetchJson,
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
      // AuthContext sẽ tự động handle 401/403 và logout nếu cần
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
    } finally {
      setLoading(false);
    }
  };

  // Always show button, but require auth for functionality

  const buttonSize = size === "large" ? "p-3" : "p-2";
  const iconSize = size === "large" ? "w-6 h-6" : "w-5 h-5";

  return (
    <button
      onClick={handleToggleWatchlist}
      disabled={loading}
      className={`
        ${buttonSize} rounded-lg transition-all w-full duration-300 font-medium
        ${
          isInWatchlist
            ? "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg"
            : "bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white border border-slate-600 hover:border-slate-500"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:shadow-lg"}
        flex items-center justify-center space-x-2
      `}
      title={isInWatchlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
    >
      {loading ? (
        <div
          className={`${iconSize} animate-spin rounded-full border-2 border-white border-t-transparent`}
        ></div>
      ) : (
        <>
          <Heart
            className={`${iconSize}`}
            fill={isInWatchlist ? "currentColor" : "none"}
            stroke="currentColor"
          />
          <span>{isInWatchlist ? "Đã thích" : "Yêu thích"}</span>
        </>
      )}
    </button>
  );
};

export default WatchlistButton;
