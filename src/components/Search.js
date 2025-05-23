import React from "react";
import { useLocation } from "react-router-dom";
import GridMovies from "./GridMovies";

function Search() {
    const { state } = useLocation();
    const movies = state?.movies || [];

    return (
        <div className="bg-gray-800 text-white py-4 px-10 w-full">
            <div className="text-center">
                {movies.length > 0 ? (
                    <GridMovies title="Search Results" movies={movies} moviesPerPage={8} />
                ) : (
                    <p>Không tìm thấy phim</p>
                )}
            </div>
        </div>
    );
}

export default Search;
