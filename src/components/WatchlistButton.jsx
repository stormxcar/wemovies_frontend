import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import {
  addToWatchlist,
  removeFromWatchlist,
  checkIsInWatchlist,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "@toast";
import { useTranslation } from "react-i18next";

const WatchlistButton = ({ movieId, size = "normal" }) => {
  const { t } = useTranslation();
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
    } catch {
      // AuthContext sẽ tự động handle 401/403 và logout nếu cần
    }
  };

  const handleToggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error(t("watchlistButton.toasts.login_required"));
      return;
    }

    setLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(movieId);
        setIsInWatchlist(false);
        toast.success(t("watchlistButton.toasts.removed"));
      } else {
        await addToWatchlist(movieId);
        setIsInWatchlist(true);
        toast.success(t("watchlistButton.toasts.added"));
      }
    } catch {
      toast.error(t("watchlistButton.toasts.error"));
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
      title={
        isInWatchlist
          ? t("watchlistButton.titles.remove")
          : t("watchlistButton.titles.add")
      }
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
          <span>
            {isInWatchlist
              ? t("watchlistButton.labels.liked")
              : t("watchlistButton.labels.favorite")}
          </span>
        </>
      )}
    </button>
  );
};

export default WatchlistButton;
