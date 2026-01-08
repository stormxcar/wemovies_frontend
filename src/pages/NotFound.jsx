import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Search, Film, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Film Reel Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <Film className="w-16 h-16 text-white" />
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
          <div
            className="absolute -top-2 -right-6 w-6 h-6 bg-red-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="absolute -bottom-2 -left-8 w-4 h-4 bg-green-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 mb-4">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trang không tồn tại
          </h2>
          <p className="text-gray-300 text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            Xin lỗi, trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
            Hãy quay về trang chủ để khám phá những bộ phim hay nhé!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </button>

          <button
            onClick={() => navigate("/search")}
            className="flex items-center gap-2 px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all duration-200"
          >
            <Search className="w-5 h-5" />
            Tìm kiếm phim
          </button>
        </div>

        {/* Fun Movie Quotes */}
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto">
          <p className="text-gray-300 italic text-sm md:text-base">
            "Sometimes the right path is not the easiest one."
          </p>
          <p className="text-gray-400 text-xs mt-2">- The Princess Bride</p>
        </div>

        {/* Additional Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <button
            onClick={() => navigate("/allmovies")}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Xem tất cả phim
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={() => navigate("/search")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Tìm kiếm nâng cao
          </button>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default NotFound;
