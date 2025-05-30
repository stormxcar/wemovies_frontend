import React, { useEffect, useState, useCallback } from "react"; // Import added
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { fetchJson } from "../admin/api/fetch.api";
import HorizontalMovies from "./HorizontalMovies";
import { FaChevronLeft } from "react-icons/fa";

const EpisodeDetail = () => {
  const { id, episodeIndex } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // This line causes the error if not set up correctly
  const [movieDetail, setMovieDetail] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchMovieDetail = async () => {
      try {
        const stateMovieDetail = location.state?.movieDetail;
        if (stateMovieDetail) {
          console.log("Using state movieDetail:", stateMovieDetail);
          if (isMounted) setMovieDetail({ data: stateMovieDetail });
        } else {
          const response = await fetchJson(`/api/movies/${id}`);
          if (!response.ok) throw new Error("Network response was not ok");
          const data = await response.json();
          console.log(`Fetched movie detail for ID: ${id}`, data);
          if (isMounted) setMovieDetail(data);
        }
      } catch (error) {
        console.error("Error fetching movie detail:", error);
        if (isMounted) setMovieDetail(null);
      }
    };

    fetchMovieDetail();
    return () => {
      isMounted = false;
    };
  }, [id, location.state]);

  const fetchRelatedMovies = useCallback(
    async (categoryId) => {
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
    },
    [fetchJson]
  );

  // console.log('====================================');
  // console.log("data apisoe related", relatedMovies);
  // console.log('====================================');

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

  if (!movieDetail) return <div>Loading...</div>;

  const episodeLink =
    movieDetail.data?.episodes?.[Number(episodeIndex)]?.link || "";
  console.log("====================================");
  console.log("Movie episodeLink:", episodeLink);
  console.log("====================================");

  const episodeLinks =
    Array.isArray(movieDetail.data.episodes) &&
    movieDetail.data.episodes?.map((episode) => ({
      link: episode.link,
      episodeNumber: episode.episodeNumber,
    }));

  const category =
    movieDetail.data?.movieCategories?.[0]?.name?.toLowerCase() || "";

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const currentEpisode = Number(episodeIndex);

  return (
    <div className="px-10 bg-gray-800 w-full flex-1 pt-16">
      <div className="flex flex-col items-center justify-center mt-6 mb-4">
        <div className="flex items-center mb-4 w-full">
          <div className="rounded-full text-white flex items-center justify-center border-2 p-3 mr-3">
            <FaChevronLeft className="text-xl cursor-pointer" />
          </div>
          <p className="text-xl text-white">
            Xem phim {movieDetail.data?.title}
          </p>
        </div>
        {episodeLink ? (
          <div className="w-full rounded-lg">
            <iframe
              width="100%"
              height="600px"
              src={episodeLink}
              title={`${movieDetail.data?.title} - Tập ${
                Number(episodeIndex) + 1
              }`}
              className="rounded-lg"
              frameBorder="1"
              allowFullScreen
            />
            <nav className="my-10">
              <Link to="/" className="text-white">
                Movies
              </Link>
              <span className="text-white mx-2">{">"}</span>
              <Link to={`/movies/${category}`} className="text-white">
                {category}
              </Link>
              <span className="text-white mx-2">{">"}</span>
              <span className="text-blue-500">{movieDetail.data?.title}</span>
            </nav>
          </div>
        ) : (
          <div className="text-white">Không tìm thấy tập phim này.</div>
        )}
      </div>

      <div className="flex justify-between my-8 ">
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
          <h1 className="text-2xl mb-2 text-white">{movieDetail.data.title}</h1>
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
                        className={`text-white py-4 px-12 text-xl mr-3 mb-3 rounded-lg ${
                          currentEpisode === idx
                            ? "bg-blue-500 font-bold"
                            : "bg-gray-300/50"
                        }`}
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

      <div className="my-4 mb-8 mt-40">
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

export default EpisodeDetail;
