import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Link} from 'react-router-dom';
import HorizontalMovies from "./HorizontalMovies";

const DetailMovie = () => {
    const {id} = useParams(); // Lấy ID từ URL
    const [movieDetail, setMovieDetail] = useState(null);
    const [relatedMovies, setRelatedMovies] = useState([]);
    const {categoryName} = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMovieDetail = async () => {
            // Giả sử bạn có API lấy chi tiết phim bằng ID
            const response = await fetch(`http://localhost:8080/api/movies/${id}`);
            const data = await response.json();
            console.log('Movie detail:', data);
            setMovieDetail(data);

            if (data.movieCategories && data.movieCategories.length > 0) {
                const categoryId = data.movieCategories[0].category_id;
                console.log('Category ID:', categoryId)
                fetchRelatedMovies(categoryId);
            }
        };

        const fetchRelatedMovies = async (categoryId) => {
            // http://localhost:8080/api/movies/category/id/2
            const response = await fetch(`http://localhost:8080/api/movies/category/id/${categoryId}`);
            const data = await response.json();
            console.log('Related movies:', data)
            setRelatedMovies(Array.isArray(data) ? data : []);
        };

        fetchMovieDetail();
    }, [id]);

    if (!movieDetail) return <div>Loading...</div>;

    const episodeLinks = movieDetail.episodeLinks ? movieDetail.episodeLinks.split(',') : [];

    const convertToEmbedUrl = (url) => {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    };

    return (
        <div className="px-4 lg:px-10 sm:px-4 bg-gray-800 w-full">
            <div>
                <nav className="my-4">
                    <Link to="/" className="text-white">Movies</Link> <span className="text-white">{'>'}</span>
                    <Link to={`/movies/${movieDetail.movieCategories[0]?.name.toLowerCase()}`}
                          className="text-white">{movieDetail.movieCategories[0]?.name.toLowerCase()}</Link> <span
                    className="text-white">{'>'}</span>
                    <span className="text-blue-500">{movieDetail.title}</span>
                </nav>
            </div>
            <div className="relative w-full h-[50vh]">
                <img src={movieDetail.thumb_url} alt={movieDetail.title}
                     className="w-full h-full object-cover rounded-lg"/>
                <div
                    className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black to-transparent font-bold text-white rounded-b-lg uppercase">
                    <span>{movieDetail.title}</span>
                    <span> ({movieDetail.release_year}) </span>
                    <div className="my-3">
                        {movieDetail.vietSub ?
                            <span className="bg-green-500 text-white px-2 py-1 rounded-lg">Việt Sub</span> : null}
                    </div>
                </div>


            </div>


            <div className="my-4 mx-4 sm:mx-8 md:mx:12 lg:mx-16">
                <h2 className="font-bold my-4 text-white sm:text-xl md:text-2xl">Nội dung chi tiết</h2>
                <h1 className="text-2xl mb-2 text-white">{movieDetail.title}</h1>
                <div>
                    <div className="my-3">
                        <span className="text-white">Đạo diễn: </span>
                        <span className="text-white">{movieDetail.director}</span>
                    </div>
                    <div className="my-3">
                        <span className="text-white">Diễn viên: </span>
                        <span className="text-white">{movieDetail.actors}</span>
                    </div>
                    <div className="my-3">
                        <span className="text-white">Thời lượng: </span>
                        <span className="text-white">{movieDetail.duration} phút</span>
                    </div>

                    <div className="my-3">
                        <span className="text-white">Mô tả: </span>
                        <span className="text-white" dangerouslySetInnerHTML={{__html: movieDetail.description}}/>
                    </div>
                </div>
            </div>

            <div className="mx-4 my-4">
                <h2 className="font-bold my-4 text-white text-center">Trailer</h2>
                <div className="flex justify-center">
                    <iframe
                        className="w-full w-[350px] h-[315px]"
                        src={convertToEmbedUrl(movieDetail.trailer)}
                        // src="https://www.youtube.com/embed/6ApiubHgJP4"
                        title={movieDetail.title}
                        frameBorder="1"
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="flex flex-col justify-center items-center gap-4 w-full my-4">
                </div>
                <h2 className="text-white text-center font-bold my-3">Xem phim</h2>
                <div className="flex flex-row flex-wrap">
                    {episodeLinks.length > 0 ? (
                        episodeLinks.map((link, index) => (
                            <div key={index} className="my-2">
                                <Link to={`/movie/${id}/episode/${index}`}
                                      className="text-white bg-blue-400 p-3 mr-3 mb-3 rounded-lg">Tập {index + 1}</Link>
                            </div>
                        ))
                    ) : (
                        <div className="mx-2 justify-center items-center flex w-full">
                            <iframe
                                className="lg:w-[1000px] lg:h-[500px] md:w-[500px] md:h-[350px] sm:w-[500px] sm:h-[315px]"
                                src={movieDetail.link}
                                title={movieDetail.title}
                                frameBorder="1"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <div>
                    <HorizontalMovies title={"Phim liên quan"} movies={relatedMovies}/>
                </div>
            </div>
        </div>
    );
};

export default DetailMovie;
