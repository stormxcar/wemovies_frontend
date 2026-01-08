import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import HorizontalMovies from "./HorizontalMovies";
import { fetchJson } from "../services/api";
import { ClipLoader } from "react-spinners";
import { FaChevronRight } from "react-icons/fa";
import WatchlistButton from "./WatchlistButton";

const DetailMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movieDetail, setMovieDetail] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  // const navigate = useNavigate();

  const fetchRelatedMovies = useCallback(async (categoryId) => {
    if (!categoryId) {
      console.log("No valid categoryId provided");
      setRelatedMovies([]);
      return;
    }
    try {
      console.log("Fetching related movies for categoryId:", categoryId);
      const data = await fetchJson(`/api/movies/category/id/${categoryId}`);

      setRelatedMovies(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error("Error fetching related movies:", e);
      setRelatedMovies([]);
    }
  }, []);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const data = await fetchJson(`/api/movies/${id}`);

        setMovieDetail(data);

        if (data.data.movieCategories?.length) {
          fetchRelatedMovies(data.data.movieCategories[0].id);
        }
      } catch (e) {
        setMovieDetail(null);
      }
    };
    fetchMovieDetail();
  }, [id, fetchRelatedMovies]);

  if (!movieDetail)
    return (
      <div className="flex items-center justify-center">
        <ClipLoader color="#555" />
      </div>
    );

  // const episodeLinks = movieDetail.data.episodeLinks?.split(",") || [];
  const episodeLinks =
    Array.isArray(movieDetail.data.episodes) &&
    movieDetail.data.episodes?.map((episode) => ({
      link: episode.link,
      episodeNumber: episode.episodeNumber,
    }));

  const convertToEmbedUrl = (url) => {
    const match = url.match(
      /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const category = movieDetail.data.movieCategories?.[0];

  const handleMovieClick = (movieId) => {
    // console.log(`Navigating to movie with ID: ${movieId}`);
    navigate(`/movie/${movieId}`);
    // Add navigation logic here
  };

  // console.log('====================================');
  // console.log("relatedMovies:", relatedMovies);
  // console.log('====================================');

  return (
    <div className="bg-gray-800 w-full flex-1">
      <div className="relative w-full h-[80vh]">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <img
          src={movieDetail.data.thumb_url}
          alt={movieDetail.data.title}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center" }}
        />
        <div className="absolute bottom-0 w-full p-12 bg-gradient-to-t from-black to-transparent font-bold text-white rounded-b-lg uppercase">
          <span>{movieDetail.data.title}</span>
          <span className="mr-4"> ({movieDetail.data.release_year}) </span>
          {movieDetail.data.vietSub && (
            <div className="my-3 mb-6">
              <span className="bg-green-500 text-white px-2 py-1 rounded-lg">
                Việt Sub
              </span>
            </div>
          )}
          <div className="flex items-center space-x-4 mt-4">
            <Link
              to={"/movie/watch/" + movieDetail.data.id}
              state={{ movieDetail: movieDetail.data }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Xem phim
            </Link>
            <WatchlistButton movieId={movieDetail.data.id} size="large" />
            {movieDetail.data.trailer && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Trailer
              </button>
            )}
          </div>
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-black/50 border-2 border-white rounded-lg shadow-lg p-2 w-3/4 max-w-2xl">
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white float-right mb-8"
                >
                  Close
                </button>
                <iframe
                  src={convertToEmbedUrl(movieDetail.data.trailer)}
                  title="Trailer"
                  width="100%"
                  height="400px"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="my-12 mx-4 sm:mx-8 md:mx:12 lg:mx-16 mb-8">
        <nav className="mb-8 flex items-center space-x-2">
          <Link to="/" className="text-white text-xl font-semibold">
            Movies
          </Link>{" "}
          <span className="text-white mx-2">{<FaChevronRight />}</span>
          {category && (
            <>
              <Link
                to={`/movies/${category.name.toLowerCase()}`}
                className="text-white text-xl font-semibold"
              >
                {category.name.toLowerCase()}
              </Link>{" "}
              <span className="text-white mx-2">{<FaChevronRight />}</span>
            </>
          )}
          <span className="text-blue-500 text-xl font-semibold">
            {movieDetail.data.title}
          </span>
        </nav>

        <div className="flex justify-between">
          <div className="relative w-[30%] h-[300px] flex items-start flex-col justify-start float-left mb-6">
            <img
              src={movieDetail.data.thumb_url}
              alt={movieDetail.data.title}
              className="h-full object-contain"
            />
            <div className="w-full font-bold text-white rounded-b-lg uppercase mt-4">
              <span>{movieDetail.data.title}</span>
              <span> ({movieDetail.data.release_year}) </span>
            </div>
          </div>

          <div className="w-[70%] pl-12">
            <h2 className="font-bold my-4 text-white sm:text-xl md:text-2xl">
              Nội dung chi tiết
            </h2>
            <h1 className="text-2xl mb-2 text-white">
              {movieDetail.data.title}
            </h1>
            <div>
              <div className="my-3">
                <span className="text-white">Đạo diễn: </span>
                <span className="text-white">{movieDetail.data.director}</span>
              </div>
              <div className="my-3">
                <span className="text-white">Diễn viên: </span>
                <span className="text-white">{movieDetail.data.actors}</span>
              </div>
              <div className="my-3">
                <span className="text-white">Thời lượng: </span>
                <span className="text-white">
                  {movieDetail.data.duration} phút
                </span>
              </div>
              <div className="my-3">
                <span className="text-white">Mô tả: </span>
                <span
                  className="text-white"
                  dangerouslySetInnerHTML={{
                    __html: movieDetail.data.description,
                  }}
                />
              </div>

              <div className="flex flex-row flex-wrap mt-8">
                {episodeLinks.length > 0
                  ? episodeLinks.map((link, idx) => (
                      <div key={idx} className="my-2">
                        <Link
                          to={`/movie/${id}/episode/${idx}`}
                          className="text-white bg-gray-300/50 py-4 px-12 mr-3 mb-3 rounded-lg text-xl"
                          state={{ movieDetail: movieDetail.data }}
                        >
                          Tập {link.episodeNumber}
                        </Link>
                      </div>
                    ))
                  : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="my-4 mt-12"></div> */}

      <div className="my-4 mx-12 mb-8 mt-40">
        <HorizontalMovies
          title="Phim liên quan"
          movies={relatedMovies}
          to="/allmovies"
          onMovieClick={handleMovieClick}
          categoryId={null}
        />
      </div>
    </div>
  );
};

export default DetailMovie;
