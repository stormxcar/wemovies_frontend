import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HorizontalMovies from "./HorizontalMovies";
import { fetchJson, fetchScheduleData } from "../services/api";
import {
  FaChevronRight,
  FaHeart,
  FaShare,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import WatchlistButton from "./WatchlistButton";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useLoading } from "../context/UnifiedLoadingContext";
import { trackMovieView, trackUserAction } from "../services/analytics";
import { useWatchingTracker } from "../hooks/useWatchingTracker";
import ReviewSection from "./ReviewSection";
import useDocumentTitle from "../hooks/useDocumentTitle";

const DetailMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { setLoading, isLoading } = useLoading();
  const { t } = useTranslation();
  const [movieDetail, setMovieDetail] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Set document title based on movie title
  useDocumentTitle(movieDetail?.data?.title || "Chi tiết phim");
  // Initialize watching tracker
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleReminder, setScheduleReminder] = useState(true);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);
  const { startWatching } = useWatchingTracker(
    id,
    movieDetail?.data?.title,
    user?.id,
    isAuthenticated,
  );

  const fetchRelatedMovies = useCallback(async (categoryName) => {
    if (!categoryName) {
      setRelatedMovies([]);
      return;
    }
    try {
      const data = await fetchJson(`/api/movies/category/${categoryName}`);

      setRelatedMovies(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setRelatedMovies([]);
    }
  }, []);

  const checkScheduleStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      // Use safe schedule data fetcher
      const scheduled = await fetchScheduleData(
        `/api/schedules/check/${id}`,
        false,
      );
      setIsScheduled(Boolean(scheduled)); // Ensure boolean value

      // Check watch later status with safe fetcher
      const watchLaterList = await fetchScheduleData(
        "/api/schedules/watch-later",
        [],
      );
      const isInList = Array.isArray(watchLaterList)
        ? watchLaterList.some((item) => item.movie?.id === id)
        : false;
      setIsInWatchLater(isInList);
    } catch (error) {
      // Set defaults on error
      setIsScheduled(false);
      setIsInWatchLater(false);
    }
  }, [id, isAuthenticated]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để tạo lịch xem");
      return;
    }

    try {
      await fetchJson("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: id,
          scheduledDateTime: scheduleDateTime,
          reminderEnabled: scheduleReminder,
          notes: scheduleNotes,
        }),
      });
      toast.success("Tạo lịch xem thành công!");
      setShowScheduleForm(false);
      setScheduleDateTime("");
      setScheduleNotes("");
      setScheduleReminder(true);
      checkScheduleStatus();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo lịch xem");
    }
  };

  const handleToggleWatchLater = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
      return;
    }

    try {
      if (isInWatchLater) {
        // Remove from watch later
        await fetchJson(`/api/schedules/watch-later/${id}`, {
          method: "DELETE",
        });
        setIsInWatchLater(false);
        toast.success("Đã xóa khỏi danh sách xem sau!");
      } else {
        // Add to watch later
        try {
          // Send a far future date instead of null to avoid database constraint
          const farFutureDate = "2099-12-31T23:59:59";

          const response = await fetchJson("/api/schedules/watch-later", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              movieId: id,
              scheduledDateTime: farFutureDate, // Use far future date instead of null
              reminderEnabled: false,
              notes: "Added to watch later",
            }),
          });
          setIsInWatchLater(true);
          toast.success(t("movie.add_to_favorites"));
        } catch (error) {
          // Check if it's a "already exists" error
          if (
            error.response?.status === 400 &&
            error.response?.data?.message?.includes("đã có")
          ) {
            setIsInWatchLater(true);
            toast.info("Phim đã có trong danh sách xem sau");
          } else {
            toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
          }
        }
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  const startWatchingSession = async () => {
    if (isAuthenticated && movieDetail?.data) {
      // Estimate duration (in seconds) - default 2 hours if not provided
      const estimatedDuration = movieDetail.data.duration
        ? movieDetail.data.duration * 60
        : 7200;
      await startWatching(estimatedDuration);
    }
  };

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        setLoading("movieDetail", true, "Đang tải thông tin phim...");
        const data = await fetchJson(`/api/movies/${id}`);

        setMovieDetail(data);

        // Track movie view with analytics (respects cookie consent)
        if (data?.data?.title) {
          trackMovieView(id, data.data.title);
        }

        if (data.data.movieCategories?.length) {
          fetchRelatedMovies(data.data.movieCategories[0].name);
        }
      } catch (e) {
        setMovieDetail(null);
      } finally {
        setLoading("movieDetail", false);
      }
    };
    fetchMovieDetail();
    checkScheduleStatus();
  }, [id, fetchRelatedMovies, checkScheduleStatus, setLoading]);

  const isLoadingMovieDetail = isLoading("movieDetail");

  if (isLoadingMovieDetail || !movieDetail) {
    return null; // LoadingContext sẽ handle loading display
  }

  // const episodeLinks = movieDetail.data.episodeLinks?.split(",") || [];
  const episodeLinks =
    Array.isArray(movieDetail.data.episodes) &&
    movieDetail.data.episodes?.map((episode) => ({
      link: episode.link,
      episodeNumber: episode.episodeNumber,
    }));

  const convertToEmbedUrl = (url) => {
    const match = url.match(
      /(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const category = movieDetail.data.movieCategories?.[0];

  const handleMovieClick = (movieId) => {
    // navigate(`/movie/${movieId}`);
    // Add navigation logic here
  };

  return (
    <div className="bg-gray-800 w-full flex-1">
      <div className="relative w-full h-[80vh]">
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
        <img
          src={movieDetail.data.banner_url}
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
          <div className="flex items-center justify-between mt-4">
            {/* Left group - Watch and Trailer buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to={"/movie/watch/" + movieDetail.data.id}
                state={{ movieDetail: movieDetail.data }}
                onClick={startWatchingSession}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Xem phim</span>
              </Link>
              {movieDetail.data.trailer && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <span>Trailer</span>
                </button>
              )}
            </div>

            {/* Right group - Like, Watch Later, Share buttons */}
            <div className="flex items-center space-x-3">
              <div className="min-w-[120px]">
                <WatchlistButton movieId={movieDetail.data.id} size="large" />
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
                    return;
                  }
                  handleToggleWatchLater();
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2 ${
                  isInWatchLater
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-amber-500 hover:to-orange-500 text-white"
                }`}
              >
                <FaClock />
                <span>{isInWatchLater ? "Đã thêm" : "Xem sau"}</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: movieDetail.data.title,
                      text: `Xem phim ${movieDetail.data.title}`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link đã được sao chép vào clipboard");
                  }
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center space-x-2"
              >
                <FaShare />
                <span>Chia sẻ</span>
              </button>
            </div>
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
                to={`/movies/${category.name}`}
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
                <span className="text-white">{t("movie.cast")}: </span>
                <span className="text-white">{movieDetail.data.actors}</span>
              </div>
              <div className="my-3">
                <span className="text-white">{t("movie.duration")}: </span>
                <span className="text-white">
                  {movieDetail.data.duration} phút
                </span>
              </div>
              <div className="my-3">
                <span className="text-white">Description: </span>
                <span
                  className="text-white"
                  dangerouslySetInnerHTML={{
                    __html: movieDetail.data.description,
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-3 mt-6 mb-6">
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error(
                        "Vui lòng đăng nhập để sử dụng tính năng này",
                      );
                      return;
                    }
                    handleToggleWatchLater();
                  }}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    isInWatchLater
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-amber-500 hover:to-orange-500 text-white"
                  }`}
                >
                  <FaClock />
                  <span>{isInWatchLater ? "Đã thêm" : "Xem sau"}</span>
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: movieDetail.data.title,
                        text: `Xem phim ${movieDetail.data.title}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link đã được sao chép vào clipboard");
                    }
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <FaShare />
                  <span>Chia sẻ</span>
                </button>
                {isScheduled ? (
                  <span className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 text-gray-300 px-4 py-2.5 rounded-lg font-medium">
                    <FaCalendarAlt />
                    <span>Đã lên lịch</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("Vui lòng đăng nhập để tạo lịch xem");
                        return;
                      }
                      setShowScheduleForm(true);
                    }}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <FaCalendarAlt />
                    <span>Lên lịch xem</span>
                  </button>
                )}
              </div>

              <ReviewSection movieId={id} />

              <div className="flex flex-row flex-wrap mt-8 gap-3">
                {episodeLinks.length > 0
                  ? episodeLinks.map((link, idx) => (
                      <div key={idx} className="">
                        <Link
                          to={`/movie/${id}/episode/${idx}`}
                          className="inline-block text-white bg-gradient-to-r from-slate-600 to-slate-700 hover:from-blue-600 hover:to-blue-700 py-3 px-6 rounded-lg text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
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

      <div className=" mx-12 mt-40">
        <HorizontalMovies
          title="Phim liên quan"
          movies={relatedMovies}
          to="/allmovies"
          onMovieClick={handleMovieClick}
          categoryId={null}
        />
      </div>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-2xl w-full max-w-md relative border border-slate-600">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
              onClick={() => setShowScheduleForm(false)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <h3 className="text-xl text-white font-semibold mb-6 pr-8">
              Lên lịch xem phim
            </h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Thời gian xem:
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Ghi chú (tùy chọn):
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows="3"
                  placeholder="Ghi chú cho lịch xem..."
                />
              </div>
              <div>
                <label className="flex items-center text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleReminder}
                    onChange={(e) => setScheduleReminder(e.target.checked)}
                    className="mr-3 w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="font-medium">Nhắc nhở trước 30 phút</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg mt-6"
              >
                Tạo lịch xem
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailMovie;
