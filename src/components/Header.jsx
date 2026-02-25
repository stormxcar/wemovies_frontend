import React, { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  User,
  LogOut,
  UserCircle,
  Heart,
  Settings,
} from "lucide-react";
import { toast } from "react-toastify";
import RegisterForm from "../components/auth/RegisterForm";
import LoginForm from "../components/auth/LoginForm";
import MobileMenu from "./MobileMenu";
import NotificationCenter from "./notifications/NotificationCenter";
import {
  fetchCategories,
  fetchCountries,
  fetchMovieType,
  fetchJson,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/UnifiedLoadingContext";

function Header() {
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { setLoading, isLoading } = useLoading();
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [types, setTypes] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const navigate = useNavigate();
  const { user, setUser, logout, isAuthenticated, loading } = useAuth();

  // Centralized API error handler
  const handleApiError = useCallback((error, message) => {
    toast.error(`${message}`);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, countriesData, typesData] = await Promise.all([
          fetchCategories(),
          fetchCountries(),
          fetchMovieType(),
        ]);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setCountries(Array.isArray(countriesData) ? countriesData : []);
        setTypes(Array.isArray(typesData) ? typesData : []);
      } catch (error) {
        handleApiError(error, "Lỗi khi tải dữ liệu");
      }
    };
    fetchData();
  }, [handleApiError]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading("search", true, "Đang tìm kiếm...");
    try {
      const response = await fetchJson(
        `/api/movies/search?keyword=${encodeURIComponent(query)}`,
      );

      // Handle different response formats
      let movies = [];
      if (Array.isArray(response)) {
        movies = response;
      } else if (response && Array.isArray(response.data)) {
        movies = response.data;
      } else if (response && Array.isArray(response.movies)) {
        movies = response.movies;
      }

      navigate("/search", {
        state: { movies: movies },
      });
    } catch (error) {
      handleApiError(error, "Lỗi khi tìm kiếm phim");
    } finally {
      setLoading("search", false);
      setIsSearchOpen(false);
    }
  }, [query, navigate, handleApiError, setLoading]);

  const handleKeyDownToSearch = (event) => {
    if (event.key === "Enter") handleSearch();
  };

  // Modal and form handlers
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setShowRegister(false);
    setShowLogin(false);
    setShowUserModal(false);
  }, []);

  const handleLoginSuccess = useCallback(
    async (userData) => {
      if (!userData) {
        return;
      }

      const userInfo = {
        displayName:
          userData.displayName || userData.fullName || userData.email || "User",
        avatarUrl:
          userData.avatarUrl ||
          userData.avatar ||
          "/placeholder-professional.svg",
        role: userData.role || userData.roleName || "USER",
      };
      setUser(userInfo);
      localStorage.setItem("user", JSON.stringify(userInfo));
      setShowLogin(false);

      // Navigate based on user role
      const userRole =
        userData.role?.roleName || userData.roleName || userData.role || "USER";
      if (userRole === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }

      try {
        await fetchJson("/api/watchlist", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });
      } catch (error) {
        handleApiError(error, "Lỗi khi lấy phim yêu thích");
      }
    },
    [handleApiError],
  );

  const handleLogout = useCallback(async () => {
    try {
      setShowUserModal(false);
      toast.success("Đăng xuất thành công!");
      navigate("/");
    } catch (error) {
      // Vẫn logout ngay cả khi có lỗi
      logout();
      setShowUserModal(false);
      navigate("/");
    }
  }, [logout, navigate]);

  // Navigate to movies by category, country, or type
  const navigateToMovies = useCallback(
    async (endpoint, name) => {
      try {
        const response = await fetchJson(endpoint);

        // Handle different response formats
        let movies = [];
        if (response && Array.isArray(response)) {
          movies = response;
        } else if (response && Array.isArray(response.data)) {
          movies = response.data;
        } else if (
          response &&
          response.movies &&
          Array.isArray(response.movies)
        ) {
          movies = response.movies;
        } else {
          movies = [];
        }

        navigate(`/movies/${name}`, {
          state: {
            movies,
            title: name,
          },
        });
        closeModal();
      } catch (error) {
        handleApiError(error, `Lỗi khi tải phim cho ${name}`);

        // Navigate anyway with empty movies array to show the page
        navigate(`/movies/${name}`, {
          state: {
            movies: [],
            title: name,
          },
        });
        closeModal();
      }
    },
    [navigate, handleApiError, closeModal],
  );

  return (
    <header className="w-full bg-transparent">
      <div
        className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 ${
          isScrolled ? "bg-black/80 shadow-lg" : "bg-transparent"
        } p-4 flex items-center justify-between text-white`}
        onClick={closeModal}
      >
        <div className="flex items-center space-x-4 w-full">
          <a
            href="/"
            className="text-2xl font-bold hover:text-blue-300 transition-colors"
          >
            Wemovies
          </a>

          <MobileMenu
            categories={categories}
            types={types}
            countries={countries}
            navigateToMovies={navigateToMovies}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSearchOpen(true);
            }}
            className="md:hidden p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>

          {isSearchOpen && (
            <div
              className="fixed inset-0 bg-black/80 flex justify-center items-center z-40 md:hidden"
              onClick={() => setIsSearchOpen(false)}
            >
              <div
                className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDownToSearch}
                  placeholder="Tìm kiếm phim..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  autoFocus
                />
                <button
                  onClick={handleSearch}
                  className="w-full mt-3 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang tìm..." : "Tìm kiếm"}
                </button>
              </div>
            </div>
          )}

          <div className="hidden md:flex items-center search-container">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownToSearch}
              placeholder="Tìm kiếm phim..."
              className={`w-full px-4 py-2 rounded-lg text-white ${
                isScrolled ? "bg-gray-800" : "bg-gray-900/50"
              } border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-400`}
            />
          </div>

          <div className="hidden md:flex items-center space-x-6 ml-6">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal((prev) => (prev === "types" ? null : "types"));
                }}
                className="flex items-center hover:text-blue-300 transition-colors"
                aria-label="Thể loại"
              >
                Thể loại
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {activeModal === "types" && (
                <ul
                  className="absolute top-10 left-0 bg-black/90 text-white px-4 py-3 rounded-lg shadow-xl w-96 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 max-h-screen overflow-y-auto modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  {types.map((item) => (
                    <li
                      key={item.name}
                      className="cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded hover:bg-gray-800/50 flex"
                      onClick={() =>
                        navigateToMovies(
                          `/api/movies/types/id/${item.id}`,
                          item.name,
                        )
                      }
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <div className="flex items-center gap-1">
                {categories.map((item) => (
                  <button
                    key={item.name}
                    className="cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded hover:bg-gray-800/50 flex"
                    onClick={() =>
                      navigateToMovies(
                        `/api/movies/category/${item.name}`,
                        item.name,
                      )
                    }
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModal((prev) =>
                    prev === "countries" ? null : "countries",
                  );
                }}
                className="flex items-center hover:text-blue-300 transition-colors"
                aria-label="Quốc gia"
              >
                Quốc gia
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {activeModal === "countries" && (
                <ul
                  className="absolute top-10 left-0 bg-black/90 text-white px-4 py-3 rounded-lg shadow-xl w-96 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 max-h-screen overflow-y-auto modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  {countries.map((item) => (
                    <li
                      key={item.name}
                      className="cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded hover:bg-gray-800/50 flex"
                      onClick={() =>
                        navigateToMovies(
                          `/api/movies/country/${item.id}`,
                          item.name,
                        )
                      }
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center w-[30%] justify-end">
          {isLoading("search") ? null : user ? (
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserModal(!showUserModal);
                  }}
                  className="flex items-center space-x-2"
                >
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border-2 border-blue-300"
                  />
                  <span className="text-white">{user.displayName}</span>
                </button>
                {showUserModal && (
                  <div
                    className="absolute top-12 right-0 bg-white text-gray-800 rounded-lg shadow-xl w-64 z-50 border overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b bg-gray-50">
                      <h3 className="font-semibold text-gray-900">
                        {user.displayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {user.role?.roleName || "User"}
                      </p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setShowUserModal(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center space-x-3"
                      >
                        <UserCircle className="w-5 h-5 text-gray-600" />
                        <span>Trang cá nhân</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/profile?tab=watchlist");
                          setShowUserModal(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center space-x-3"
                      >
                        <Heart className="w-5 h-5 text-gray-600" />
                        <span>Phim yêu thích</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/profile?tab=watching");
                          setShowUserModal(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center space-x-3"
                      >
                        <Settings className="w-5 h-5 text-gray-600" />
                        <span>Phim đang xem</span>
                      </button>
                    </div>
                    <div className="border-t">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-3"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLogin(true);
              }}
              className="hover:text-blue-300 transition-colors py-2 px-4 rounded-full bg-blue-900 text-center w-[50%]"
              aria-label="Đăng nhập"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>

      {showRegister && (
        <RegisterForm
          onClose={closeModal}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
      {showLogin && (
        <LoginForm
          onClose={closeModal}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onLoginSuccess={handleLoginSuccess}
          googleLoginButton={null}
        />
      )}
    </header>
  );
}

export default memo(Header);
