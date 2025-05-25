import React, { useState } from "react";

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, navigate }) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isMovieOpen, setIsMovieOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  return (
    <div className="relative">
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gray-900 text-white w-64 p-4 overflow-y-auto transition-transform duration-300 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:w-64 z-40`}
      >
        <nav>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => navigate("/admin")}
                className="w-full text-left p-2 hover:bg-gray-700 rounded"
              >
                Trang chủ
              </button>
            </li>
            <li>
              <button
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full text-left p-2 hover:bg-gray-700 rounded"
              >
                Danh mục
              </button>
              {isCategoryOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories/add")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/categories/update")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
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
                className="w-full text-left p-2 hover:bg-gray-700 rounded"
              >
                Quốc gia
              </button>
              {isCountryOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries/add")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/countries/update")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
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
                className="w-full text-left p-2 hover:bg-gray-700 rounded"
              >
                Phim
              </button>
              {isMovieOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies/add")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Thêm
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/movies/update")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
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
                className="w-full text-left p-2 hover:bg-gray-700 rounded"
              >
                Loại phim
              </button>
              {isTypeOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/types")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/admin/types/add")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
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
                className="w-full text-left p-2 hover:bg-gray-700 rounded"
              >
                Người dùng
              </button>
              {isUserOpen && (
                <ul className="pl-4 space-y-1">
                  <li>
                    <button
                      onClick={() => navigate("/admin/users")}
                      className="w-full text-left p-2 hover:bg-gray-700 rounded"
                    >
                      Danh sách
                    </button>
                  </li>
                  <li>
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
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => navigate("/admin/settings")}
                className="w-full text-left p-2 hover:bg-gray-700 rounded"
              >
                Cài đặt
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <button
        className={`fixed top-20 left-4 z-50 md:hidden p-2 bg-gray-700 text-white rounded ${
          isSidebarOpen ? "hidden" : "block"
        }`}
        onClick={() => setIsSidebarOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
      {isSidebarOpen && (
        <button
          className="fixed top-20 left-64 md:hidden p-2 bg-gray-700 text-white rounded"
          onClick={() => setIsSidebarOpen(false)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Sidebar;