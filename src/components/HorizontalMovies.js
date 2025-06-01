import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import CardMovie from "./CardMovie";
import SkeletonWrapper from "./SkeletonWrapper";

function HorizontalMovies({
  title,
  movies = [],
  to,
  categoryId,
  onMovieClick,
}) {
  const navigate = useNavigate();
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
    return (
      <div className="my-6 py-5">
        <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
        <div className="flex items-center justify-center h-80 text-white">
          No movies available
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 py-5 mx-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
        {to && (
          <button
            onClick={handleSeeAllMovies}
            className="text-white hover:bg-blue-700 rounded px-4 py-2 flex items-center"
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
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10">
              <button className="review-swiper-button-prev text-black bg-white rounded-full p-2">
                <FaChevronLeft size={20} />
              </button>
            </div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10">
              <button className="review-swiper-button-next text-black bg-white rounded-full p-2">
                <FaChevronRight size={20} />
              </button>
            </div>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={4}
              navigation={{
                nextEl: ".review-swiper-button-prev",
                prevEl: ".review-swiper-button-next",
              }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                1024: { slidesPerView: 4 },
                768: { slidesPerView: 3 },
                480: { slidesPerView: 2 },
                350: { slidesPerView: 2 },
              }}
              className="p-4 overflow-visible"
            >
              {validMovies.length === 0
                ? Array(4)
                    .fill()
                    .map((_, index) => (
                      <SwiperSlide key={index}>
                        <SkeletonWrapper
                          loading={true}
                          height={320}
                          width={180}
                        >
                          <div className="w-45 h-80 rounded-lg skeleton-animation" />
                        </SkeletonWrapper>
                      </SwiperSlide>
                    ))
                : validMovies.map(
                    ({ id, thumb_url, title, release_year, movieTypes }) => (
                      <SwiperSlide
                        key={id}
                        onClick={() => handleClickToDetail(id)}
                      >
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
                    )
                  )}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HorizontalMovies;
