import React, { useEffect, useState } from "react";
import HorizontalMovies from "./HorizontalMovies";
import GridMovies from "./GridMovies";
import { fetchMovieByHot, fetchMovies, fetchCategories } from "../services/api";
import { Link } from "react-router-dom";
import MovieList from "./MovieList";

const ShowMovies = () => {
  const [movieList, setMovieList] = useState([]);
  const [movieHot, setMovieHot] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState({
    movies: true,
    hot: true,
    categories: true,
  });

  useEffect(() => {
    // Fetch all data in parallel
    const fetchAll = async () => {
      try {
        const [movies, hot, cats] = await Promise.all([
          fetchMovies(),
          fetchMovieByHot(),
          fetchCategories(),
        ]);
        setMovieList(movies);
        setMovieHot(hot);
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading({ movies: false, hot: false, categories: false });
      }
    };
    fetchAll();
  }, []);

  const handleMovieClick = (movieId) => {
    console.log(`Navigating to movie with ID: ${movieId}`);
    // Add navigation logic here
  };

  return (
    <div className="px-10 bg-gray-800 w-full">
      <nav className="my-4">
        <Link to="/" className="text-white">
          Movies
        </Link>
        <span className="text-white">{" > "}</span>
        <span className="text-blue-500">danh mục phổ biến</span>
      </nav>

      <div>
        {loading.hot ? (
          <p>Loading movies...</p>
        ) : (
          <HorizontalMovies
            title="Phim hot"
            movies={movieHot}
            to="/allmovies"
            MovieListComponent={
              <MovieList movies={movieHot} onMovieClick={handleMovieClick} />
            }
          />
        )}
      </div>

      <div>
        {loading.movies ? (
          <p>Loading movies...</p>
        ) : (
          <HorizontalMovies title="Thịnh hành" movies={movieList} />
        )}
      </div>

      <div>
        {loading.movies ? (
          <p>Loading movies...</p>
        ) : (
          <GridMovies
            title="Phim mới | Phim lẻ"
            movies={movieList}
            moviesPerPage={6}
          />
        )}
      </div>
    </div>
  );
};

export default ShowMovies;
