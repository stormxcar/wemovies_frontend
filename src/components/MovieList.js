import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
// icon filter
import { FaFilter } from "react-icons/fa";
import { fetchJson } from "../admin/api/fetch.api";

function MovieList({ movies = [], onMovieClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryName } = useParams();
  const {
    category,
    movies: stateMovies,
    title,
    categoryId,
  } = location.state || {};
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMoviesByCategory = async (categoryId) => {
    try {
      setLoading(true);
      const movies = await fetchJson(`/api/movies/category/id/${categoryId}`);
      setFilteredMovies(Array.isArray(movies.data) ? movies.data : []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching movies for category:", error);
      setError("Failed to load movies");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stateMovies && Array.isArray(stateMovies)) {
      // Nếu có stateMovies từ navigate (ví dụ: từ HorizontalMovies), sử dụng nó
      setFilteredMovies(stateMovies);
    } else if (categoryId) {
      // Nếu có categoryId, gọi API để lấy danh sách phim
      fetchMoviesByCategory(categoryId);
    } else if (categoryName) {
      // Nếu chỉ có categoryName (truy cập trực tiếp), thử ánh xạ sang categoryId
      const inferredCategoryId = getCategoryIdFromName(categoryName);
      if (inferredCategoryId) {
        fetchMoviesByCategory(inferredCategoryId);
      } else {
        setError("Invalid category");
      }
    } else {
      // Sử dụng movies mặc định nếu không có dữ liệu
      setFilteredMovies(movies);
    }
  }, [categoryName, stateMovies, categoryId, movies]);

  const [currentPage, setCurrentPage] = useState(0);
  const moviesPerPage = 28; // 7 columns x 4 rows

  // Pagination logic
  const offset = currentPage * moviesPerPage;
  const currentMovies = filteredMovies.slice(offset, offset + moviesPerPage);
  const pageCount = Math.ceil(filteredMovies.length / moviesPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

   const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  // Internal CardMovie component
  const CardMovie = ({ movie, onMovieClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div className="relative rounded-lg w-48 h-64 cursor-pointer mx-auto mt-20">
        <div
          className="relative w-full h-full overflow-visible"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onMovieClick && onMovieClick(movie.id)} // Kiểm tra onMovieClick trước khi gọi
        >
          <div
            className="absolute w-full h-full transition-transform duration-300"
            style={{ transform: isHovered ? "scale(1)" : "scale(1)" }}
          >
            <img
              src={movie.thumb_url}
              alt={movie.title}
              className="rounded-lg w-full h-full object-cover"
              style={{ objectPosition: "top" }}
            />
            <div className="w-full p-2 text-white text-center">
              <h3 className="text-lg">{movie.title}</h3>
              <p className="text-sm">{movie.release_year}</p>
            </div>
          </div>
          {isHovered && (
            <div
              className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 w-[350px] h-[400px] bg-black/90 text-white rounded-lg shadow-lg transition-opacity duration-300 z-[99999] flex flex-col gap-0 overflow-visible pointer-events-auto"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              <img
                src={movie.thumb_url}
                alt={movie.title}
                className="rounded-lg w-full h-[70%] object-cover"
                style={{ objectPosition: "top" }}
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
    <div className="w-full h-full bg-gray-900 text-white p-4 px-12 min-h-screen pt-32">
      {/* Title */}
      <h2 className="text-xl font-bold mb-4">{title || category}</h2>
      <div className="flex items-center gap-1 cursor-pointer bg-gray-700 p-2 px-4 rounded w-fit mb-4">
        <h3>Bộ lọc</h3>
        <button className="flex items-center gap-2 text-white">
          <FaFilter />
        </button>
      </div>

      {/* Movie Grid */}
      <div className="grid grid-cols-7 gap-8">
        {currentMovies.slice(0, 28).length > 0 ? (
          currentMovies
            .slice(0, 28)
            .map((movie) => (
              <CardMovie
                key={movie.id}
                movie={movie}
                onMovieClick={handleMovieClick}
              />
            ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-80 text-white">
            No movies available
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="pagination flex justify-center mt-28">
          <ReactPaginate
            previousLabel={<span className="px-2">←</span>}
            nextLabel={<span className="px-2">→</span>}
            breakLabel={"..."}
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
