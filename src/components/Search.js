import React from "react";
import {useState } from "react";
import { Link,useParams, useLocation } from "react-router-dom";
import HorizontalMovies from "./HorizontalMovies";
import GridMovies from "./GridMovies";
import {fetchMoviesByName} from "../services/api";

function Search() {
    const location = useLocation();
    const {movies} = location.state || {};

    console.log("Search movies:", movies)

    return (
        <div className="bg-gray-800 text-white py-4 px-10 w-full">
            <div className="text-center">
                <ul>
                    {movies.length > 0 ? (
                        <GridMovies title="Search Results" movies={movies} moviesPerPage={8} />
                    ) : (
                        <p>Không tìm thấy phim</p>
                        )
                    }


                </ul>
            </div>
        </div>
    );
}

export default Search;
