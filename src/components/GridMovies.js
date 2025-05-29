import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";

function GridMovies({ title, movies, moviesPerPage }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const validMovies = Array.isArray(movies) ? movies : [];

  const totalPages = useMemo(
    () => Math.ceil(movies.length / moviesPerPage),
    [movies.length, moviesPerPage]
  );

  const currentMovies = useMemo(() => {
    const start = (currentPage - 1) * moviesPerPage;
    if (!Array.isArray(movies) || movies.length === 0) {
      return [];
    }
    return movies.slice(start, start + moviesPerPage);
  }, [movies, currentPage, moviesPerPage]);

  // console.log('====================================');
  // console.log("currentMovies:", currentMovies);
  // console.log('====================================');

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
    <div className="my-6 w-full">
      <div className="flex w-full flex-row items-center justify-between mb-4">
        <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
        <Link
          to=""
          className="text-white hover:bg-blue-700 rounded px-4 py-2 flex items-center"
        >
          Xem tất cả
          <FaChevronRight className="inline ml-2" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {currentMovies.map((movie) => (
          <div
            key={movie.id}
            className="w-30 h-64 group cursor-pointer overflow-hidden"
            onClick={() => handleClickToDetail(movie.id)}
          >
            <div className="overflow-hidden h-[70%]">
              {/* <div className="absolute inset-0 w-full h-full bottom-0 bg-gradient-to-b from-black to-transparent"></div> */}
              <img
                src={movie.thumb_url}
                alt={movie.title}
                className="rounded mb-2 w-full h-full flex-1 object-cover transition-transform group-hover:scale-105"
                style={{ objectPosition: "top" }}
              />
            </div>
            <div className="h-[30%] p-4">
              <h4 className="text-lg font-semibold flex-1 text-white">
                {movie.title}
              </h4>
              <h5 className="text-gray-400">({movie.titleByLanguage})</h5>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}

export default GridMovies;
