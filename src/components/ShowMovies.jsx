import React, { useEffect, useState } from "react";
import HorizontalMovies from "./HorizontalMovies";
import GridMovies from "./GridMovies";
import ContinueWatchingSection from "./ContinueWatchingSection";

import { fetchMovieByHot, fetchMovies } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { SkeletonMovieSlider, SkeletonBanner } from "./loading/SkeletonLoaders";
import { useLoading } from "../utils/LoadingContext";

const ShowMovies = () => {
  const navigate = useNavigate();
  const { setLoading, isLoading } = useLoading();
  const [movieList, setMovieList] = useState([]);
  const [movieHot, setMovieHot] = useState([]);

  const isLoadingMovies = isLoading("showMovies");
  const isLoadingHot = isLoading("hotMovies");

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        setLoading("showMovies", true, "Đang tải danh sách phim...");
        setLoading("hotMovies", true);

        const [movies, hot] = await Promise.all([
          fetchMovies(),
          fetchMovieByHot(),
        ]);

        if (isMounted) {
          setMovieList(Array.isArray(movies) ? movies : []);
          setMovieHot(Array.isArray(hot) ? hot : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setMovieList([]);
          setMovieHot([]);
        }
      } finally {
        if (isMounted) {
          setLoading("showMovies", false);
          setLoading("hotMovies", false);
        }
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, [setLoading]);

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 bg-gray-800 w-full">
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
      {isLoadingHot ? (
        <SkeletonMovieSlider title="Phim hot" />
      ) : (
        <HorizontalMovies
          title="Phim hot"
          movies={movieHot}
          to="/allmovies"
          onMovieClick={handleMovieClick}
          categoryId={null}
        />
      )}

      {/* Popular Movies Section */}
      {isLoadingMovies ? (
        <SkeletonMovieSlider title="Phim thịnh hành | đề xuất" />
      ) : (
        <HorizontalMovies
          title="Phim thịnh hành | đề xuất"
          movies={movieList}
          to="/allmovies"
          onMovieClick={handleMovieClick}
          categoryId={null}
        />
      )}

      {/* Continue Watching Section */}
      <ContinueWatchingSection />

      {/* Grid Movies Section */}
      {isLoadingMovies ? (
        <div className="space-y-4">
          <div className="h-6 bg-gray-700 rounded w-48"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <GridMovies
          title="Phim mới | Phim lẻ"
          movies={movieList}
          moviesPerPage={6}
        />
      )}

  
    </div>
  );
};

export default ShowMovies;
