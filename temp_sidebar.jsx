import React, { useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, navigate }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isMovieOpen, setIsMovieOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  // Function to check if current path matches the given path
  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(path);
  };

  // Function to get button classes with active state
  const getButtonClasses = (path) => {
    const baseClasses = "w-full text-left p-2 rounded transition-colors duration-200";
    const activeClasses = "bg-blue-600 text-white";
    const inactiveClasses = "hover:bg-gray-700";
    
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="relative">
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-900 text-white w-64 p-4 overflow-y-auto transition-transform duration-300 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => navigate("/admin")}
                className={getButtonClasses("/admin")}
              >
                Trang chủ
              </button>
            </li>
            <li>
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className={getButtonClasses("/admin/categories")}
              >
                Danh mục
              </button>
              {isCategoryOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories")}
                      className={getButtonClasses(path)}
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories/add")}
                      className={getButtonClasses(path)}
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories/update")}
                      className={getButtonClasses(path)}
                    >
                      Cập nhật
                    </button>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => setIsCountryOpen(!isCountryOpen)}
                className={getButtonClasses(path)}
              >
                Quốc gia
              </button>
              {isCountryOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries")}
                      className={getButtonClasses(path)}
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries/add")}
                      className={getButtonClasses(path)}
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries/update")}
                      className={getButtonClasses(path)}
                    >
                      Cập nhật
                    </button>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => setIsMovieOpen(!isMovieOpen)}
                className={getButtonClasses(path)}
              >
                Phim
              </button>
              {isMovieOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies")}
                      className={getButtonClasses(path)}
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies/add")}
                      className={getButtonClasses(path)}
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies/update")}
                      className={getButtonClasses(path)}
                    >
                      Cập nhật
                    </button>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => setIsTypeOpen(!isTypeOpen)}
                className={getButtonClasses(path)}
              >
                Loại phim
              </button>
              {isTypeOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/types")}
                      className={getButtonClasses(path)}
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/types/add")}
                      className={getButtonClasses(path)}
                    >
                      Thêm
                    </button>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => setIsUserOpen(!isUserOpen)}
                className={getButtonClasses(path)}
              >
                Người dùng
              </button>
              {isUserOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/users")}
                      className={getButtonClasses(path)}
                    >
                      Danh sách
                    </button>
                  </li>
                  {/* <li>
                    <button
                      onClick={() => navigate("/admin/users/add")}
                      className={getButtonClasses(path)}
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/users/update")}
                      className={getButtonClasses(path)}
                    >
                      Cập nhật
                    </button>
                  </li> */}
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => navigate("/admin/settings")}
                className={getButtonClasses(path)}
              >
                Cài đặt
              </button>
            </li>
            {/* Profile section at bottom */}
            <li className="border-t border-gray-700 pt-2 mt-4">
              <button
                onClick={() => navigate("/admin/profile")}
                className="w-full text-left p-2 hover:bg-gray-700 rounded flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{user?.fullName || user?.email || "Admin"}</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <button
        className={`fixed top-20 left-5 z-50 p-2 bg-gray-700 text-white rounded ${
          isSidebarOpen ? "hidden" : "block"
        }`}
        onClick={() => setIsSidebarOpen(true)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>
      {isSidebarOpen && (
        <button
          className="fixed top-20 left-[260px] p-2 bg-gray-700 text-white rounded"
          onClick={() => setIsSidebarOpen(false)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Sidebar;
