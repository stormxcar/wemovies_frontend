import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import SkeletonWrapper from "./SkeletonWrapper";

function GridMovies({ title, movies = [], moviesPerPage }) {
  const navigate = useNavigate();
  const { themeClasses, isDarkMode } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const validMovies = useMemo(
    () => (Array.isArray(movies) ? movies : []),
    [movies],
  );
  const [imageLoadedMap, setImageLoadedMap] = useState({});

  // Khởi tạo imageLoadedMap với giá trị mặc định khi movies thay đổi
  useEffect(() => {
    console.log("🎞️ GridMovies: Movies data received:", validMovies.length);
    const initialMap = validMovies.reduce((map, movie) => {
      map[movie.id] = false;
      return map;
    }, {});
    setImageLoadedMap(initialMap);

    // Nếu có movies data, auto-hide skeleton sau delay ngắn
    if (validMovies.length > 0) {
      console.log("⏱️ GridMovies: Setting auto-hide timer...");
      const quickTimer = setTimeout(() => {
        console.log("🚀 GridMovies: Auto-hiding skeletons...");
        const quickMap = validMovies.reduce((map, movie) => {
          map[movie.id] = true;
          return map;
        }, {});
        setImageLoadedMap(quickMap);
      }, 1500); // Shorter delay for better UX

      return () => clearTimeout(quickTimer);
    }
  }, [validMovies]);

  // Timeout dự phòng để tắt skeleton sau 5 giây nếu onLoad không được gọi
  useEffect(() => {
    const timers = validMovies.map((movie) => {
      return setTimeout(() => {
        setImageLoadedMap((prev) => {
          if (!prev[movie.id]) {
            return { ...prev, [movie.id]: true };
          }
          return prev;
        });
      }, 5000);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [validMovies]);

  const totalPages = useMemo(
    () => Math.ceil(validMovies.length / moviesPerPage),
    [validMovies.length, moviesPerPage],
  );

  const currentMovies = useMemo(() => {
    const start = (currentPage - 1) * moviesPerPage;
    if (!Array.isArray(validMovies) || validMovies.length === 0) {
      return [];
    }
    return validMovies.slice(start, start + moviesPerPage);
  }, [validMovies, currentPage, moviesPerPage]);

  const handleClickToDetail = useCallback(
    (movieID) => {
      navigate(`/movie/${movieID}`);
    },
    [navigate],
  );

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleImageLoad = (movieId) => {
    setImageLoadedMap((prev) => {
      const newMap = { ...prev, [movieId]: true };
      return newMap;
    });
  };

  if (validMovies.length === 0) {
    return (
      <div className="">
        <h2 className={`text-2xl font-bold mb-4 ${themeClasses.textPrimary}`}>
          {title}
        </h2>
        <div
          className={`flex items-center justify-center h-80 ${themeClasses.textSecondary}`}
        >
          Không có phim nào có sẵn
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 w-full">
      <div className="flex w-full flex-row items-center justify-between mb-4">
        <h2 className={`text-2xl font-bold mb-4 ${themeClasses.textPrimary}`}>
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {currentMovies.map((movie) => (
          <div
            key={movie.id}
            className={`group relative w-full aspect-[2/3] cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/70 hover:shadow-[0_0_0_1px_rgba(251,146,60,0.35),0_18px_35px_rgba(0,0,0,0.45)] ${
              isDarkMode
                ? "border-white/10 bg-black/20"
                : "border-gray-200 bg-white"
            }`}
            onClick={() => handleClickToDetail(movie.id)}
          >
            <SkeletonWrapper
              loading={
                imageLoadedMap[movie.id] === undefined ||
                !imageLoadedMap[movie.id]
              }
              height="100%"
              width="100%"
            >
              <img
                src={movie.thumb_url}
                alt={movie.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                style={{ objectPosition: "top" }}
                onLoad={() => handleImageLoad(movie.id)}
                onError={() => handleImageLoad(movie.id)}
                loading="eager"
              />
            </SkeletonWrapper>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

            {movie?.hot && (
              <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-2 py-1 text-[10px] font-bold tracking-wide text-white shadow-md">
                HOT
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 z-10 p-3">
              <h4 className="line-clamp-2 text-sm font-semibold text-white drop-shadow sm:text-base">
                {movie.title}
              </h4>
              <div className="mt-2 flex items-center justify-between gap-2">
                <h5 className="text-xs text-gray-200/90 sm:text-sm">
                  {movie.titleByLanguage || movie.release_year || "N/A"}
                </h5>
                <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium text-white/95 backdrop-blur-sm sm:text-xs">
                  {movie.release_year || "HD"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8 items-center">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`px-4 py-4 ${themeClasses.cardSecondary} ${themeClasses.textPrimary} items-center flex justify-center rounded-full hover:opacity-80`}
          >
            <FaChevronLeft className="inline" />
          </button>
          <span className={themeClasses.textPrimary}>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-4 ${themeClasses.cardSecondary} rounded-full ${themeClasses.textPrimary} items-center flex justify-center hover:opacity-80`}
          >
            <FaChevronRight className="inline" />
          </button>
        </div>
      )}
    </div>
  );
}

export default GridMovies;
