// EpisodeDetail.js
import React from 'react';
import {Link, useParams} from 'react-router-dom';
import { useEffect, useState } from 'react';

const EpisodeDetail = () => {
    const { episodeIndex } = useParams();
    const { id } = useParams();
    const [movieDetail, setMovieDetail] = useState(null);

    useEffect(() => {
        const fetchMovieDetail = async () => {
            const response = await fetch(`http://localhost:8080/api/movies/${id}`);
            const data = await response.json();
            setMovieDetail(data);
        };

        fetchMovieDetail();
    }, [id]);

    if (!movieDetail) return <div>Loading...</div>;

    const episodeLinks = movieDetail.episodeLinks ? movieDetail.episodeLinks.split(',') : [];
    const episodeLink = episodeLinks[episodeIndex];

    return (
        <div className="px-10 bg-gray-800 w-full">
            <div>
                <nav className="my-4">
                    <Link to="/" className="text-white">Movies</Link> <span className="text-white">{'>'}</span>
                    <Link to={`/movies/${movieDetail.movieCategories[0]?.name.toLowerCase()}`}
                          className="text-white">{movieDetail.movieCategories[0]?.name.toLowerCase()}</Link> <span
                    className="text-white">{'>'}</span>
                    <span className="text-blue-500">{movieDetail.title}</span>
                </nav>
            </div>
            <div className="flex items-center justify-center flex-col">
                <h1 className="text-2xl mb-2 text-white">{movieDetail.title} - Tập {parseInt(episodeIndex) + 1}</h1>
                <iframe
                    width="615"
                    height="315"
                    src={episodeLink}
                    title={`${movieDetail.title} - Tập ${parseInt(episodeIndex) + 1}`}
                    frameBorder="1"
                    allowFullScreen
                ></iframe>
            </div>

        </div>
    );
};

export default EpisodeDetail;