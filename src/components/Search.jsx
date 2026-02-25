import React from "react";
import { useLocation } from "react-router-dom";
import MovieList from "./MovieList";
import useDocumentTitle from "../hooks/useDocumentTitle";

function Search() {
  const { state } = useLocation();
  const movies = state?.movies || [];

  // Set document title for search page
  useDocumentTitle("Kết quả tìm kiếm");

  return (
    <div className="bg-gray-900 text-white px-10 w-full pt-20">
      <div className="">
        {movies.length > 0 ? (
          // <GridMovies title="Kết quả tim kiếm" movies={movies} moviesPerPage={8} />
          <MovieList movies={movies} title="Kết quả tim kiếm" />
        ) : (
          <p>Không tìm thấy phim</p>
        )}
      </div>
    </div>
  );
}

export default Search;
