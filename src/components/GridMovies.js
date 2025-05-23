import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';

function GridMovies({ title, movies, moviesPerPage }) {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    const handleClickToDetail = (movieID) => {
        navigate(`/movie/${movieID}`);
    }

    const indexOfLastMovie = currentPage * moviesPerPage;
    const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
    const currentMovies = movies.slice(indexOfFirstMovie, indexOfLastMovie);

    const totalPages = Math.ceil(movies.length / moviesPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    }

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    }

    return (
        <div className="my-6 w-full">
            <div className="flex w-full flex-row items-center justify-between">
                <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
                {/*<a href="" className="text-blue-500">Xem thêm</a>*/}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentMovies.map((movie, index) => (
                    <div key={index} className="w-30 h-60 group cursor-pointer overflow-hidden"
                         onClick={() => handleClickToDetail(movie.movie_id)}>
                        <div className="overflow-hidden h-[70%]">
                            <img src={movie.thumb_url} alt={movie.title}
                                 className="rounded mb-2 w-full h-full flex-1 object-cover transition-transform group-hover:scale-105"/>
                        </div>

                        <div className="bg-gray-500 h-[30%] p-4">
                            <h4 className="text-lg font-semibold flex-1">{movie.title}</h4>
                            <h5>({movie.titleByLanguage})</h5>
                        </div>

                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-4 items-center ">
                <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 rounded text-black">
                    Previous
                </button>
                <span className="text-white">Page {currentPage} of {totalPages}</span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 rounded text-black">
                    Next
                </button>
            </div>
        </div>
    );
}

export default GridMovies;