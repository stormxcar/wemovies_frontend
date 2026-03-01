import React, { useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, navigate }) => {
  const { user } = useAuth();
  const { themeClasses } = useTheme();
  const { t } = useTranslation();
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
    return location.pathname === path;
  };

  // Function to check if current path is under a parent section
  const isParentActive = (parentPath) => {
    if (parentPath === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/";
    }
    return location.pathname.startsWith(parentPath + "/");
  };

  // Function to get button classes with active state
  const getButtonClasses = (path, isParent = false) => {
    const baseClasses =
      "w-full text-left p-2 rounded transition-colors duration-200";
    const activeClasses = "bg-blue-600 text-white";
    const parentActiveClasses = "bg-blue-500 text-white";
    const inactiveClasses = `hover:${themeClasses.tertiary}`;

    if (isParent) {
      return `${baseClasses} ${
        isParentActive(path) && !isActive(path)
          ? parentActiveClasses
          : isActive(path)
            ? activeClasses
            : inactiveClasses
      }`;
    }

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <div className="relative">
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] ${themeClasses.primary} ${themeClasses.textPrimary} w-64 p-4 overflow-y-auto transition-transform duration-300 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${themeClasses.border} border-r`}
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
                className={getButtonClasses("/admin/categories", true)}
              >
                Danh mục
              </button>
              {isCategoryOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories")}
                      className={getButtonClasses("/admin/categories")}
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories/add")}
                      className={getButtonClasses("/admin/categories/add")}
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories/update")}
                      className={getButtonClasses("/admin/categories/update")}
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
                className={getButtonClasses("/admin/countries", true)}
              >
                Quốc gia
              </button>
              {isCountryOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries")}
                      className={getButtonClasses("/admin/countries")}
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries/add")}
                      className={getButtonClasses("/admin/countries/add")}
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries/update")}
                      className={getButtonClasses("/admin/countries/update")}
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
                className={getButtonClasses("/admin/movies", true)}
              >
                Phim
              </button>
              {isMovieOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies")}
                      className={getButtonClasses("/admin/movies")}
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies/add")}
                      className={getButtonClasses("/admin/movies/add")}
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies/update")}
                      className={getButtonClasses("/admin/movies/update")}
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
                className={getButtonClasses("/admin/types", true)}
              >
                Loại phim
              </button>
              {isTypeOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/types")}
                      className={getButtonClasses("/admin/types")}
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/types/add")}
                      className={getButtonClasses("/admin/types/add")}
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
                className={getButtonClasses("/admin/users", true)}
              >
                Người dùng
              </button>
              {isUserOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/users")}
                      className={getButtonClasses("/admin/users")}
                    >
                      Danh sách
                    </button>
                  </li>
                  {/* <li>
                    <button
                      onClick={() => navigate("/admin/users/add")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/users/update")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Cập nhật
                    </button>
                  </li> */}
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => navigate("/admin/notifications")}
                className={getButtonClasses("/admin/notifications")}
              >
                Thông báo
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/admin/settings")}
                className={getButtonClasses("/admin/settings")}
              >
                Cài đặt
              </button>
            </li>
            {/* Profile section at bottom */}
            <li className="border-t border-gray-700 pt-2 mt-4">
              <button
                onClick={() => navigate("/admin/profile")}
                className={`${getButtonClasses(
                  "/admin/profile",
                )} flex items-center space-x-2`}
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
