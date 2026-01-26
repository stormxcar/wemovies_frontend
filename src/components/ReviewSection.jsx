import React, { useEffect, useState, useCallback } from "react";
import { fetchJson } from "../services/api";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const ReviewSection = ({ movieId }) => {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const reviewsData = await fetchJson(`/api/reviews/${movieId}/reviews`);
      setReviews(reviewsData?.data || reviewsData || []);
    } catch (error) {
      setReviews([]);
    }

    try {
      const ratingData = await fetchJson(
        `/api/reviews/${movieId}/average-rating`
      );
      // Handle case where backend returns no data or empty response
      setAverageRating(ratingData?.data ?? ratingData ?? 0);
    } catch (error) {
      setAverageRating(0);
    }
  }, [movieId]);

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
      // Log data trước khi gửi
      // Gửi như form data hoặc query parameters
      const formData = new FormData();
      formData.append("rating", userRating.toString());
      if (userComment && userComment.trim()) {
        formData.append("comment", userComment.trim());
      }
      await fetchJson(`/api/reviews/${movieId}/review`, {
        method: "POST",
        body: formData, // Form data sẽ được gửi như multipart/form-data
      });
      toast.success("Đánh giá thành công!");
      setShowReviewForm(false);
      setUserRating(0);
      setUserComment("");
      fetchReviews();
    } catch (error) {
      // Hiển thị lỗi chi tiết hơn
      if (error.response?.status === 500) {
        toast.error("Lỗi server nội bộ - kiểm tra backend logs");
      } else if (error.response?.status === 403) {
        toast.error("Không có quyền - kiểm tra user role");
      } else if (error.response?.status === 401) {
        toast.error("Chưa đăng nhập");
      } else {
        toast.error("Có lỗi xảy ra khi đánh giá");
      }
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <div>
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
          <span className="text-gray-400">({reviews.length} đánh giá)</span>
        </div>
      </div>

      {/* Review Button */}
      <div className="flex items-center space-x-4 mt-6 mb-6">
        <button
          onClick={() => setShowReviewForm(true)}
          className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          <FaStar />
          <span>Đánh giá</span>
        </button>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="my-8">
          <h3 className="text-xl font-bold text-white mb-4">
            Đánh giá từ người dùng
          </h3>
          <div className="space-y-4">
            {reviews.slice(0, 3).map((review, index) => (
              <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
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
                  {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
};

export default ReviewSection;
