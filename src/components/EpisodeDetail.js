// EpisodeDetail.js
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const EpisodeDetail = () => {
    const { id, episodeIndex } = useParams();
    const [movieDetail, setMovieDetail] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchMovieDetail = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/movies/${id}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                if (isMounted) setMovieDetail(data);
            } catch (error) {
                // Optionally handle error
                if (isMounted) setMovieDetail(null);
            }
        };
        fetchMovieDetail();
        return () => { isMounted = false; };
    }, [id]);

    if (!movieDetail) return <div>Loading...</div>;

    const episodeLinks = movieDetail.episodeLinks?.split(',') || [];
    const episodeLink = episodeLinks[episodeIndex] || '';

    const category = movieDetail.movieCategories?.[0]?.name?.toLowerCase() || '';

    return (
        <div className="px-10 bg-gray-800 w-full">
            <nav className="my-4">
                <Link to="/" className="text-white">Movies</Link>
                <span className="text-white mx-2">{'>'}</span>
                <Link to={`/movies/${category}`} className="text-white">{category}</Link>
                <span className="text-white mx-2">{'>'}</span>
                <span className="text-blue-500">{movieDetail.title}</span>
            </nav>
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-2xl mb-2 text-white">
                    {movieDetail.title} - Tập {Number(episodeIndex) + 1}
                </h1>
                {episodeLink ? (
                    <iframe
                        width="615"
                        height="315"
                        src={episodeLink}
                        title={`${movieDetail.title} - Tập ${Number(episodeIndex) + 1}`}
                        frameBorder="1"
                        allowFullScreen
                    />
                ) : (
                    <div className="text-white">Không tìm thấy tập phim này.</div>
                )}
            </div>
        </div>
    );
};

export default EpisodeDetail;