// components/TrendingSection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaFire, FaChevronRight } from "react-icons/fa";
import TrendingMovies from "./TrendingMovies";
import useTrending from "../hooks/useTrending";

const TrendingSection = ({
  className = "",
  maxItems = 6,
  showStats = false,
  compact = false,
}) => {
  const navigate = useNavigate();
  const { trendingMovies } = useTrending();

  const handleViewAll = () => {
    navigate("/movies/trending", {
      state: {
        category: "trending",
        movies: trendingMovies,
        title: "Phim Trending",
        categoryId: "trending",
      },
    });
  };

  if (compact) {
    return (
      <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FaFire className="text-orange-500 mr-2" />
            Phim Trending
          </h2>
          <button
            onClick={handleViewAll}
            className="text-orange-400 hover:text-orange-300 flex items-center text-sm transition-colors"
          >
            Xem tất cả
            <FaChevronRight className="ml-1" />
          </button>
        </div>

        <TrendingMovies
          showTitle={false}
          maxItems={maxItems}
          showStats={showStats}
          className=""
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <TrendingMovies
        showTitle={true}
        maxItems={maxItems}
        showStats={showStats}
      />
    </div>
  );
};

export default TrendingSection;
