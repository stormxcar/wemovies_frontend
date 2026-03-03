import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchJson } from "../services/api";
import HorizontalMovies from "./HorizontalMovies";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const EpisodeDetail = () => {
  const { id, episodeIndex } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [movieDetail, setMovieDetail] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);

  const fetchRelatedMovies = useCallback(async (categoryId) => {
    if (!categoryId) {
      setRelatedMovies([]);
      return;
    }
    try {
      const data = await fetchJson(`/api/movies/category/id/${categoryId}`);

      setRelatedMovies(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setRelatedMovies([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchMovieDetail = async () => {
      const stateMovieDetail = location.state?.movieDetail;

      if (stateMovieDetail && isMounted) {
        setMovieDetail({ data: stateMovieDetail });

        if (stateMovieDetail.movieCategories?.length) {
          fetchRelatedMovies(stateMovieDetail.movieCategories[0].id);
        }
      }

      try {
        const data = await fetchJson(`/api/movies/${id}`);
        if (!isMounted) return;

        setMovieDetail(data);

        if (data.data.movieCategories?.length) {
          fetchRelatedMovies(data.data.movieCategories[0].id);
        }
      } catch (e) {
        if (!stateMovieDetail && isMounted) {
          setMovieDetail(null);
        }
      }
    };

    fetchMovieDetail();

    return () => {
      isMounted = false;
    };
  }, [id, location.state, fetchRelatedMovies]);

  const movieData = movieDetail?.data;

  const sortedEpisodes = useMemo(() => {
    const episodes = Array.isArray(movieData?.episodes)
      ? movieData.episodes
      : [];

    return [...episodes].sort((firstEpisode, secondEpisode) => {
      const firstNumber = Number(firstEpisode?.episodeNumber) || 0;
      const secondNumber = Number(secondEpisode?.episodeNumber) || 0;
      return firstNumber - secondNumber;
    });
  }, [movieData]);

  if (!movieData) return <div>Loading...</div>;

  const currentEpisode = Number(episodeIndex);
  const currentEpisodeData = sortedEpisodes[currentEpisode];
  const episodeLink = currentEpisodeData?.link || "";
  const currentEpisodeNumber =
    Number(currentEpisodeData?.episodeNumber) || currentEpisode + 1;

  const category = movieData?.movieCategories?.[0]?.name?.toLowerCase() || "";

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="px-10 bg-gray-800 w-full flex-1 pt-16">
      <div className="flex flex-col items-center justify-center mt-6 mb-4">
        <div className="flex items-center mb-4 w-full">
          <div
            className="rounded-full text-white flex items-center justify-center border-2 p-3 mr-3 cursor-pointer hover:bg-gray-700"
            onClick={() => navigate(-1)}
          >
            <FaChevronLeft className="text-xl cursor-pointer" />
          </div>
          <p className="text-xl text-white">
            {t("movieDetail.episodeDetail.watch_title", {
              title: movieData?.title,
            })}
          </p>
        </div>
        {episodeLink ? (
          <div className="w-full rounded-lg">
            <iframe
              width="100%"
              height="600px"
              src={episodeLink}
              title={`${movieDetail.data?.title} - Tập ${currentEpisodeNumber}`}
              className="rounded-lg"
              frameBorder="1"
              allowFullScreen
            />
            <nav className="my-10 flex items-center space-x-2">
              <Link to="/" className="text-white text-xl font-semibold">
                {t("navigation.movies")}
              </Link>
              <span className="text-white mx-2">{<FaChevronRight />}</span>
              {category && (
                <>
                  <Link
                    to={`/movies/${category}`}
                    className="text-white text-xl font-semibold"
                  >
                    {category}
                  </Link>
                  <span className="text-white mx-2">{<FaChevronRight />}</span>
                </>
              )}
              <span className="text-blue-500 text-xl font-semibold">
                {movieDetail.data?.title}
              </span>
            </nav>
          </div>
        ) : (
          <div className="text-white">
            {t("movieDetail.episodeDetail.no_episode")}
          </div>
        )}
      </div>

      <div className="flex justify-between my-8 ">
        <div className="relative w-[30%] h-[300px] flex items-start flex-col justify-start float-left mb-6">
          <img
            src={movieData.thumb_url}
            alt={movieData.title}
            className="h-full object-contain"
          />
          <div className="w-full font-bold text-white rounded-b-lg uppercase mt-4">
            <span>{movieData.title}</span>
            <span> ({movieData.release_year}) </span>
          </div>
        </div>

        <div className="w-[70%] pl-12">
          <h2 className="font-bold my-4 text-white sm:text-xl md:text-2xl">
            {t("movieDetail.detail_content")}
          </h2>
          <h1 className="text-2xl mb-2 text-white">{movieData.title}</h1>
          <div>
            <div className="my-3">
              <span className="text-white">
                {t("movieDetail.episodeDetail.director")}{" "}
              </span>
              <span className="text-white">{movieData.director}</span>
            </div>
            <div className="my-3">
              <span className="text-white">
                {t("movieDetail.episodeDetail.cast")}{" "}
              </span>
              <span className="text-white">{movieData.actors}</span>
            </div>
            <div className="my-3">
              <span className="text-white">
                {t("movieDetail.episodeDetail.duration")}{" "}
              </span>
              <span className="text-white">{movieData.duration} phút</span>
            </div>
            <div className="my-3">
              <span className="text-white">
                {t("movieDetail.episodeDetail.description")}{" "}
              </span>
              <span
                className="text-white"
                dangerouslySetInnerHTML={{
                  __html: movieData.description,
                }}
              />
            </div>

            <div className="mt-8">
              <h3 className="text-white text-xl font-semibold mb-4">
                Danh sách tập
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {sortedEpisodes.length > 0
                  ? sortedEpisodes.map((episode, idx) => {
                      const episodeNumber =
                        Number(episode.episodeNumber) || idx + 1;
                      const isActive = currentEpisode === idx;

                      return (
                        <Link
                          key={`${episodeNumber}-${idx}`}
                          to={`/movie/${id}/episode/${idx}`}
                          className={`group rounded-xl border p-3 transition-all duration-300 ${
                            isActive
                              ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                              : "border-gray-600 bg-gray-700/40 hover:border-blue-400 hover:bg-gray-700"
                          }`}
                          state={{ movieDetail: movieData }}
                        >
                          <div className="relative h-20 rounded-lg overflow-hidden mb-2">
                            <img
                              src={movieData.thumb_url}
                              alt={movieData.title}
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                            <span className="absolute bottom-2 left-2 text-xs font-bold text-white bg-black/60 px-2 py-1 rounded-md">
                              EP {String(episodeNumber).padStart(2, "0")}
                            </span>
                          </div>

                          <p className="text-white font-semibold text-sm">
                            {t("movieDetail.episode", {
                              number: episodeNumber,
                            })}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isActive ? "text-blue-300" : "text-gray-300"
                            }`}
                          >
                            {isActive
                              ? t("movieDetail.episodeDetail.playing")
                              : t("movieDetail.episodeDetail.watch_now")}
                          </p>
                        </Link>
                      );
                    })
                  : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="my-4 mb-8 mt-40">
        <HorizontalMovies
          title={t("movieDetail.episodeDetail.related_movies")}
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
