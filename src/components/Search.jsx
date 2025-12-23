import React from "react";
import { useLocation } from "react-router-dom";
import MovieList from "./MovieList";

function Search() {
    const { state } = useLocation();
    const movies = state?.movies || [];

    return (
        <div className="bg-gray-900 text-white px-10 w-full flex-1 pt-20">
            <div className="">
                {movies.length > 0 ? (
                    // <GridMovies title="Kết quả tim kiếm" movies={movies} moviesPerPage={8} />
                    <MovieList movies={movies} title="Kết quả tim kiếm"/>
                ) : (
                    <p>Không tìm thấy phim</p>
                )}
            </div>
        </div>
    );
}

export default Search;
