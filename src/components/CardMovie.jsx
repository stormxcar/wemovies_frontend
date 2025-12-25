import React, { useState, useEffect } from "react";
import SkeletonWrapper from "./SkeletonWrapper";
import WatchlistButton from "./WatchlistButton";

function CardMovie({ movie }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = movie.thumb_url;
    img.onload = () => setImageLoaded(true);
  }, [movie.thumb_url]);

  // console.log("====================================");
  // console.log("movie", movie);
  // console.log("====================================");

  return (
    <div className="relative rounded-lg w-45 h-80 cursor-pointer">
      <div
        className="relative w-full h-full overflow-visible"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Original Card (Scales on Hover) */}
        <div
          className="absolute w-full h-full transition-transform duration-300"
          style={{ transform: isHovered ? "scale(1)" : "scale(1)" }}
        >
          <SkeletonWrapper loading={!imageLoaded} height={320}>
            <img
              src={movie.thumb_url}
              alt={movie.title}
              className="rounded-lg w-full h-full object-cover"
              style={{ objectPosition: "top" }}
            />
          </SkeletonWrapper>
          <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black to-transparent text-white text-center">
            <SkeletonWrapper loading={!imageLoaded} height={20} width="80%">
              <h3 className="text-lg">{movie.title}</h3>
            </SkeletonWrapper>
            <SkeletonWrapper loading={!imageLoaded} height={20} width="40%">
              <h3 className="font-bold">{movie.release_year}</h3>
            </SkeletonWrapper>
          </div>

          {/* Watchlist Button - Always visible in top-right corner */}
          <div className="absolute top-2 right-2">
            <WatchlistButton movieId={movie.id} />
          </div>
        </div>

        {/* Expanded Overlay Card */}
        {isHovered && (
          <div
            className="absolute top-[-100px] left-1/3 transform -translate-x-1/2 w-[400px] h-[500px] text-white rounded-lg shadow-lg transition-opacity duration-300 z-[99999] flex flex-col gap-0 overflow-visible pointer-events-auto"
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            <SkeletonWrapper loading={!imageLoaded} height={350}>
              <img
                src={movie.thumb_url}
                alt={movie.title}
                className="rounded-lg w-full object-cover h-full"
                style={{
                  objectPosition: "top",
                  objectFit: "cover",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </SkeletonWrapper>
            <div className="absolute inset-0 bottom-0 left-0 bg-gradient-to-t from-black via-black/80 to-black/10"></div>
            <div className="absolute bottom-0 w-full">
              <div className="px-6 py-2 flex flex-col">
                <SkeletonWrapper loading={!imageLoaded} height={20} width="80%">
                  <h3 className="text-lg font-bold">{movie.title}</h3>
                </SkeletonWrapper>
                <SkeletonWrapper loading={!imageLoaded} height={20} width="60%">
                  <p>Năm phát hành: {movie.release_year}</p>
                </SkeletonWrapper>
                <div className="flex items-center justify-between space-x-2">
                  <SkeletonWrapper loading={!imageLoaded} height={40}>
                    <button className="mt-2 bg-blue-500 text-white p-2 rounded flex-1">
                      Xem ngay
                    </button>
                  </SkeletonWrapper>
                  <SkeletonWrapper loading={!imageLoaded} height={40}>
                    <button className="mt-2 bg-transparent text-white p-2 rounded flex-1 border-[1px] border-gray-500">
                      Chi tiết
                    </button>
                  </SkeletonWrapper>
                </div>
                <div className="my-3">
                  <ul className="flex items-center space-x-2">
                    <SkeletonWrapper loading={!imageLoaded} height={40}>
                      {movie.movieTypes.map((movieType) => (
                        <li className="text-white" key={movieType.id}>
                          {movieType.name}
                        </li>
                      ))}
                    </SkeletonWrapper>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardMovie;
