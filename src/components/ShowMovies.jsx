import React, { useEffect, useState, useCallback } from "react";
import HorizontalMovies from "./HorizontalMovies";
import GridMovies from "./GridMovies";
import ContinueWatchingSection from "./ContinueWatchingSection";
import PageLoader from "./loading/PageLoader";
import { useTheme } from "../context/ThemeContext";

import { fetchMovieByHot, fetchMovies } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { useLoading, useGlobalLoading } from "../context/UnifiedLoadingContext";

const ShowMovies = ({ onDataLoaded }) => {
  const navigate = useNavigate();
  const { themeClasses } = useTheme();
  const { setComponentLoading, isComponentLoading } = useLoading();
  const { setComponentsLoaded, updateProgress } = useGlobalLoading();
  const [movieList, setMovieList] = useState([]);
  const [movieHot, setMovieHot] = useState([]);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  console.log(
    "📽️ ShowMovies component mounted with onDataLoaded:",
    !!onDataLoaded,
  );

  useEffect(() => {
    let isMounted = true;
    console.log("📽️ ShowMovies: useEffect triggered");

    const fetchAll = async () => {
      try {
        console.log("📽️ ShowMovies: Starting data fetch...");
        setComponentLoading("showMovies", true, "Đang tải danh sách phim...");
        setAllDataLoaded(false);

        // Update global progress
        updateProgress(80, "Tải danh sách phim...");

        // Load movies data
        console.log("🔍 Fetching movies and hot movies...");
        const [movies, hot] = await Promise.all([
          fetchMovies(),
          fetchMovieByHot(),
        ]);

        console.log("📊 Data received:", {
          movies: movies?.length || 0,
          hot: hot?.length || 0,
          moviesArray: Array.isArray(movies),
          hotArray: Array.isArray(hot),
        });

        if (isMounted) {
          setMovieList(Array.isArray(movies) ? movies : []);
          setMovieHot(Array.isArray(hot) ? hot : []);

          console.log("📝 State updated with movies data");

          // Mark movies as loaded in global state
          setComponentsLoaded((prev) => ({ ...prev, movies: true }));

          // Wait a bit to ensure everything renders
          setTimeout(() => {
            if (isMounted) {
              setAllDataLoaded(true);
              setComponentLoading("showMovies", false);

              console.log(
                "✅ ShowMovies: All data loaded, notifying parent...",
              );
              console.log("🔗 onDataLoaded exists:", !!onDataLoaded);

              // Notify parent that movies data is ready
              if (onDataLoaded) {
                onDataLoaded(true);
              }
            }
          }, 100);
        }
      } catch (error) {
        console.error("❌ ShowMovies fetch error:", error);
        if (isMounted) {
          setMovieList([]);
          setMovieHot([]);
          setAllDataLoaded(true);
          setComponentLoading("showMovies", false);

          // Even on error, notify parent to prevent infinite loading
          if (onDataLoaded) {
            onDataLoaded(false);
          }
        }
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []); // FIXED: Empty dependency array to prevent infinite re-renders

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  // For when used in Home wrapper, don't show individual loading
  const isLoadingMovies = isComponentLoading("showMovies");

  if (onDataLoaded) {
    // When used in Home wrapper, just return content or nothing
    if (isLoadingMovies || !allDataLoaded) {
      return null; // Let Home component handle loading
    }
  } else {
    // When used standalone, show individual loading
    if (isLoadingMovies || !allDataLoaded) {
      return (
        <div className={`min-h-screen ${themeClasses.primary} flex items-center justify-center`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Đang chuẩn bị nội dung...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`px-4 sm:px-6 md:px-8 lg:px-10 ${themeClasses.secondary} w-full`}>
      {/* Remove animation when used in Home wrapper */}
      <nav className="flex items-center space-x-2 py-4">
        <Link to="/" className="text-white text-lg sm:text-xl font-semibold">
          Movies
        </Link>
        <span className="text-white">{<FaChevronRight />}</span>
        <span className="text-blue-500 text-lg sm:text-xl font-semibold">
          danh mục phổ biến
        </span>
      </nav>

      {/* Hot Movies Section */}
      <HorizontalMovies
        title="Phim hot"
        movies={movieHot}
        to="/allmovies"
        onMovieClick={handleMovieClick}
        categoryId={null}
      />

      {/* Popular Movies Section */}
      <HorizontalMovies
        title="Phim thịnh hành | đề xuất"
        movies={movieList}
        to="/allmovies"
        onMovieClick={handleMovieClick}
        categoryId={null}
      />

      {/* Continue Watching Section */}
      <ContinueWatchingSection />

      {/* Grid Movies Section */}
      <GridMovies
        title="Phim mới | Phim lẻ"
        movies={movieList}
        moviesPerPage={6}
      />
    </div>
  );
};

export default ShowMovies;
