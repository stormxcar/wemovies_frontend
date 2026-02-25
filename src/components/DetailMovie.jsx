import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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

const DetailMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { setLoading, isLoading } = useLoading();
  const [movieDetail, setMovieDetail] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isInWatchLater, setIsInWatchLater] = useState(false);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleReminder, setScheduleReminder] = useState(true);

  // Initialize watching tracker
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
          toast.success("Đã thêm vào danh sách xem sau!");
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
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Xem phim
              </Link>
              {movieDetail.data.trailer && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Trailer
                </button>
              )}
            </div>

            {/* Right group - Like, Watch Later, Share buttons */}
            <div className="flex items-center space-x-4">
              <WatchlistButton movieId={movieDetail.data.id} size="large" />
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
                    return;
                  }
                  handleToggleWatchLater();
                }}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  isInWatchLater
                    ? "bg-purple-600 text-white"
                    : "bg-purple-500 text-white hover:bg-purple-600"
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
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
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

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 mt-6 mb-6">
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
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isInWatchLater
                      ? "bg-purple-600 text-white"
                      : "bg-purple-500 text-white hover:bg-purple-600"
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
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaShare />
                  <span>Chia sẻ</span>
                </button>
                {isScheduled ? (
                  <span className="flex items-center space-x-2 bg-gray-600 text-gray-400 px-4 py-2 rounded-lg">
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
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FaCalendarAlt />
                    <span>Lên lịch xem</span>
                  </button>
                )}
              </div>

              <ReviewSection movieId={id} />

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
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300"
              onClick={() => setShowScheduleForm(false)}
            >
              ✕
            </button>
            <h3 className="text-xl text-white font-semibold mb-4">
              Lên lịch xem phim
            </h3>
            <form onSubmit={handleCreateSchedule}>
              <div className="mb-4">
                <label className="block text-white mb-2">Thời gian xem:</label>
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2">
                  Ghi chú (tùy chọn):
                </label>
                <textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows="2"
                  placeholder="Ghi chú cho lịch xem..."
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={scheduleReminder}
                    onChange={(e) => setScheduleReminder(e.target.checked)}
                    className="mr-2"
                  />
                  Nhắc nhở trước 30 phút
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
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
