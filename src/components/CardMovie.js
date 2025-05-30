import React, { useState } from "react";

function CardMovie({ movie }) {
  const [isHovered, setIsHovered] = useState(false);

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
          <img
            src={movie.thumb_url}
            alt={movie.title}
            className="rounded-lg w-full h-full object-cover"
            style={{ objectPosition: "top" }}
          />
          <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black to-transparent text-white text-center">
            <h3 className="text-lg">{movie.title}</h3>
            <h3 className="font-bold">{movie.release_year}</h3>
          </div>
        </div>

        {/* Expanded Overlay Card */}
        {isHovered && (
          <div
            className="absolute top-[-100px] left-1/3 transform -translate-x-1/2 w-[400px] h-[500px] bg-black/90 text-white rounded-lg shadow-lg transition-opacity duration-300 z-[99999] flex flex-col gap-0 overflow-visible pointer-events-auto"
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            <img
              src={movie.thumb_url}
              alt={movie.title}
              className="rounded-lg w-full h-[70%] object-cover"
              style={{ objectPosition: "top" }}
            />
            <div className="px-6 py-2 flex justify-end flex-col ">
              <h3 className="text-lg font-bold">{movie.title}</h3>
              <p>Release Year: {movie.release_year}</p>
              <button className="mt-2 bg-blue-500 text-white p-2 rounded">
                Watch Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardMovie;
