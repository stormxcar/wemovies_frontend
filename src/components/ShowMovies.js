import React, { useState, useEffect } from 'react';
import HorizontalMovies from './HorizontalMovies';
import GridMovies from './GridMovies';
import {fetchMovieByHot, fetchMovies} from '../services/api';
import {fetchCategories} from '../services/api';
import { Link } from 'react-router-dom';

const ShowMovies = () => {
    const [movieList, setMovieList] = useState([]);
    const [movieHot, setMovieHot] = useState([]);
    const [categories, setCategories] = useState([]);


    useEffect(() => {
        const getMovies = async () => {
            try {
                const data = await fetchMovies(); // Lấy dữ liệu từ API
                setMovieList(data); // Giả sử `data` là một mảng các danh mục phim
                console.log("Movies:", data);
            } catch (error) {
                console.error("Error fetching movies:", error);
            }
        };
        getMovies();
    }, []);

    useEffect(() => {
        const getMovieHots = async () => {
            try{
                const data = await fetchMovieByHot();
                setMovieHot(data);
            }catch(error){
                console.log("error: ",error)
            }
        };
        getMovieHots();
        }, []);

    useEffect(() => {
        const getCategories = async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        }
        getCategories();
    },[]);

    return (
        <div className="px-10 bg-gray-800 w-full">
            <div>
                {/* Breadcrumb */}

                <nav className="my-4">
                    <Link to="/" className="text-white">Movies</Link> <span className="text-white">{'>'}</span>
                    <span className="text-blue-500"> danh mục phổ biến</span>
                </nav>
            </div>
            <div>
                {/*phim hot */}
                {movieHot.length > 0 ? (
                    <div>
                        <HorizontalMovies title="Phim hot" movies={movieHot} />
                    </div>
                ) : (
                    <p>Loading movies...</p>

                )}

            </div>
            <div>
                {/*<h1 className="text-green-500 font-bold">Thể loại</h1>*/}
                {movieList.length > 0 ? (
                    <div>
                        <HorizontalMovies title="Thịnh hành" movies={movieList} />
                    </div>
                ) : (
                    <p>Loading movies...</p>
                )}
            </div>
            <div>
                {/*<h1 className="text-green-500 font-bold">Phim mới | Phim lẻ</h1>*/}
                {movieList.length > 0 ? (
                    <div>
                       <GridMovies title="Phim mới | Phim lẻ" movies={movieList} moviesPerPage={12} />

                    </div>
                ) : (
                    <p>Loading movies...</p>
                )}
            </div>

        </div>
    );
};

export default ShowMovies;
