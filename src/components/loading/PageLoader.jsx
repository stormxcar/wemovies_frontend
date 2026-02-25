import React from "react";
import { FaFilm, FaPlay } from "react-icons/fa";

const PageLoader = ({
  isVisible = true,
  message = "Đang chuẩn bị ...",
  progress = 0,
  showProgress = false,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-purple-950 overflow-hidden">
      {/* Background cinematic pattern + subtle film grain feel */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.25)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#111_25%,transparent_25%,transparent_75%,#111_75%)] bg-[length:60px_60px] opacity-30"></div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center space-y-10">
        {/* ====================== MOVIE REEL ====================== */}
        <div className="relative">
          {/* Large film reel */}
          <div className="w-40 h-40 border-8 border-yellow-400 rounded-full relative shadow-2xl shadow-yellow-500/50 animate-spin-slow">
            {/* Progress ring (visual only - no text) */}
            {showProgress && (
              <svg
                className="absolute inset-0 w-full h-full transform -rotate-90"
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 72}`}
                  strokeDashoffset={`${2 * Math.PI * 72 * (1 - progress / 100)}`}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
            )}

            {/* Spokes */}
            <div className="absolute inset-3 border-4 border-yellow-400/80 rounded-full">
              <div className="absolute top-0 left-1/2 w-1 h-full bg-yellow-400 transform -translate-x-1/2"></div>
              <div className="absolute left-0 top-1/2 h-1 w-full bg-yellow-400 transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-1 h-full bg-yellow-400 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
              <div className="absolute top-1/2 left-1/2 w-1 h-full bg-yellow-400 transform -translate-x-1/2 -translate-y-1/2 -rotate-45"></div>
            </div>

            {/* Center hub + Play icon */}
            <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-inner">
              <FaPlay className="text-black text-xl ml-0.5" />
            </div>

            {/* Film perforations around reel */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-zinc-900 border border-yellow-400/70 rounded-sm"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-68px)`,
                }}
              />
            ))}
          </div>

          {/* Film strips sliding (larger & smoother) */}
          <div className="absolute -top-5 -left-24 w-52 h-9 bg-gradient-to-r from-transparent via-amber-600 to-transparent rounded animate-slide-right opacity-80 shadow-xl">
            <div className="flex h-full items-center justify-center space-x-2 px-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-1.5 h-5 bg-zinc-950 rounded" />
              ))}
            </div>
          </div>

          <div className="absolute -bottom-5 -right-24 w-52 h-9 bg-gradient-to-r from-transparent via-amber-600 to-transparent rounded animate-slide-left opacity-80 shadow-xl delay-300">
            <div className="flex h-full items-center justify-center space-x-2 px-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-1.5 h-5 bg-zinc-950 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* ====================== TEXT & BRANDING ====================== */}
        <div className="text-center space-y-5">
          <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 drop-shadow-2xl">
            WeMovies
          </h1>
          
          <p className="text-white text-2xl tracking-[4px] font-light animate-typewriter overflow-hidden whitespace-nowrap border-r-4 border-yellow-400">
            {message}
          </p>
        </div>

        {/* ====================== LOADING BAR (no text, no %) ====================== */}
        {showProgress ? (
          <div className="relative w-96 h-4 bg-zinc-900 rounded-2xl overflow-hidden border border-yellow-400/30 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 rounded-2xl transition-all duration-700 ease-out shadow-md"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <div className="relative w-96 h-4 bg-zinc-900 rounded-2xl overflow-hidden border border-yellow-400/30 shadow-inner">
            <div className="h-full w-1/2 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 rounded-2xl animate-progress-bar shadow-md" />
          </div>
        )}

        {/* Floating cinematic elements */}
        <div className="absolute inset-0 pointer-events-none">
          <FaFilm className="absolute top-8 -left-12 text-yellow-300 text-5xl animate-float opacity-70" />
          <FaFilm className="absolute top-28 -right-16 text-blue-300 text-4xl animate-float-delayed opacity-60" />
          <FaFilm className="absolute bottom-20 -left-20 text-red-300 text-3xl animate-float-delayed-2 opacity-50" />
          <FaFilm className="absolute bottom-12 -right-8 text-emerald-300 text-4xl animate-float opacity-55" />
        </div>

        {/* Genre tags (smaller & elegant) */}
        <div className="absolute inset-0 pointer-events-none text-xs uppercase tracking-widest font-medium">
          <span className="absolute top-4 left-1/3 text-yellow-200/80 animate-float">ACTION</span>
          <span className="absolute top-20 right-1/4 text-blue-200/70 animate-float-delayed">DRAMA</span>
          <span className="absolute bottom-28 left-1/4 text-red-200/70 animate-float-delayed-2">COMEDY</span>
          <span className="absolute bottom-12 right-1/3 text-purple-200/70 animate-float">THRILLER</span>
        </div>
      </div>

      {/* Cinema frame corners */}
      <div className="absolute top-8 left-8 w-20 h-20 border-t-4 border-l-4 border-yellow-400/60 rounded-tl-3xl"></div>
      <div className="absolute top-8 right-8 w-20 h-20 border-t-4 border-r-4 border-yellow-400/60 rounded-tr-3xl"></div>
      <div className="absolute bottom-8 left-8 w-20 h-20 border-b-4 border-l-4 border-yellow-400/60 rounded-bl-3xl"></div>
      <div className="absolute bottom-8 right-8 w-20 h-20 border-b-4 border-r-4 border-yellow-400/60 rounded-br-3xl"></div>
    </div>
  );
};

export default PageLoader;