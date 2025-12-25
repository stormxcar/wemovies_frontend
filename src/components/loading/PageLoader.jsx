import React from "react";
import { FaFilm, FaPlay } from "react-icons/fa";

const PageLoader = ({ isVisible = true, message = "Đang tải..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,69,19,0.3)_0%,transparent_50%)]"></div>
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-green-400 rounded-full animate-pulse delay-1000"></div>
      </div>

      {/* Main loader content */}
      <div className="relative flex flex-col items-center space-y-8">
        {/* Movie reel animation */}
        <div className="relative">
          {/* Main film reel */}
          <div className="w-24 h-24 border-4 border-yellow-500 rounded-full relative animate-spin-slow">
            {/* Spokes */}
            <div className="absolute inset-2 border-2 border-yellow-400 rounded-full">
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-yellow-400 transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 h-0.5 w-full bg-yellow-400 transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-0.5 h-full bg-yellow-400 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-0.5 h-full bg-yellow-400 transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
            </div>
            {/* Center hub */}
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-yellow-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <FaPlay className="text-black text-xs" />
            </div>
            {/* Film holes around the edge */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gray-800 rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) rotate(${
                    i * 45
                  }deg) translateY(-40px)`,
                }}
              />
            ))}
          </div>

          {/* Film strip animation */}
          <div className="absolute -top-2 -left-16 w-32 h-6 bg-gradient-to-r from-transparent via-yellow-600 to-transparent rounded animate-slide-right opacity-70">
            <div className="flex h-full items-center justify-center space-x-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-1 h-3 bg-gray-800 rounded-sm" />
              ))}
            </div>
          </div>

          {/* Second film strip */}
          <div className="absolute -bottom-2 -right-16 w-32 h-6 bg-gradient-to-r from-transparent via-yellow-600 to-transparent rounded animate-slide-left opacity-70 delay-500">
            <div className="flex h-full items-center justify-center space-x-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-1 h-3 bg-gray-800 rounded-sm" />
              ))}
            </div>
          </div>
        </div>

        {/* Floating film icons */}
        <div className="absolute inset-0 pointer-events-none">
          <FaFilm className="absolute top-20 left-20 text-yellow-400 text-2xl animate-float opacity-60" />
          <FaFilm className="absolute top-32 right-16 text-blue-400 text-xl animate-float-delayed opacity-50" />
          <FaFilm className="absolute bottom-28 left-16 text-red-400 text-lg animate-float-delayed-2 opacity-40" />
          <FaFilm className="absolute bottom-20 right-20 text-green-400 text-xl animate-float opacity-50" />
        </div>

        {/* Loading text with typewriter effect */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-yellow-400 animate-pulse">
            WeMovies
          </h2>
          <p className="text-white text-lg tracking-wider animate-typewriter overflow-hidden whitespace-nowrap border-r-2 border-yellow-400">
            {message}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full animate-progress-bar"></div>
        </div>

        {/* Movie genres floating around */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute top-10 left-32 text-yellow-300 text-sm animate-float opacity-70">
            Action
          </span>
          <span className="absolute top-16 right-24 text-blue-300 text-sm animate-float-delayed opacity-60">
            Drama
          </span>
          <span className="absolute bottom-24 left-24 text-red-300 text-sm animate-float-delayed-2 opacity-50">
            Comedy
          </span>
          <span className="absolute bottom-16 right-32 text-green-300 text-sm animate-float opacity-60">
            Thriller
          </span>
          <span className="absolute top-1/2 left-8 text-purple-300 text-sm animate-float-delayed opacity-50">
            Sci-Fi
          </span>
          <span className="absolute top-1/2 right-8 text-pink-300 text-sm animate-float-delayed-2 opacity-40">
            Romance
          </span>
        </div>
      </div>

      {/* Cinema-style corners */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-yellow-500 rounded-tl-lg opacity-50"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-yellow-500 rounded-tr-lg opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-yellow-500 rounded-bl-lg opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-yellow-500 rounded-br-lg opacity-50"></div>
    </div>
  );
};

export default PageLoader;
