import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
// icon filter
import { FaFilter } from "react-icons/fa";
import { fetchJson, fetchCategories, fetchMovieType } from "../services/api";
import useDocumentTitle from "../hooks/useDocumentTitle";

function MovieList({ movies = [], onMovieClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryName } = useParams();
  const [showFilter, setShowFilter] = useState(false);
  const {
    category,
    movies: stateMovies,
    title,
    categoryId,
  } = location.state || {};
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);

  const [types, setTypes] = useState([]); // Thể loại (categories) - Drama, Action, etc.
  const [movieTypes, setMovieTypes] = useState([]); // Loại phim (movie types) - Phim lẻ, Phim bộ, etc.

  // Set document title based on category or title
  useDocumentTitle(title || categoryName || "Danh sách phim");

  // Filter states
  const [selectedCountry, setSelectedCountry] = useState("Tất cả");
  const [selectedMovieType, setSelectedMovieType] = useState("Tất cả");
  const [selectedRating, setSelectedRating] = useState("Tất cả");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");
  const [selectedVersion, setSelectedVersion] = useState("Tất cả");
  const [selectedYear, setSelectedYear] = useState("Tất cả");
  const [selectedSort, setSelectedSort] = useState("Mới nhất");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [categoriesResponse, movieTypesResponse] = await Promise.all([
          fetchCategories(), // Thể loại (movieCategories) - Drama, Action, etc.
          fetchMovieType(), // Loại phim (movieTypes) - có thể là dữ liệu khác
        ]);

        console.log("Categories response:", categoriesResponse); // Debug log
        console.log("Movie types response:", movieTypesResponse); // Debug log

        const categoriesArray = Array.isArray(categoriesResponse)
          ? categoriesResponse
          : [];
        const movieTypesArray = Array.isArray(movieTypesResponse)
          ? movieTypesResponse
          : [];

        setTypes(categoriesArray); // Thể loại cho filter "Thể loại"
        setMovieTypes(movieTypesArray); // Loại phim (nếu cần dùng)
      } catch (error) {
        console.error("Error fetching data:", error);
        setTypes([]);
        setMovieTypes([]);
      }
    };
    fetchAll();
  }, [stateMovies?.length, movies?.length]);

  const fetchMoviesByCategory = async (categoryName) => {
    try {
      const movies = await fetchJson(`/api/movies/category/${categoryName}`);
      const movieData = Array.isArray(movies.data) ? movies.data : [];

      console.log("Movie data:", movieData); // Debug log
      if (movieData.length > 0) {
        console.log("Sample movie:", movieData[0]); // Debug log
        console.log("Movie categories:", movieData[0]?.movieCategories); // Debug log
      }

      setAllMovies(movieData);
      setFilteredMovies(movieData);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setAllMovies([]);
      setFilteredMovies([]);
    }
  };

  useEffect(() => {
    if (stateMovies && Array.isArray(stateMovies)) {
      // Nếu có stateMovies từ navigate (ví dụ: từ HorizontalMovies), sử dụng nó
      setAllMovies(stateMovies);
      setFilteredMovies(stateMovies);
    } else if (categoryId) {
      // Nếu có categoryId, gọi API để lấy danh sách phim
      fetchMoviesByCategory(categoryId);
    } else if (categoryName) {
      // Nếu chỉ có categoryName (truy cập trực tiếp), gọi API với tên category
      fetchMoviesByCategory(categoryName);
    } else {
      // Sử dụng movies mặc định nếu không có dữ liệu
      setAllMovies(movies);
      setFilteredMovies(movies);
    }
  }, [categoryName, stateMovies, categoryId, movies]);

  // Auto-apply filters when any filter state changes
  useEffect(() => {
    if (allMovies.length > 0) {
      applyFiltersInternal();
    }
  }, [
    selectedCountry,
    selectedMovieType,
    selectedRating,
    selectedGenre,
    selectedVersion,
    selectedYear,
    selectedSort,
    allMovies,
  ]);

  // Internal filter function that doesn't close modal
  const applyFiltersInternal = () => {
    let filtered = [...allMovies];

    // Filter by year
    if (selectedYear !== "Tất cả") {
      filtered = filtered.filter(
        (movie) =>
          movie.release_year && movie.release_year.toString() === selectedYear,
      );
    }

    // Filter by country
    if (selectedCountry !== "Tất cả") {
      filtered = filtered.filter(
        (movie) => movie.country && movie.country.name === selectedCountry,
      );
    }

    // Filter by movie type (loại phim) - sử dụng data thật từ movieTypes
    if (selectedMovieType !== "Tất cả") {
      filtered = filtered.filter(
        (movie) =>
          movie.movieTypes &&
          movie.movieTypes.some((type) => type.name === selectedMovieType),
      );
    }

    // Filter by age rating
    if (selectedRating !== "Tất cả") {
      filtered = filtered.filter((movie) => movie.ageRating === selectedRating);
    }

    // Filter by genre (thể loại)
    if (selectedGenre !== "Tất cả") {
      filtered = filtered.filter(
        (movie) =>
          movie.movieCategories &&
          movie.movieCategories.some((cat) => cat.name === selectedGenre),
      );
    }

    // Filter by version (phiên bản)
    if (selectedVersion !== "Tất cả") {
      if (selectedVersion === "Phụ đề") {
        filtered = filtered.filter((movie) => movie.vietSub === true);
      } else if (
        selectedVersion === "Lồng tiếng" ||
        selectedVersion === "Thuyết minh"
      ) {
        filtered = filtered.filter((movie) => movie.vietSub === false);
      }
    }

    // Apply sorting
    if (selectedSort === "Mới nhất") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (selectedSort === "Mới cập nhật") {
      filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (selectedSort === "Lượt xem") {
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (selectedSort === "Năm sản xuất") {
      filtered.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
    }

    console.log("Final filtered count:", filtered.length);
    console.log("=== END FILTER DEBUG ===");

    setFilteredMovies(filtered);
    setCurrentPage(0); // Reset to first page
  };

  // Public apply filters function (for button)
  const applyFilters = () => {
    applyFiltersInternal();
    setShowFilter(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCountry("Tất cả");
    setSelectedMovieType("Tất cả");
    setSelectedRating("Tất cả");
    setSelectedGenre("Tất cả");
    setSelectedVersion("Tất cả");
    setSelectedYear("Tất cả");
    setSelectedSort("Mới nhất");
    // Don't need to call applyFiltersInternal here as useEffect will handle it
  };

  const [currentPage, setCurrentPage] = useState(0);
  const moviesPerPage = 21; // 3x7 for better responsive distribution

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
      <div className="relative rounded-lg w-full h-64 sm:h-72 md:h-80 lg:h-64 cursor-pointer mx-auto mt-8 sm:mt-12 lg:mt-20">
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
              loading="lazy"
              onError={(e) => {
                e.target.src = "/placeholder-professional.svg";
              }}
            />
            <div className="w-full p-2 text-white text-center">
              <h3 className="text-sm sm:text-base lg:text-lg truncate">
                {movie.title}
              </h3>
              <p className="text-xs sm:text-sm">{movie.release_year}</p>
            </div>
          </div>
          {isHovered && (
            <div
              className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 w-[280px] sm:w-[320px] lg:w-[350px] h-[350px] sm:h-[380px] lg:h-[400px] bg-black/90 text-white rounded-lg shadow-lg transition-opacity duration-300 z-[99999] flex flex-col gap-0 overflow-visible pointer-events-auto hidden sm:flex"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              <img
                src={movie.thumb_url}
                alt={movie.title}
                className="rounded-lg w-full h-[70%] object-cover"
                style={{ objectPosition: "top" }}
                loading="lazy"
                onError={(e) => {
                  e.target.src = "/placeholder-professional.svg";
                }}
              />
              <div className="px-4 lg:px-6 py-2 flex justify-end flex-col">
                <h3 className="text-base lg:text-lg font-bold truncate">
                  {movie.title}
                </h3>
                <p className="text-sm">Năm: {movie.release_year}</p>
                <button className="mt-2 bg-blue-500 text-white p-2 rounded text-sm hover:bg-blue-600 transition-colors">
                  Xem ngay
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
      <h2 className="text-xl font-bold mb-4">{title || categoryName}</h2>

      {/* Selected Filters Display */}
      <div className="mb-4 flex flex-wrap gap-2">
        {selectedCountry !== "Tất cả" && (
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            Quốc gia: {selectedCountry}
            <button
              onClick={() => setSelectedCountry("Tất cả")}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedYear !== "Tất cả" && (
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            Năm: {selectedYear}
            <button
              onClick={() => setSelectedYear("Tất cả")}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedGenre !== "Tất cả" && (
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            Thể loại: {selectedGenre}
            <button
              onClick={() => setSelectedGenre("Tất cả")}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedMovieType !== "Tất cả" && (
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            Loại phim: {selectedMovieType}
            <button
              onClick={() => setSelectedMovieType("Tất cả")}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedRating !== "Tất cả" && (
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            Xếp hạng: {selectedRating}
            <button
              onClick={() => setSelectedRating("Tất cả")}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
        {selectedVersion !== "Tất cả" && (
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            Phiên bản: {selectedVersion}
            <button
              onClick={() => setSelectedVersion("Tất cả")}
              className="text-white hover:text-red-300"
            >
              ×
            </button>
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation(); // Ngăn sự kiện lan ra ngoài để đóng modal
          setShowFilter((prev) => !prev);
        }}
        className="flex items-center gap-1 cursor-pointer bg-gray-700 p-2 px-4 rounded w-fit mb-4"
      >
        <h3>Bộ lọc</h3>
        <span className="flex items-center gap-2 text-white">
          <FaFilter />
        </span>
      </button>

      {showFilter && (
        <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg border-[1px] border-gray-800">
          <div className="flex flex-col gap-4 pr-10 pl-6">
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                Quốc gia:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                {[
                  "Tất cả",
                  "Anh",
                  "Canada",
                  "Hàn Quốc",
                  "Hồng Kông",
                  "Mỹ",
                  "Nhật Bản",
                  "Pháp",
                  "Thái Lan",
                  "Trung Quốc",
                  "Úc",
                  "Đài Loan",
                  "Đức",
                ].map((item) => (
                  <li
                    key={item}
                    className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                      selectedCountry === item
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedCountry(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center ">
              <h4 className="font-semibold min-w-[100px] text-right">
                Loại phim:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                <li
                  className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                    selectedMovieType === "Tất cả"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedMovieType("Tất cả")}
                >
                  Tất cả
                </li>
                {movieTypes.map((item) => (
                  <li
                    key={item.id}
                    className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                      selectedMovieType === item.name
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedMovieType(item.name)}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                Xếp hạng:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                {["Tất cả", "P", "K", "T13", "T16", "T18"].map((item) => (
                  <li
                    key={item}
                    className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                      selectedRating === item
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedRating(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex">
              <h4 className="font-semibold min-w-[100px] text-right">
                Thể loại:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                <li
                  className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                    selectedGenre === "Tất cả"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-700"
                  }`}
                  onClick={() => setSelectedGenre("Tất cả")}
                >
                  Tất cả
                </li>
                {types.map((item) => (
                  <li
                    key={item.id}
                    className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                      selectedGenre === item.name
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedGenre(item.name)}
                  >
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                Phiên bản:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                {["Tất cả", "Phụ đề", "Lồng tiếng", "Thuyết minh"].map(
                  (item) => (
                    <li
                      key={item}
                      className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                        selectedVersion === item
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedVersion(item)}
                    >
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                Năm sản xuất:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                {[
                  "Tất cả",
                  "2025",
                  "2024",
                  "2023",
                  "2022",
                  "2021",
                  "2020",
                  "2019",
                  "2018",
                  "2017",
                  "2016",
                  "2015",
                  "2014",
                  "2013",
                  "2012",
                  "2011",
                  "2010",
                ].map((item) => (
                  <li
                    key={item}
                    className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                      selectedYear === item
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedYear(item)}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center">
              <h4 className="font-semibold min-w-[100px] text-right">
                Sắp xếp:
              </h4>
              <ul className="space-y-1 flex flex-wrap gap-4 ml-4 items-center">
                {["Mới nhất", "Mới cập nhật", "Lượt xem", "Năm sản xuất"].map(
                  (item) => (
                    <li
                      key={item}
                      className={`cursor-pointer hover:text-blue-400 px-2 py-1 rounded transition-colors ${
                        selectedSort === item
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-700"
                      }`}
                      onClick={() => setSelectedSort(item)}
                    >
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="mt-8 flex justify-start space-x-4">
              <button
                className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                onClick={applyFilters}
              >
                Lọc kết quả
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                onClick={resetFilters}
              >
                Xóa tất cả bộ lọc
              </button>
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                onClick={() => setShowFilter(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movie Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 lg:gap-6 xl:gap-8">
        {currentMovies.length > 0 ? (
          currentMovies.map((movie) => (
            <CardMovie
              key={movie.id}
              movie={movie}
              onMovieClick={handleMovieClick}
            />
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-80 text-white">
            Không có phim nào được tìm thấy
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
