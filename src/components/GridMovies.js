import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import SkeletonWrapper from "./SkeletonWrapper";

function GridMovies({ title, movies = [], moviesPerPage, loading = false }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const validMovies = Array.isArray(movies) ? movies : [];
  const [imageLoadedMap, setImageLoadedMap] = useState({});

  // Log để kiểm tra loading
  useEffect(() => {
    // console.log("Loading in GridMovies:", loading);
    // console.log("Movies in GridMovies:", validMovies);
  }, [loading, validMovies]);

  // Khởi tạo imageLoadedMap với giá trị mặc định khi movies thay đổi
  useEffect(() => {
    const initialMap = validMovies.reduce((map, movie) => {
      map[movie.id] = false;
      return map;
    }, {});
    setImageLoadedMap(initialMap);
  }, [movies]);

  // Timeout dự phòng để tắt skeleton sau 5 giây nếu onLoad không được gọi
  useEffect(() => {
    const timers = validMovies.map((movie) => {
      return setTimeout(() => {
        setImageLoadedMap((prev) => {
          if (!prev[movie.id]) {
            console.log(`Timeout: Forcing image load for movie ${movie.id}`);
            return { ...prev, [movie.id]: true };
          }
          return prev;
        });
      }, 5000);
    });

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [movies]);

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
      console.log(`Image loaded for movie ${movieId}:`, newMap);
      return newMap;
    });
  };

  if (validMovies.length === 0 && !loading) {
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
    <div className="my-6 w-full">
      <div className="flex w-full flex-row items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {loading
          ? Array(moviesPerPage)
              .fill()
              .map((_, index) => (
                <div key={index} className="w-30 h-64">
                  <SkeletonWrapper loading={true} height={256} width={192}>
                    <div className="w-full h-[70%] rounded-lg bg-gray-300" />
                  </SkeletonWrapper>
                  <div className="h-[30%] p-4">
                    <SkeletonWrapper loading={true} height={20} width="80%">
                      <div className="w-full h-5 bg-gray-300" />
                    </SkeletonWrapper>
                    <SkeletonWrapper loading={true} height={20} width="40%">
                      <div className="w-full h-5 bg-gray-300" />
                    </SkeletonWrapper>
                  </div>
                </div>
              ))
          : currentMovies.map((movie) => (
              <div
                key={movie.id}
                className="w-30 h-64 group cursor-pointer overflow-hidden"
                onClick={() => handleClickToDetail(movie.id)}
              >
                <div className="overflow-visible h-[70%] group-hover:overflow-visible">
                  <SkeletonWrapper
                    loading={imageLoadedMap[movie.id] === undefined || !imageLoadedMap[movie.id]}
                    height={256}
                    width={400}
                  >
                    <img
                      src={movie.thumb_url}
                      alt={movie.title}
                      className="rounded mb-2 w-full h-full flex-1 object-cover transition-transform group-hover:scale-105"
                      style={{ objectPosition: "top" }}
                      onLoad={() => handleImageLoad(movie.id)}
                      onError={() => handleImageLoad(movie.id)}
                      loading="eager"
                    />
                  </SkeletonWrapper>
                </div>
                <div className="h-[30%] p-4">
                  <SkeletonWrapper
                    loading={imageLoadedMap[movie.id] === undefined || !imageLoadedMap[movie.id]}
                    height={20}
                    width="80%"
                  >
                    <h4 className="text-lg font-semibold flex-1 text-white">
                      {movie.title}
                    </h4>
                  </SkeletonWrapper>
                  <SkeletonWrapper
                    loading={imageLoadedMap[movie.id] === undefined || !imageLoadedMap[movie.id]}
                    height={20}
                    width="40%"
                  >
                    <h5 className="text-gray-400">
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
