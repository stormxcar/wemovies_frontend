import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchJson } from "../../../services/api";

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
        const response = await fetchJson(`/api/movies/detail/${id}`);
        setMovie(response.data);
      } catch (err) {
        console.error("Error fetching movie detail:", err);
        setError("Không thể tải thông tin phim. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovieDetail();
  }, [id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!movie) return <div className="p-6">Phim không tồn tại</div>;

  // Custom labels for fields (optional, for better readability)
  const fieldLabels = {
    id: "ID",
    title: "Tiêu đề",
    titleByLanguage: "Tiêu đề (ngôn ngữ khác)",
    thumb_url: "Ảnh thumbnail",
    status: "Trạng thái",
    director: "Đạo diễn",
    duration: "Thời lượng (phút)",
    trailer: "Link Trailer",
    quality: "Chất lượng",
    vietSub: "Phụ đề tiếng Việt",
    views: "Lượt xem",
    hot: "Nổi bật",
    totalEpisodes: "Tổng số tập",
    episodeLinks: "Link tập phim",
    description: "Mô tả",
    release_year: "Năm phát hành",
    link: "Link phim",
    country: "Quốc gia",
    movieTypes: "Loại phim",
    movieCategories: "Danh mục phim",
    actors: "Diễn viên",
    embedLink: "Video trailer",
  };

  // Format values for display (handles arrays, objects, booleans, etc.)
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return "Không có thông tin";
    if (typeof value === "boolean") return value ? "Có" : "Không";
    if (Array.isArray(value)) {
      if (key === "actors") return value.join(", ");
      if (key === "movieTypes" || key === "movieCategories") {
        return value.map((item) => item.name).join(", ");
      }
      return value.join(", ");
    }
    if (typeof value === "object") {
      if (key === "country") return value.name;
      return JSON.stringify(value);
    }
    return value;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{movie.title}</h1>
      <div className="bg-white p-4 rounded shadow">
        {Object.entries(movie).map(([key, value]) => (
          <p key={key} className="mb-2">
            <strong>
              {fieldLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)}:
            </strong>{" "}
            {key === "description" ? (
              <span dangerouslySetInnerHTML={{ __html: value }} />
            ) : key === "episodeLinks" && typeof value === "string" ? (
              value.split(",").map((link, index) => (
                <div key={index}>
                  <a
                    href={link.trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {`Link tập ${index + 1}`}
                  </a>
                </div>
              ))
            ) : key === "embedLink" ? (
              <iframe
                width="560"
                height="315"
                src={value}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : key === "thumb_url" ? (
              <img src={value} alt={movie.title} className="h-32 w-auto" />
            ) : (
              formatValue(key, value)
            )}
          </p>
        ))}

        <button
          onClick={() => window.history.back()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default MovieDetail;
