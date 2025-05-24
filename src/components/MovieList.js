import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactPaginate from 'react-paginate';

function MovieList({ movies = [], onMovieClick }) {
  const location = useLocation();
  const { category } = location.state || {};
  const [filteredMovies, setFilteredMovies] = useState([]);

  useEffect(() => {
    if (category) {
      const filtered = movies.filter(movie => movie.category === category);
      setFilteredMovies(filtered);
    } else {
      setFilteredMovies(movies);
    }
  }, [category, movies]);
  const [currentPage, setCurrentPage] = useState(0);
  const moviesPerPage = 7; // Number of movies per page (matches screenshot)

  // Pagination logic
  const offset = currentPage * moviesPerPage;
  const currentMovies = filteredMovies.slice(offset, offset + moviesPerPage);
  const pageCount = Math.ceil(filteredMovies.length / moviesPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  // Internal CardMovie component
  const CardMovie = ({ movie }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div className="relative rounded-lg w-45 h-80 cursor-pointer">
        <div
          className="relative w-full h-full overflow-visible"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onMovieClick(movie.movie_id)}
        >
          {/* Original Card */}
          <div
            className="absolute w-full h-full transition-transform duration-300"
            style={{ transform: isHovered ? 'scale(1)' : 'scale(1)' }}
          >
            <img
              src={movie.thumb_url}
              alt={movie.title}
              className="rounded-lg w-full h-full object-cover"
              style={{ objectPosition: 'top' }}
            />
            <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black to-transparent text-white text-center">
              <h3 className="text-lg">{movie.title}</h3>
              <h3 className="font-bold">{movie.release_year}</h3>
            </div>
          </div>

          {/* Expanded Overlay Card */}
          {isHovered && (
            <div
              className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 w-[400px] h-[500px] bg-black/90 text-white rounded-lg shadow-lg transition-opacity duration-300 z-[99999] flex flex-col gap-0 overflow-visible pointer-events-auto"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              <img
                src={movie.thumb_url}
                alt={movie.title}
                className="rounded-lg w-full h-[70%] object-cover"
                style={{ objectPosition: 'top' }}
              />
              <div className="px-6 py-2 flex justify-end flex-col">
                <h3 className="text-lg font-bold">{movie.title}</h3>
                <p>Release Year: {movie.release_year}</p>
                <button className="mt-2 bg-blue-500 text-white p-2 rounded">
                  Watch Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="movie-list-container w-full h-full bg-gray-900 text-white p-4 min-h-screen">
      {/* Title */}
      <h2 className="text-xl font-bold mb-4"></h2>

      {/* Movie Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {currentMovies.length > 0 ? (
          currentMovies.map((movie) => (
            <CardMovie key={movie.movie_id} movie={movie} />
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-80 text-white">
            No movies available
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="pagination flex justify-center mt-4">
          <ReactPaginate
            previousLabel={<span className="px-2">←</span>}
            nextLabel={<span className="px-2">→</span>}
            breakLabel={'...'}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={3}
            onPageChange={handlePageClick}
            containerClassName="flex items-center gap-2"
            activeClassName="bg-gray-600"
            pageClassName="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer"
            pageLinkClassName="text-white"
            previousClassName="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer"
            previousLinkClassName="text-white"
            nextClassName="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer"
            nextLinkClassName="text-white"
            breakClassName="px-3 py-1 rounded bg-gray-700"
            breakLinkClassName="text-white"
            disabledClassName="opacity-50 cursor-not-allowed"
          />
          <span className="ml-2 text-gray-300">
            Trang {currentPage + 1} / {pageCount}
          </span>
        </div>
      )}
    </div>
  );
}

export default MovieList;
