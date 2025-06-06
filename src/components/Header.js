import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaCaretDown, FaTimes, FaUser } from "react-icons/fa";
import { toast } from "react-toastify";
import Banner from "./Banner";
import RegisterForm from "../components/auth/RegisterForm";
import VerifyOtpForm from "../components/auth/VerifyOtpForm";
import LoginForm from "../components/auth/LoginForm";
import {
  fetchCategories,
  fetchCountries,
  fetchMovieType,
  fetchJson,
} from "../services/api";

function Header() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchIcon, setSearchIcon] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [types, setTypes] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showVerifyOtp, setShowVerifyOtp] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [user, setUser] = useState(null); // State lưu thông tin người dùng
  const [showUserModal, setShowUserModal] = useState(false); // State cho modal người dùng
  const [favorites, setFavorites] = useState([]); // State cho danh sách phim yêu thích

  const navigate = useNavigate();

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetchJson("/api/auth/verifyUser", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
        });
        if (response?.displayName) {
          setUser({
            displayName: response.displayName,
            avatarUrl: response.avatarUrl || "https://via.placeholder.com/40", // Avatar mặc định
            role: response.role || response.data?.role?.roleName,
          });
          // Lấy danh sách phim yêu thích
          // const favoritesResponse = await fetchJson("/api/user/favorites", {
          //   method: "GET",
          //   headers: {
          //     "Content-Type": "application/json",
          //     Accept: "application/json",
          //   },
          //   credentials: "include",
          // });
          // setFavorites(Array.isArray(favoritesResponse.data) ? favoritesResponse.data : []);
        }
      } catch (error) {
        console.log("Chưa đăng nhập");
      }
    };
    checkAuth();
  }, []);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetchJson(
        `/api/movies/search?keyword=${encodeURIComponent(query)}`
      );
      const data = Array.isArray(response) ? response : [];
      navigate("/search", { state: { movies: data } });
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm phim: " + error.message);
    } finally {
      setLoading(false);
      setSearchIcon(false);
    }
  }, [query, navigate]);

  const handleKeyDownToSearch = (event) => {
    if (event.key === "Enter") handleSearch();
  };

  // Fetch categories, countries, types
  useEffect(() => {
    Promise.all([
      fetchCategories().then(setCategories),
      fetchCountries().then(setCountries),
      fetchMovieType().then(setTypes),
    ]).catch((error) => toast.error("Lỗi khi tải dữ liệu: " + error.message));

    // console.log('====================================');
    // console.log("Categories:", categories);
    // console.log("Countries:", countries);
    // console.log("Types:", types);
    // console.log('====================================');
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close modals
  const closeModal = () => {
    setActiveModal(null);
    setShowRegister(false);
    setShowLogin(false);
    setShowVerifyOtp(false);
    setShowUserModal(false);
  };

  // Handle register success
  const handleRegisterSuccess = (email) => {
    console.log("Header nhận được email từ RegisterForm:", email);
    setVerifyEmail(email);
    setShowRegister(false);
    setShowVerifyOtp(true);
    console.log("Đã set showVerifyOtp:", true, "verifyEmail:", email);
  };

  // Handle OTP verification success
  const handleVerifyOtpSuccess = () => {
    setShowVerifyOtp(false);
    // setShowLogin(true);
  };

  // Handle login success
  const handleLoginSuccess = (userData) => {
    setUser({
      displayName: userData.displayName,
      avatarUrl: userData.avatarUrl || "https://via.placeholder.com/40",
      role: userData.role,
    });
    setShowLogin(false);
    // Lấy danh sách phim yêu thích
    fetchJson("/api/user/favorites", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    })
      .then((response) => {
        setFavorites(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy phim yêu thích:", error);
      });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetchJson("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });
      setUser(null);
      setFavorites([]);
      setShowUserModal(false);
      toast.success("Đăng xuất thành công!");
    } catch (error) {
      toast.error("Lỗi khi đăng xuất: " + error.message);
    }
  };

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
              setSearchIcon(true);
            }}
            className="md:hidden p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            aria-label="Open search"
          >
            <FaSearch />
          </button>

          {searchIcon && (
            <div
              className="fixed inset-0 bg-black/80 flex justify-center items-center z-40 md:hidden"
              onClick={() => setSearchIcon(false)}
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
                  disabled={loading}
                >
                  {loading ? "Đang tìm..." : "Tìm kiếm"}
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
                  {Array.isArray(types) &&
                    types.length > 0 &&
                    types.map((item) => (
                      <li
                        key={item.name}
                        className="cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded hover:bg-gray-800/50 flex"
                        onClick={async () => {
                          try {
                            const movies = await fetchJson(
                              `/api/movies/types/id/${item.id}`
                            );
                            navigate(`/movies/${item.name}`, {
                              state: {
                                movies: Array.isArray(movies.data)
                                  ? movies.data
                                  : [],
                                title: item.name,
                              },
                            });
                            closeModal();
                          } catch (error) {
                            console.error(
                              "Error fetching movies for category:",
                              error
                            );
                          }
                        }}
                      >
                        {item.name}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="relative">
              <div className="flex items-center gap-1">
                {Array.isArray(categories) &&
                  categories.length > 0 &&
                  categories.map((item) => (
                    <button
                      key={item.name}
                      className="cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded hover:bg-gray-800/50 flex"
                      onClick={async () => {
                        try {
                          const movies = await fetchJson(
                            `/api/movies/category/id/${item.id}`
                          );
                          navigate(`/movies/${item.name}`, {
                            state: {
                              movies: Array.isArray(movies.data)
                                ? movies.data
                                : [],
                              title: item.name,
                            },
                          });
                        } catch (error) {
                          console.error(
                            "Error fetching movies for category:",
                            error
                          );
                        }
                      }}
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
                  {Array.isArray(countries) &&
                    countries.length > 0 &&
                    countries.map((item) => (
                      <li
                        key={item.name}
                        className="cursor-pointer hover:text-blue-400 transition-colors text-sm p-2 rounded hover:bg-gray-800/50 flex"
                        onClick={async () => {
                          try {
                            const movies = await fetchJson(
                              `/api/movies/country/${item.id}`
                            );
                            navigate(`/movies/${item.name}`, {
                              state: {
                                movies: Array.isArray(movies.data)
                                  ? movies.data
                                  : [],
                                title: item.name,
                              },
                            });
                            closeModal();
                          } catch (error) {
                            console.error(
                              "Error fetching movies for country:",
                              error
                            );
                          }
                        }}
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
          {user ? (
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
                    <p className="text-sm text-gray-300">{user.role}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-md font-semibold">Phim yêu thích</h4>
                    {favorites.length > 0 ? (
                      <ul className="max-h-40 overflow-y-auto">
                        {favorites.map((movie) => (
                          <li
                            key={movie.id}
                            className="text-sm py-1 hover:text-blue-300 cursor-pointer"
                            onClick={() => navigate(`/movies/${movie.id}`)}
                          >
                            {movie.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Chưa có phim yêu thích
                      </p>
                    )}
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
            <>
              {/* <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRegister(true);
                }}
                className="hover:text-blue-300 transition-colors"
                aria-label="Đăng ký"
              >
                Đăng ký
              </a> */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLogin(true);
                }}
                className="hover:text-blue-300 transition-colors py-2 px-4 rounded-full bg-blue-900 text-center w-[50%]"
                aria-label="Đăng nhập"
              >
                Đăng nhập
              </a>
            </>
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
      {/* {showVerifyOtp && (
        <>
          {console.log("Render VerifyOtpForm với email:", verifyEmail)}
          <VerifyOtpForm
            email={verifyEmail}
            onClose={closeModal}
            onVerifySuccess={handleVerifyOtpSuccess}
          />
        </>
      )} */}
      {showLogin && (
        <LoginForm
          onClose={closeModal}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </header>
  );
}

export default Header;
