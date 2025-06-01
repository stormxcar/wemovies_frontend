import React, { useEffect, useState } from "react";
import HorizontalMovies from "./HorizontalMovies";
import GridMovies from "./GridMovies";
import { fetchMovieByHot, fetchMovies, fetchCategories } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import SkeletonWrapper from "./SkeletonWrapper";
import {FaChevronRight} from "react-icons/fa";

const ShowMovies = () => {
  const navigate = useNavigate();
  const [movieList, setMovieList] = useState([]);
  const [movieHot, setMovieHot] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState({ movies: true, hot: true, categories: true });

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const [movies, hot, cats] = await Promise.all([
          fetchMovies(),
          fetchMovieByHot(),
          fetchCategories(),
        ]);

        if (isMounted) {
          setMovieList(Array.isArray(movies) ? movies : []);
          setMovieHot(Array.isArray(hot) ? hot : []);
          setCategories(Array.isArray(cats) ? cats : []);
          setLoading({ movies: false, hot: false, categories: false });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (isMounted) {
          setMovieList([]);
          setMovieHot([]);
          setCategories([]);
          setLoading({ movies: false, hot: false, categories: false });
        }
      }
    };

    fetchAll();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="px-10 bg-gray-800 w-full">
      <nav className="my-4 flex items-center space-x-2">
        <Link to="/" className="text-white text-xl font-semibold">
          Movies
        </Link>
        <span className="text-white">{<FaChevronRight/>}</span>
        <span className="text-blue-500 text-xl font-semibold">danh mục phổ biến</span>
      </nav>

      {/* <SkeletonWrapper loading={loading.hot} height={320}> */}
        <HorizontalMovies
          title="Phim hot"
          movies={movieHot}
          to="/allmovies"
          onMovieClick={handleMovieClick}
          categoryId={null}
        />
      {/* </SkeletonWrapper> */}

      {/* <SkeletonWrapper loading={loading.movies} height={320}> */}
        <HorizontalMovies
          title="Phim thịnh hành | đề xuất"
          movies={movieList}
          to="/allmovies"
          onMovieClick={handleMovieClick}
          categoryId={null}
        />
      {/* </SkeletonWrapper> */}

      {/* <SkeletonWrapper loading={loading.movies} height={600}> */}
        <GridMovies
          title="Phim mới | Phim lẻ"
          movies={movieList}
          moviesPerPage={6}
        />
      {/* </SkeletonWrapper> */}
    </div>
  );
};

export default ShowMovies;