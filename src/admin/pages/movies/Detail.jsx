import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchJson } from "../../../services/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Film,
  Globe,
  Star,
  Users,
  Tag,
  Tv,
  Play,
  Image,
  Info,
  MapPin,
} from "lucide-react";

const MovieDetail = () => {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchJson(`/api/movies/${id}`);
        setMovie(response.data);
      } catch (err) {
        setError("Không thể tải thông tin phim. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovieDetail();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "Không có thông tin";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatBoolean = (value) => {
    if (value === null || value === undefined) return "Không có thông tin";
    return value ? "Có" : "Không";
  };

  const formatArray = (arr, field = "name") => {
    if (!arr || arr.length === 0) return "Không có thông tin";
    return arr.map((item) => item[field] || item).join(", ");
  };

  const getAgeRatingColor = (rating) => {
    const colors = {
      P: "bg-green-100 text-green-800",
      T7: "bg-blue-100 text-blue-800",
      T13: "bg-yellow-100 text-yellow-800",
      T16: "bg-orange-100 text-orange-800",
      T18: "bg-red-100 text-red-800",
    };
    return colors[rating] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      full: "bg-green-100 text-green-800",
      ongoing: "bg-blue-100 text-blue-800",
      upcoming: "bg-yellow-100 text-yellow-800",
    };
    return colors[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getQualityColor = (quality) => {
    const colors = {
      "4K": "bg-purple-100 text-purple-800",
      FULL_HD: "bg-blue-100 text-blue-800",
      HD: "bg-green-100 text-green-800",
      SD: "bg-gray-100 text-gray-800",
    };
    return colors[quality] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold">{error}</div>
          <button
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-gray-600 text-lg">Phim không tồn tại</div>
          <button
            onClick={() => window.history.back()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{movie.title}</h1>
        {movie.hot && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <Star className="h-4 w-4" />
            Nổi bật
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-1 space-y-6">
          {/* Thumbnail */}
          {movie.thumb_url && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Ảnh bìa
                </h3>
              </div>
              <div className="p-4">
                <img
                  src={movie.thumb_url}
                  alt={movie.title}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Banner */}
          {movie.banner_url && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  Ảnh banner
                </h3>
              </div>
              <div className="p-4">
                <img
                  src={movie.banner_url}
                  alt={`${movie.title} Banner`}
                  className="w-full h-auto rounded-lg shadow-sm"
                />
              </div>
            </div>
          )}

          {/* System Info */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Thông tin hệ thống
              </h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {movie.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="text-gray-900">
                  {formatDate(movie.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày cập nhật:</span>
                <span className="text-gray-900">
                  {formatDate(movie.updatedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trạng thái:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    movie.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {formatBoolean(movie.isActive)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Movie Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Thông tin cơ bản
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tiêu đề gốc
                    </label>
                    <p className="text-gray-900">
                      {movie.titleByLanguage || "Không có thông tin"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Slug
                    </label>
                    <p className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                      {movie.slug || "Không có thông tin"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Đạo diễn
                    </label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      {movie.director || "Không có thông tin"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Quốc gia
                    </label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {movie.country?.name || "Không có thông tin"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Trạng thái phim
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        movie.status
                      )}`}
                    >
                      <Tv className="h-4 w-4" />
                      {movie.status || "Không có thông tin"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Năm phát hành
                    </label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {movie.release_year || "Không có thông tin"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Thời lượng
                    </label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      {movie.duration
                        ? `${movie.duration} phút`
                        : "Không có thông tin"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Lượt xem
                    </label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      {movie.views?.toLocaleString("vi-VN") || "0"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Thông tin kỹ thuật
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="mb-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(
                        movie.quality
                      )}`}
                    >
                      {movie.quality || "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Chất lượng</p>
                </div>
                <div className="text-center">
                  <div className="mb-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        movie.vietSub
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {formatBoolean(movie.vietSub)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Phụ đề VN</p>
                </div>
                <div className="text-center">
                  <div className="mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {movie.totalEpisodes || "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Tổng tập</p>
                </div>
                <div className="text-center">
                  <div className="mb-2">
                    {movie.ageRating ? (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAgeRatingColor(
                          movie.ageRating
                        )}`}
                      >
                        {movie.ageRating}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        N/A
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">Độ tuổi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories and Types */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Phân loại
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Loại phim
                </label>
                <div className="flex flex-wrap gap-2">
                  {movie.movieTypes?.map((type, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {type.name}
                    </span>
                  )) || (
                    <span className="text-gray-500">Không có thông tin</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Danh mục
                </label>
                <div className="flex flex-wrap gap-2">
                  {movie.movieCategories?.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {category.name}
                    </span>
                  )) || (
                    <span className="text-gray-500">Không có thông tin</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Diễn viên
                </label>
                <div className="flex flex-wrap gap-2">
                  {movie.actorsSet?.map((actor, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {actor}
                    </span>
                  )) || (
                    <span className="text-gray-500">Không có thông tin</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {movie.description && (
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Mô tả</h3>
              </div>
              <div className="p-6">
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: movie.description }}
                />
              </div>
            </div>
          )}

          {/* Links */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Play className="h-5 w-5" />
                Liên kết
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {movie.link && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Link phim
                  </label>
                  <a
                    href={movie.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    Xem phim
                  </a>
                </div>
              )}
              {movie.trailer && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Trailer
                  </label>
                  <a
                    href={movie.trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    Xem trailer
                  </a>
                </div>
              )}
              {movie.episodes && movie.episodes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Các tập phim
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                    {movie.episodes.map((episode, index) => (
                      <a
                        key={index}
                        href={episode.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm text-center hover:bg-gray-200 transition-colors"
                      >
                        Tập {episode.episodeNumber}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
