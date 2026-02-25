import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import CardMovie from "./CardMovie";

function HorizontalMovies({
  title,
  movies = [],
  to,
  categoryId,
  onMovieClick,
}) {
  const navigate = useNavigate();
  const { themeClasses } = useTheme();
  const validMovies = Array.isArray(movies) ? movies : [];

  const handleClickToDetail = (movieId) => {
    if (onMovieClick) {
      onMovieClick(movieId);
    } else {
      navigate(`/movie/${movieId}`);
    }
  };

  const handleSeeAllMovies = () => {
    if (to) {
      navigate(to, {
        state: {
          category: title,
          movies: validMovies,
          categoryId: categoryId || null,
        },
      });
    }
  };

  if (validMovies.length === 0) {
    return null; // Don't show anything if no movies, let parent handle loading state
  }

  return (
    <div className=" py-5 mx-2 sm:mx-4 md:mx-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        {to && (
          <button
            onClick={handleSeeAllMovies}
            className={`${themeClasses.textPrimary} hover:${themeClasses.tertiary} rounded px-3 py-2 flex items-center text-sm sm:text-base transition-colors`}
          >
            Xem tất cả
            <FaChevronRight className="inline ml-2" />
          </button>
        )}
      </div>

      <div className="relative overflow-visible">
        <div
          className="relative"
          style={{ width: "100%", maxWidth: "1400px", margin: "0 auto" }}
        >
          <div className="relative">
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10 -ml-2 sm:-ml-4">
              <button
                className={`review-swiper-button-prev ${themeClasses.textPrimary} ${themeClasses.card} rounded-full p-1.5 sm:p-2 shadow-lg hover:${themeClasses.tertiary} transition-colors`}
              >
                <FaChevronLeft size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10 -mr-2 sm:-mr-4">
              <button
                className={`review-swiper-button-next ${themeClasses.textPrimary} ${themeClasses.card} rounded-full p-1.5 sm:p-2 shadow-lg hover:${themeClasses.tertiary} transition-colors`}
              >
                <FaChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={15}
              slidesPerView={2}
              navigation={{
                nextEl: ".review-swiper-button-prev",
                prevEl: ".review-swiper-button-next",
              }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                320: { slidesPerView: 2, spaceBetween: 10 },
                480: { slidesPerView: 2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 15 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 20 },
                1280: { slidesPerView: 5, spaceBetween: 20 },
                1536: { slidesPerView: 6, spaceBetween: 20 },
              }}
              className="p-2 sm:p-4 overflow-visible"
            >
              {validMovies.map(
                ({ id, thumb_url, title, release_year, movieTypes }) => (
                  <SwiperSlide key={id} onClick={() => handleClickToDetail(id)}>
                    <CardMovie
                      movie={{
                        id,
                        thumb_url,
                        title,
                        release_year,
                        movieTypes,
                      }}
                      onMovieClick={onMovieClick}
                    />
                  </SwiperSlide>
                ),
              )}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorizontalMovies;
