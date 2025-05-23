import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMoviesByCategory, fetchMoviesByCountryAndCategory } from '../services/api';
import GridMovies from "./GridMovies";

const CategoryMovies = () => {
    const { categoryName } = useParams();
    const [movies, setMovies] = useState([]);
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const navigate = useNavigate();

    // Fetch countries once
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/countries`)
            .then(res => res.json())
            .then(setCountries)
            .catch(() => setCountries([]));
    }, []);

    // Fetch movies when category or country changes
    const fetchMovies = useCallback(async () => {
        let data = [];
        if (selectedCountry) {
            data = await fetchMoviesByCountryAndCategory(selectedCountry, categoryName);
        } else {
            data = await fetchMoviesByCategory(categoryName);
        }
        setMovies(Array.isArray(data) ? data : []);
    }, [categoryName, selectedCountry]);

    useEffect(() => {
        fetchMovies();
    }, [fetchMovies]);

    return (
        <div className="w-full px-10 bg-gray-800">
            {/* Breadcrumb */}
            <nav className="my-4">
                <span onClick={() => navigate('/')} className="text-white cursor-pointer">Movies</span>
                <span className="text-white">{' > '}</span>
                <span className="text-blue-500">{categoryName}</span>
            </nav>

            <div>
                <h2 className="text-white">Lọc phim:</h2>
                <select
                    onChange={e => setSelectedCountry(e.target.value)}
                    value={selectedCountry}
                >
                    <option value="">Tất cả</option>
                    {countries.map(country => (
                        <option key={country.country_id} value={country.name}>{country.name}</option>
                    ))}
                </select>
                <button
                    className="bg-blue-400 ml-2"
                    onClick={fetchMovies}
                >
                    Duyệt phim
                </button>
            </div>

            <div>
                {movies.length > 0 ? (
                    <GridMovies title={categoryName} movies={movies} moviesPerPage={12} />
                ) : (
                    <p>Không có phim theo quốc gia này</p>
                )}
            </div>
        </div>
    );
};

export default CategoryMovies;
