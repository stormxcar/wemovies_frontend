import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import SkeletonWrapper from "./SkeletonWrapper";
import WatchlistButton from "./WatchlistButton";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function CardMovie({ movie, onMovieClick }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const img = new Image();
    img.src = movie.thumb_url;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true); // vẫn set true để skeleton biến mất
  }, [movie.thumb_url]);

  return (
    <div
      className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
        isDarkMode
          ? "bg-black/40 backdrop-blur-sm border border-white/10 hover:shadow-2xl hover:shadow-black/60"
          : "bg-white border border-gray-200 hover:shadow-[0_16px_34px_rgba(15,23,42,0.16)]"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onMovieClick && onMovieClick(movie.id)}
    >
      {/* Poster chính */}
      <div className="relative aspect-[2/3] w-full">
        <SkeletonWrapper loading={!imageLoaded}>
          <img
            src={movie.thumb_url}
            alt={movie.title}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.target.src = "/placeholder-professional.svg";
              setImageLoaded(true);
            }}
          />
        </SkeletonWrapper>

        {/* Gradient bottom overlay cho title trên poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 pointer-events-none" />

        {/* Info trên poster (luôn hiển thị) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white z-10">
          <SkeletonWrapper loading={!imageLoaded} height={24} width="85%">
            <h3 className="font-bold text-base sm:text-lg md:text-xl line-clamp-2 drop-shadow-md">
              {movie.title}
            </h3>
          </SkeletonWrapper>
          <SkeletonWrapper loading={!imageLoaded} height={16} width="50%">
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              {movie.release_year}
            </p>
          </SkeletonWrapper>
        </div>
      </div>

      {/* Expanded Hover Overlay – slide up từ dưới */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col justify-end
          transition-all duration-500 ease-out
          ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
          z-20 p-4 sm:p-5
        `}
      >
        <div className="space-y-3">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white line-clamp-2 drop-shadow-lg">
            {movie.title}
          </h3>

          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-yellow-300 font-semibold px-2 py-1 bg-yellow-400/15 rounded-full border border-yellow-300/20">
              {movie.release_year}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {movie.movieTypes?.slice(0, 3).map((type) => (
                <span
                  key={type.id}
                  className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[11px] sm:text-xs border border-white/20 text-gray-100"
                >
                  {type.name}
                </span>
              ))}
              {movie.movieTypes?.length > 3 && (
                <span className="text-gray-300 text-[11px]">
                  +{movie.movieTypes.length - 3}
                </span>
              )}
            </div>
          </div>

          <div className=" pt-1">
            <Link
              to={`/movie/${movie.id}`}
              onClick={(event) => event.stopPropagation()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30 text-sm mb-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {t("movie.watch_now")}
            </Link>

            <div
              className="col-span-2 [&_button]:!py-2.5 [&_button]:!rounded-lg [&_button]:!text-sm [&_button]:!font-medium"
              onClick={(event) => event.stopPropagation()}
            >
              <WatchlistButton movieId={movie.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardMovie;
