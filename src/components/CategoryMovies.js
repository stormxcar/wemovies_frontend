import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMoviesByCategory, fetchMoviesByCountryAndCategory } from '../services/api';
import GridMovies from "./GridMovies";

const CategoryMovies = () => {
    const { categoryName } = useParams(); // Lấy tên danh mục từ URL
    const [movies, setMovies] = useState([]);
    const [countryFilter, setCountryFilter] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const getMovies = async () => {
            if(selectedCountry){
                const data = await fetchMoviesByCountryAndCategory(selectedCountry, categoryName);
                setMovies(data);
            }else{
                const data = await fetchMoviesByCategory(categoryName);
                setMovies(Array.isArray(data) ? data : []);
            }
        };
        getMovies();
    }, [categoryName, selectedCountry]);

    useEffect(() => {
        const getCountries = async () => {
            const response = await fetch ("http://localhost:8080/api/countries");
            const data = await response.json();

            // console.log("Countries:", data);
            setCountryFilter(data);
        }

        getCountries();
    }, []);



    return (
        <div className="w-full px-10 bg-gray-800">
            {/* Breadcrumb */}
            <nav className="my-4">
                <span onClick={() => navigate('/')} className="text-white cursor-pointer">Movies</span> <span className="text-white">{'>'}</span>
                <span className="text-blue-500">{categoryName}</span>
            </nav>

            {/*<h2 className="text-2xl font-bold mb-4">{categoryName} Movies</h2>*/}

            <div>
                <h2 className="text-white">Lọc phim:</h2>
                <select onChange={(e) => setSelectedCountry(e.target.value)} value={selectedCountry}>
                    <option value="">Tất cả</option>
                    {countryFilter.map((country) => (
                        <option key={country.country_id} value={country.name}>{country.name}</option>
                    ))}
                </select>
                {/*<span>Năm</span>*/}
                <button className=" bg-blue-400" onClick={() => setSelectedCountry(selectedCountry)}>Duyệt phim
                </button>
            </div>

            <div className="">
                {movies.length > 0 ? (
                    <GridMovies title={categoryName} movies={movies} moviesPerPage={12}/>
                ) : (
                    <p>Không có phim theo quốc gia này</p>
                )}
            </div>
        </div>
    );
};

export default CategoryMovies;
