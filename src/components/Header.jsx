import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaCaretDown } from "react-icons/fa";
import { toast } from "react-toastify";
import Banner from "./Banner";
import RegisterForm from "../components/auth/RegisterForm";
import LoginForm from "../components/auth/LoginForm";
import {
  fetchCategories,
  fetchCountries,
  fetchMovieType,
  fetchJson,
} from "../services/api";
import { ClipLoader } from "react-spinners";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

function Header() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
    console.error(message, error);
    toast.error(`${message}`);
  }, []);

  // Fetch categories, countries, and types
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
    setIsLoading(true);
    try {
      const response = await fetchJson(
        `/api/movies/search?keyword=${encodeURIComponent(query)}`
      );
      navigate("/search", {
        state: { movies: Array.isArray(response) ? response : [] },
      });
    } catch (error) {
      handleApiError(error, "Lỗi khi tìm kiếm phim");
    } finally {
      setIsLoading(false);
      setIsSearchOpen(false);
    }
  }, [query, navigate, handleApiError]);

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
        console.error("userData is undefined in handleLoginSuccess");
        return;
      }

      const userInfo = {
        displayName:
          userData.displayName || userData.fullName || userData.email || "User",
        avatarUrl:
          userData.avatarUrl ||
          userData.avatar ||
          "https://via.placeholder.com/40",
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
        await fetchJson("/api/user/favorites", {
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
    [handleApiError]
  );

  const handleGoogleLoginSuccess = useCallback(
    async (credentialResponse) => {
      try {
        const response = await fetchJson("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ idToken: credentialResponse.credential }),
          credentials: "include",
        });

        if (response?.accessToken) {
          const userInfo = {
            displayName: response.displayName,
            avatarUrl: response.avatar || "https://via.placeholder.com/40",
            role: response.role || "user",
            email: response.email,
          };
          setUser(userInfo);
          localStorage.setItem("user", JSON.stringify(userInfo));
          setShowLogin(false);
          toast.success("Đăng nhập bằng Google thành công!");

          try {
            await fetchJson("/api/user/favorites", {
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
        } else {
          throw new Error("Invalid Google login response");
        }
      } catch (error) {
        handleApiError(error, "Lỗi khi đăng nhập bằng Google");
      }
    },
    [handleApiError]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout(); // Sử dụng AuthContext logout
      setShowUserModal(false);
      toast.success("Đăng xuất thành công!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
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
        navigate(`/movies/${name}`, {
          state: {
            movies: Array.isArray(response.data) ? response.data : [],
            title: name,
          },
        });
        closeModal();
      } catch (error) {
        handleApiError(error, `Lỗi khi tải phim cho ${name}`);
      }
    },
    [navigate, handleApiError, closeModal]
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSearchOpen(true);
            }}
            className="md:hidden p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            aria-label="Open search"
          >
            <FaSearch />
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

          <div className="hidden md:flex items-center w-full max-w-md">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDownToSearch}
              placeholder="Tìm kiếm phim..."
              className={`w-full px-4 py-2 rounded-lg text-white ${
                isScrolled ? "bg-gray-800" : "bg-gray-900/50"
              } border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors`}
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
                <FaCaretDown className="ml-1 text-lg" />
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
                          item.name
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
                        `/api/movies/category/id/${item.id}`,
                        item.name
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
                    prev === "countries" ? null : "countries"
                  );
                }}
                className="flex items-center hover:text-blue-300 transition-colors"
                aria-label="Quốc gia"
              >
                Quốc gia
                <FaCaretDown className="ml-1 text-lg" />
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
                          item.name
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
          {loading ? (
            <div>
              <ClipLoader color="#ffffff" size={30} />
            </div>
          ) : user ? (
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
                  className="absolute top-12 right-0 bg-black/90 text-white px-4 py-3 rounded-lg shadow-xl w-64 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold">
                      {user.displayName}
                    </h3>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
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

      {window.location.pathname === "/" && <Banner />}
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
          googleLoginButton={
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() =>
                handleApiError(
                  new Error("Google login failed"),
                  "Lỗi khi đăng nhập bằng Google"
                )
              }
              theme="filled_blue"
              size="large"
              text="signin_with"
              width="100%"
            />
          }
        />
      )}
    </header>
  );
}

export default Header;
