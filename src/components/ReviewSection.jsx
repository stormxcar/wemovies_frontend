import React, { useEffect, useState, useCallback, useMemo } from "react";
import { fetchJson } from "../services/api";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { toast } from "@toast";
import { useTranslation } from "react-i18next";

const ReviewSection = ({ movieId }) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingToReviewId, setReplyingToReviewId] = useState(null);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState({});

  const fetchReviews = useCallback(async () => {
    try {
      const reviewsData = await fetchJson(`/api/reviews/${movieId}/reviews`);
      const rawReviews = reviewsData?.data || reviewsData || [];
      setReviews(Array.isArray(rawReviews) ? rawReviews : []);
    } catch (error) {
      setReviews([]);
    }

    try {
      const ratingData = await fetchJson(
        `/api/reviews/${movieId}/average-rating`,
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
      toast.error(t("review.toasts.login_required"));
      return;
    }
    if (userRating === 0) {
      toast.error(t("review.toasts.rating_required"));
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
      toast.success(t("review.toasts.submit_success"));
      setShowReviewForm(false);
      setUserRating(0);
      setUserComment("");
      fetchReviews();
    } catch (error) {
      // Hiển thị lỗi chi tiết hơn
      if (error.response?.status === 500) {
        toast.error(t("review.toasts.server_error"));
      } else if (error.response?.status === 403) {
        toast.error(t("review.toasts.forbidden"));
      } else if (error.response?.status === 401) {
        toast.error(t("review.toasts.unauthorized"));
      } else {
        toast.error(t("review.toasts.submit_error"));
      }
    }
  };

  const getRepliesForReview = useCallback(
    (review) => {
      if (Array.isArray(review?.replies) && review.replies.length > 0) {
        return review.replies;
      }

      const parentId = review?.id;
      if (!parentId) {
        return [];
      }

      return reviews.filter((candidate) => {
        const candidateParentId =
          candidate?.parentReview?.id || candidate?.parentReviewId;
        return candidateParentId === parentId;
      });
    },
    [reviews],
  );

  const handleReplySubmit = async (review) => {
    if (!isAuthenticated) {
      toast.error(t("review.toasts.login_required"));
      return;
    }

    const reviewId = review?.id;
    const comment = replyDrafts[reviewId]?.trim();

    if (!reviewId || !comment) {
      toast.error(t("review.replies.comment_required"));
      return;
    }

    try {
      await fetchJson(
        `/api/reviews/${encodeURIComponent(reviewId)}/reply?comment=${encodeURIComponent(comment)}`,
        {
          method: "POST",
        },
      );

      toast.success(t("review.toasts.submit_success"));
      setReplyDrafts((prev) => ({
        ...prev,
        [reviewId]: "",
      }));
      setReplyingToReviewId(null);
      await fetchReviews();
    } catch (error) {
      if (
        error?.response?.status === 400 &&
        String(error?.response?.data?.message || "").includes(
          "Only one-level reply is supported",
        )
      ) {
        toast.error(t("review.replies.one_level_only"));
      } else {
        toast.error(t("review.toasts.submit_error"));
      }
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const topLevelReviews = useMemo(
    () =>
      reviews.filter(
        (review) => !review?.parentReview && !review?.parentReviewId,
      ),
    [reviews],
  );

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
              : t("review.no_rating")}
          </span>
          <span className="text-gray-400">
            {t("review.count", { count: reviews.length })}
          </span>
        </div>
      </div>

      {/* Review Button */}
      <div className="flex items-center space-x-4 mt-6 mb-6">
        <button
          onClick={() => setShowReviewForm(true)}
          className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
        >
          <FaStar />
          <span>{t("review.cta")}</span>
        </button>
      </div>

      {/* Reviews Section */}
      {topLevelReviews.length > 0 && (
        <div className="my-8">
          <h3 className="text-xl font-bold text-white mb-4">
            {t("review.user_reviews")}
          </h3>
          <div className="space-y-4">
            {topLevelReviews.slice(0, 3).map((review, index) => (
              <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-white font-semibold">
                    {review.user?.fullName || t("review.user_fallback")}
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
                    i18n.language === "vi" ? "vi-VN" : "en-US",
                  )}
                </p>

                <div className="mt-3 border-t border-gray-600/60 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setReplyingToReviewId((prev) =>
                        prev === review.id ? null : review.id,
                      )
                    }
                    className="text-sm text-yellow-300 hover:text-yellow-200"
                  >
                    {t("review.replies.reply_action")}
                  </button>

                  {replyingToReviewId === review.id && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={replyDrafts[review.id] || ""}
                        onChange={(event) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [review.id]: event.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        rows="2"
                        placeholder={t("review.replies.placeholder")}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleReplySubmit(review)}
                          className="bg-yellow-500 text-black px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors"
                        >
                          {t("review.replies.submit")}
                        </button>
                      </div>
                    </div>
                  )}

                  {getRepliesForReview(review).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {getRepliesForReview(review)
                        .slice(0, visibleRepliesCount[review.id] || 1)
                        .map((reply) => (
                          <div
                            key={reply.id}
                            className="ml-3 pl-3 border-l-2 border-yellow-400/50"
                          >
                            <p className="text-sm text-gray-200">
                              <span className="font-medium text-white">
                                {reply.user?.fullName ||
                                  t("review.user_fallback")}
                              </span>
                              {": "}
                              {reply.comment}
                            </p>
                          </div>
                        ))}

                      {(visibleRepliesCount[review.id] || 1) <
                        getRepliesForReview(review).length && (
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleRepliesCount((prev) => ({
                              ...prev,
                              [review.id]: getRepliesForReview(review).length,
                            }))
                          }
                          className="ml-3 text-xs text-orange-300 hover:text-orange-200"
                        >
                          {t("review.replies.show_more", {
                            count:
                              getRepliesForReview(review).length -
                              (visibleRepliesCount[review.id] || 1),
                          })}
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
              {t("review.modal.title")}
            </h3>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-white mb-2">
                  {t("review.modal.rating")}
                </label>
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
                  {t("review.modal.comment_optional")}
                </label>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows="3"
                  placeholder={t("review.modal.comment_placeholder")}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors"
              >
                {t("review.modal.submit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
