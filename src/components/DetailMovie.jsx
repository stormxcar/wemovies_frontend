import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import HorizontalMovies from "./HorizontalMovies";
import { fetchJson } from "../services/api";
import { ClipLoader } from "react-spinners";
import {
  FaChevronRight,
  FaHeart,
  FaShare,
  FaClock,
  FaStar,
  FaCalendarAlt,
} from "react-icons/fa";
import WatchlistButton from "./WatchlistButton";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { useLoading } from "../utils/LoadingContext";
import { trackMovieView, trackUserAction } from "../services/analytics";

const DetailMovie = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { setLoading, isLoading } = useLoading();
  const [movieDetail, setMovieDetail] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleReminder, setScheduleReminder] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);

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

  const fetchReviews = useCallback(async () => {
    try {
      const reviewsData = await fetchJson(`/api/reviews/${id}/reviews`);
      const ratingData = await fetchJson(`/api/reviews/${id}/average-rating`);
      setReviews(reviewsData || []);
      setAverageRating(ratingData || 0);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }, [id]);

  const checkScheduleStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const scheduled = await fetchJson(`/api/schedules/check/${id}`);
      setIsScheduled(scheduled);
    } catch (error) {
      console.error("Error checking schedule status:", error);
    }
  }, [id, isAuthenticated]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }
    if (userRating === 0) {
      toast.error("Vui lòng chọn số sao");
      return;
    }

    try {
      const url = `/api/reviews/${id}/review?rating=${userRating}${
        userComment ? `&comment=${encodeURIComponent(userComment)}` : ""
      }`;
      await fetchJson(url, {
        method: "POST",
      });
      toast.success("Đánh giá thành công!");
      setShowReviewForm(false);
      setUserRating(0);
      setUserComment("");
      fetchReviews();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đánh giá");
    }
  };

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
          fetchRelatedMovies(data.data.movieCategories[0].id);
        }
      } catch (e) {
        setMovieDetail(null);
      } finally {
        setLoading("movieDetail", false);
      }
    };
    fetchMovieDetail();
    fetchReviews();
    checkScheduleStatus();
  }, [id, fetchRelatedMovies, fetchReviews, checkScheduleStatus, setLoading]);

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

              {/* Rating Display */}
              <div className="my-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`text-lg ${
                          star <= Math.round(averageRating)
                            ? "text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white">
                    {averageRating > 0
                      ? `${averageRating.toFixed(1)}/5`
                      : "Chưa có đánh giá"}
                  </span>
                  <span className="text-gray-400">
                    ({reviews.length} đánh giá)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 mt-6 mb-6">
                <WatchlistButton movieId={movieDetail.data.id} size="medium" />
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
                      alert("Link đã được sao chép vào clipboard");
                    }
                  }}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaShare />
                  <span>Chia sẻ</span>
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowScheduleForm(true)}
                    disabled={isScheduled}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isScheduled
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    <FaCalendarAlt />
                    <span>{isScheduled ? "Đã lên lịch" : "Lên lịch xem"}</span>
                  </button>
                )}
                {isAuthenticated && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="flex items-center space-x-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <FaStar />
                    <span>Đánh giá</span>
                  </button>
                )}
              </div>

              {/* Reviews Section */}
              {reviews.length > 0 && (
                <div className="my-8">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Đánh giá từ người dùng
                  </h3>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review, index) => (
                      <div
                        key={index}
                        className="bg-gray-700/50 p-4 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-white font-semibold">
                            {review.user?.fullName || "Người dùng"}
                          </span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                className={`text-sm ${
                                  star <= review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-300">{review.comment}</p>
                        )}
                        <p className="text-gray-500 text-sm mt-2">
                          {new Date(review.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300"
              onClick={() => setShowReviewForm(false)}
            >
              ✕
            </button>
            <h3 className="text-xl text-white font-semibold mb-4">
              Đánh giá phim
            </h3>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-white mb-2">Số sao:</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="text-2xl"
                    >
                      <FaStar
                        className={
                          star <= userRating
                            ? "text-yellow-400"
                            : "text-gray-600"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2">
                  Bình luận (tùy chọn):
                </label>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows="3"
                  placeholder="Viết bình luận của bạn..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors"
              >
                Gửi đánh giá
              </button>
            </form>
          </div>
        </div>
      )}

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
