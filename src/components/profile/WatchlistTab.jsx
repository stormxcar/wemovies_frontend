import React from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, Play, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import WatchlistButton from "../WatchlistButton";

const WatchlistTab = ({ watchlist, loading, onRefresh }) => {
  const { t, i18n } = useTranslation();
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💔</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {t("watchlist.empty_title")}
        </h3>
        <p className="text-gray-400 mb-6">{t("watchlist.empty_subtitle")}</p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Heart className="mr-2 h-4 w-4" />
          {t("watchlist.discover_movies")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Heart className="mr-2 h-5 w-5 text-red-500" />
          {t("watchlist.title_with_count", { count: watchlist.length })}
        </h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {t("watchlist.refresh")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {watchlist.map((item) => (
          <div
            key={item.movie.id}
            className="bg-gray-700 rounded-lg overflow-hidden border border-gray-600 hover:border-orange-500 transition-all duration-200 group"
          >
            <div className="relative">
              <img
                src={item.movie.posterUrl || "/placeholder-professional.svg"}
                alt={item.movie.title}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Link
                  to={`/movie/${item.movie.id}`}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {t("movie.watch_now")}
                </Link>
              </div>

              {/* Remove from watchlist button */}
              <div className="absolute top-2 right-2">
                <WatchlistButton movieId={item.movie.id} />
              </div>
            </div>

            <div className="p-4">
              <h4 className="text-white font-semibold mb-2 line-clamp-1">
                {item.movie.title}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {item.movie.release_year}
                </span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-yellow-400 text-sm">
                    {item.movie.rating || t("home.not_available")}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {t("watchlist.added_on", {
                    date: new Date(item.addedAt).toLocaleDateString(
                      i18n.language === "vi" ? "vi-VN" : "en-US",
                    ),
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination or Load More button can be added here */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          {t("watchlist.showing_count", { count: watchlist.length })}
        </p>
      </div>
    </div>
  );
};

export default WatchlistTab;
