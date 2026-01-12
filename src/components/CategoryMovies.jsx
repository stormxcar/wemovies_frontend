import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  fetchMoviesByCategory,
  fetchMoviesByCountryAndCategory,
} from "../services/api";
import GridMovies from "./GridMovies";
import { fetchJson } from "../services/api";
import { useLoading } from "../utils/LoadingContext";

const CategoryMovies = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Lấy state từ navigate
  const { setLoading, isLoading } = useLoading();
  const [movies, setMovies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");

  // Lấy state từ location
  const { state } = location;

  // console.log('====================================');
  // console.log("state:", state);
  // console.log('====================================');

  // Fetch countries once
  useEffect(() => {
    fetchJson(`/api/countries`)
      .then((data) => setCountries(Array.isArray(data.data) ? data.data : []))
      .catch(() => setCountries([]));
  }, []);

  // Fetch movies when category or country changes
  const fetchMovies = useCallback(async () => {
    try {
      setLoading("categoryMovies", true, "Đang tải danh sách phim...");
      let data = [];
      if (selectedCountry) {
        data = await fetchMoviesByCountryAndCategory(
          selectedCountry,
          categoryName
        );

        console.log("====================================");
        console.log("data by country and category", data);
        console.log("====================================");
      } else {
        data = await fetchMoviesByCategory(categoryName);
      }
      setMovies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setMovies([]);
    } finally {
      setLoading("categoryMovies", false);
    }
  }, [categoryName, selectedCountry, setLoading]);

  // Kiểm tra state và fetch movies
  useEffect(() => {
    if (state?.movies && Array.isArray(state.movies)) {
      // Nếu có movies trong state, sử dụng nó
      console.log("====================================");
      console.log("Using movies from state:", state.movies);
      console.log("====================================");
      setMovies(state.movies);
      setLoading("categoryMovies", false);
    } else {
      // Nếu không có state, gọi API
      fetchMovies();
    }
  }, [state, fetchMovies, setLoading]);

  return (
    <div className="w-full px-10 bg-gray-800 pt-16 flex-1">
      {/* Breadcrumb */}
      <nav className="my-4">
        <span
          onClick={() => navigate("/")}
          className="text-white cursor-pointer"
        >
          Movies
        </span>
        <span className="text-white">{" > "}</span>
        <span className="text-blue-500">{categoryName}</span>
      </nav>

      {isLoading("categoryMovies") ? null : (
        <>
          {movies.length > 0 ? (
            <div className="flex items-center mb-4 gap-2">
              <h2 className="text-white">Lọc phim:</h2>
              <select
                onChange={(e) => setSelectedCountry(e.target.value)}
                value={selectedCountry}
                className="bg-gray-50 outline-none border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block py-2 px-4"
              >
                <option className="font-medium" value="">
                  Tất cả
                </option>
                {countries.map((country) => (
                  <option key={country.country_id} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
              <button
                className="bg-blue-400 ml-2 px-4 py-2 rounded text-white"
                onClick={fetchMovies}
              >
                Duyệt phim
              </button>
            </div>
          ) : null}

          <div className="my-4">
            {movies.length > 0 ? (
              <GridMovies
                title={state?.title || categoryName}
                movies={movies}
                moviesPerPage={12}
              />
            ) : (
              <p className="text-white font-semibold text-xl">
                Hiện chưa có phim nào !!
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryMovies;
