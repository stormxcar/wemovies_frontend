import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import HorizontalMovies from "./HorizontalMovies";

const DetailMovie = () => {
  const { id } = useParams();
  const [movieDetail, setMovieDetail] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  // const navigate = useNavigate();

  const fetchRelatedMovies = useCallback(async (categoryId) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/movies/category/id/${categoryId}`
      );
      const data = await res.json();
      setRelatedMovies(Array.isArray(data) ? data : []);
    } catch (e) {
      setRelatedMovies([]);
    }
  }, []);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/movies/${id}`
        );
        const data = await res.json();
        setMovieDetail(data);

        if (data.movieCategories?.length) {
          fetchRelatedMovies(data.movieCategories[0].category_id);
        }
      } catch (e) {
        setMovieDetail(null);
      }
    };
    fetchMovieDetail();
  }, [id, fetchRelatedMovies]);

  if (!movieDetail) return <div>Loading...</div>;

  const episodeLinks = movieDetail.episodeLinks?.split(",") || [];

  const convertToEmbedUrl = (url) => {
    const match = url.match(
      /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const category = movieDetail.movieCategories?.[0];

  return (
    <div className=" bg-gray-800 w-full">
      <div className="relative w-full h-[70vh]">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <img
          src={movieDetail.thumb_url}
          alt={movieDetail.title}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center" }}
        />
        <div className="absolute bottom-0 w-full p-12 bg-gradient-to-t from-black to-transparent font-bold text-white rounded-b-lg uppercase">
          <span>{movieDetail.title}</span>
          <span> ({movieDetail.release_year}) </span>
          {movieDetail.vietSub && (
            <div className="my-3">
              <span className="bg-green-500 text-white px-2 py-1 rounded-lg">
                Việt Sub
              </span>
            </div>
          )}
          <Link
            to={`/movie/${id}/episode/0`}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4"
          >
            Xem phim
          </Link>
          {movieDetail.trailer && (
            <a
              href={movieDetail.trailer}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-500 text-white px-4 py-2 rounded-lg mt-4 ml-4"
            >
              Trailer
            </a>
          )}
        </div>
      </div>

      <div className="my-4 mx-4 sm:mx-8 md:mx:12 lg:mx-16 mb-8">
        <nav className="my-4">
          <Link to="/" className="text-white">
            Movies
          </Link>{" "}
          <span className="text-white">{">"}</span>
          {category && (
            <>
              <Link
                to={`/movies/${category.name.toLowerCase()}`}
                className="text-white"
              >
                {category.name.toLowerCase()}
              </Link>{" "}
              <span className="text-white">{">"}</span>
            </>
          )}
          <span className="text-blue-500">{movieDetail.title}</span>
        </nav>

        <div className="flex justify-between">
          <div className="relative w-[30%] h-[300px] flex items-start flex-col justify-start float-left mb-6">
            <img
              src={movieDetail.thumb_url}
              alt={movieDetail.title}
              className="h-full object-contain"
            />
            <div className="w-full font-bold text-white rounded-b-lg uppercase mt-4">
              <span>{movieDetail.title}</span>
              <span> ({movieDetail.release_year}) </span>
            </div>
          </div>

          <div className="w-[70%] pl-12">
            <h2 className="font-bold my-4 text-white sm:text-xl md:text-2xl">
              Nội dung chi tiết
            </h2>
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
                <span
                  className="text-white"
                  dangerouslySetInnerHTML={{ __html: movieDetail.description }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 my-4 mt-12">
        {/* <h2 className="font-bold my-4 text-white text-center">Trailer</h2>
        <div className="flex justify-center">
          <iframe
            className="w-full w-[350px] h-[315px]"
            src={convertToEmbedUrl(movieDetail.trailer)}
            title={movieDetail.title}
            frameBorder="1"
            allowFullScreen
          ></iframe>
        </div> */}

        {/* <h2 className="text-white text-center font-bold my-3">Xem phim</h2>
        <div className="flex flex-row flex-wrap">
          {episodeLinks.length > 0 ? (
            episodeLinks.map((link, idx) => (
              <div key={idx} className="my-2">
                <Link
                  to={`/movie/${id}/episode/${idx}`}
                  className="text-white bg-blue-400 p-3 mr-3 mb-3 rounded-lg"
                >
                  Tập {idx + 1}
                </Link>
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
        </div> */}
      </div>

      <HorizontalMovies title="Phim liên quan" movies={relatedMovies} />
    </div>
  );
};

export default DetailMovie;
