import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { fetchMovies } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import SkeletonWrapper from "./SkeletonWrapper";
import { FaPlay } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useGlobalLoading } from "../context/UnifiedLoadingContext";

// Import Swiper styles
import "swiper/css";
import "swiper/css/scrollbar";

// import required modules
import { Scrollbar } from "swiper/modules";

function Banner({ onDataLoaded }) {
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const { setComponentsLoaded, updateProgress } = useGlobalLoading();
  const { themeClasses } = useTheme();
  const { t } = useTranslation();

  console.log("🎬 Banner component mounted with onDataLoaded:", !!onDataLoaded);

  useEffect(() => {
    console.log("🎬 Banner: Starting fetch...");
    setLoading(true);

    // Update global progress for banner loading
    updateProgress(85, "Đang tải banner...");

    fetchMovies()
      .then((movies) => {
        console.log("🎬 Banner: Movies fetched:", movies?.length || 0);
        const shuffled = movies.sort(() => 0.5 - Math.random());
        setMovies(shuffled.slice(0, 5));

        // Mark banner as loaded
        setComponentsLoaded((prev) => ({ ...prev, banner: true }));

        console.log("✅ Banner: Data loaded, notifying parent...");

        // Notify parent that banner data is ready
        if (onDataLoaded) {
          onDataLoaded(true);
        }
      })
      .catch((error) => {
        console.error("❌ Banner error:", error);
        // Even on error, mark as loaded to prevent infinite loading
        if (onDataLoaded) {
          onDataLoaded(false);
        }
      })
      .finally(() => {
        console.log("🎬 Banner: Loading finished");
        setLoading(false);
      });
  }, []); // FIXED: Empty dependency array to prevent infinite re-renders

  return (
    <div
      className={`relative w-full h-[90vh] overflow-hidden flex-1 ${themeClasses.primary}`}
    >
      {movies.length > 0 && (
        <Swiper
          scrollbar={{
            hide: true,
            draggable: true,
            snapOnRelease: true,
            autoFocus: true,
          }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          speed={800}
          allowTouchMove={true}
          modules={[Scrollbar]}
          className="mySwiper overflow-hidden"
        >
          {movies.map((movie, index) => (
            <SwiperSlide key={index} className="w-full h-full relative">
              <div
                className="w-full h-full inset-0 z-[9999] ml-20"
                style={{
                  backgroundImage: `url(${movie.banner_url})`,
                  backgroundSize: "cover", // Zoom out để ảnh nhỏ hơn
                  backgroundPosition: "center 2px", // Di chuyển ảnh xuống dưới 100px từ top
                  backgroundRepeat: "no-repeat",
                  height: "100vh",
                  objectFit: "cover",
                }}
              >
                <SkeletonWrapper loading={loading} height="100%" width="100%">
                  <div className="w-full h-full skeleton-animation" />
                </SkeletonWrapper>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/100 via-black/80 via-40% to-transparent z-10"></div>
              <div className="absolute top-80 left-12 text-left text-white z-30 max-w-2xl px-4">
                <SkeletonWrapper loading={loading} height={40}>
                  <h1 className="text-4xl font-bold">{movie.title}</h1>
                </SkeletonWrapper>
                <SkeletonWrapper loading={loading} height={20}>
                  <p
                    className="mt-2 text-lg"
                    dangerouslySetInnerHTML={{
                      __html:
                        movie.description.length > 150
                          ? movie.description.slice(0, 150) + "..."
                          : movie.description,
                    }}
                  ></p>
                </SkeletonWrapper>
                <div>
                  <SkeletonWrapper loading={loading} height={60}>
                    <Link
                      className="mt-8 bg-yellow-700/50 hover:bg-yellow-600 px-4 py-2 rounded-full text-lg flex items-center gap-2 cursor-pointer"
                      to={`/movie/${movie.id}`}
                      style={{ display: "inline-flex", width: "auto" }}
                    >
                      <span className="bg-yellow-500 rounded-full flex items-center justify-center w-[60px] h-[60px]">
                        <FaPlay size={30} className="text-black" />
                      </span>
                      <span className="font-semibold text-xl">
                        {t("movie.watch_now")}
                      </span>
                    </Link>
                  </SkeletonWrapper>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      {movies.length === 0 && (
        <div className="w-full h-full flex items-center justify-center">
          <SkeletonWrapper loading={true} height="100%" width="100%">
            <div className="w-full h-full rounded-lg skeleton-animation" />
          </SkeletonWrapper>
        </div>
      )}
    </div>
  );
}

export default Banner;
