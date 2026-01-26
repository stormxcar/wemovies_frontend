import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import SkeletonWrapper from "./SkeletonWrapper";

function GridMovies({ title, movies = [], moviesPerPage }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const validMovies = useMemo(
    () => (Array.isArray(movies) ? movies : []),
    [movies]
  );
  const [imageLoadedMap, setImageLoadedMap] = useState({});

  // Khởi tạo imageLoadedMap với giá trị mặc định khi movies thay đổi
  useEffect(() => {
    const initialMap = validMovies.reduce((map, movie) => {
      map[movie.id] = false;
      return map;
    }, {});
    setImageLoadedMap(initialMap);
  }, [validMovies]);

  // Timeout dự phòng để tắt skeleton sau 5 giây nếu onLoad không được gọi
  useEffect(() => {
    const timers = validMovies.map((movie) => {
      return setTimeout(() => {
        setImageLoadedMap((prev) => {
          if (!prev[movie.id]) {
            // return { ...prev, [movie.id]: true };
          }
          return prev;
        });
      }, 5000);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [validMovies]);

  const totalPages = useMemo(
    () => Math.ceil(validMovies.length / moviesPerPage),
    [validMovies.length, moviesPerPage]
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
    [navigate]
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
      // return newMap;
    });
  };

  if (validMovies.length === 0) {
    return (
      <div className="">
        <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
        <div className="flex items-center justify-center h-80 text-white">
          Không có phim nào có sẵn
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 w-full">
      <div className="flex w-full flex-row items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {currentMovies.map((movie) => (
          <div
            key={movie.id}
            className="w-full aspect-[2/3] group cursor-pointer overflow-hidden"
            onClick={() => handleClickToDetail(movie.id)}
          >
            <div className="overflow-visible h-full group-hover:overflow-visible">
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
                  className="rounded-lg w-full h-full object-cover transition-transform group-hover:scale-105"
                  style={{ objectPosition: "top" }}
                  onLoad={() => handleImageLoad(movie.id)}
                  onError={() => handleImageLoad(movie.id)}
                  loading="eager"
                />
              </SkeletonWrapper>
            </div>
            <div className="p-2 sm:p-3">
              <SkeletonWrapper
                loading={
                  imageLoadedMap[movie.id] === undefined ||
                  !imageLoadedMap[movie.id]
                }
                height={20}
                width="80%"
              >
                <h4 className="text-sm sm:text-base font-semibold flex-1 text-white line-clamp-2">
                  {movie.title}
                </h4>
              </SkeletonWrapper>
              <SkeletonWrapper
                loading={
                  imageLoadedMap[movie.id] === undefined ||
                  !imageLoadedMap[movie.id]
                }
                height={16}
                width="60%"
              >
                <h5 className="text-xs sm:text-sm text-gray-400">
                  ({movie.titleByLanguage || movie.release_year})
                </h5>
              </SkeletonWrapper>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8 items-center">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-4 bg-gray-300 text-black items-center flex justify-center rounded-full"
          >
            <FaChevronLeft className="inline" />
          </button>
          <span className="text-white">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-4 bg-gray-300 rounded-full text-black items-center flex justify-center"
          >
            <FaChevronRight className="inline" />
          </button>
        </div>
      )}
    </div>
  );
}

export default GridMovies;
