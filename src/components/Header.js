import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaCaretDown, FaTimes } from "react-icons/fa";
import Banner from "./Banner";
import { fetchCategories, fetchCountries } from "../services/api";
import { fetchJson } from "../services/api";

function Header() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchIcon, setSearchIcon] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [showRegister, setShowRegister] = useState(false); // Trạng thái popup đăng ký
  const [registerForm, setRegisterForm] = useState({
    displayName: "",
    email: "",
    password: "",
  }); // Form đăng ký
  const [showLogin, setShowLogin] = useState(false); // Trạng thái popup đăng nhập
  const [loginForm, setLoginForm] = useState({ email: "", password: "" }); // Form đăng nhập

  const navigate = useNavigate();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetchJson(
        `/api/movies/search?keyword=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error(response.statusText);
      const textResponse = await response.text();
      const data = textResponse ? JSON.parse(textResponse) : [];
      navigate("/search", { state: { movies: data } });
    } catch (error) {
      console.error("Error during fetch:", error);
    } finally {
      setLoading(false);
      setSearchIcon(false);
    }
  }, [query, navigate]);

  const handleKeyDownToSearch = (event) => {
    if (event.key === "Enter") handleSearch();
  };

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((error) => console.error("Error fetching categories:", error));
    fetchCountries()
      .then(setCountries)
      .catch((error) => console.error("Error fetching countries:", error));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setShowRegister(false);
    setShowLogin(false);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    console.log("Register:", registerForm);
    // Thêm logic đăng ký (gọi API) ở đây
    setShowRegister(false);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log("Login:", loginForm);
    // Thêm logic đăng nhập (gọi API) ở đây
    setShowLogin(false);
  };

  return (
    <header className="w-full bg-transparent">
      <div
        className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 ${
          isScrolled ? "bg-black/80 shadow-lg" : "bg-transparent"
        } p-4 flex items-center justify-between text-white`}
        onClick={closeModal}
      >
        <div className="flex items-center space-x-4 w-full md:w-[70%]">
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
                  setActiveModal((prev) =>
                    prev === "categories" ? null : "categories"
                  );
                }}
                className="flex items-center hover:text-blue-300 transition-colors"
                aria-label="Thể loại"
              >
                Thể loại
                <FaCaretDown className="ml-1 text-lg" />
              </button>
              {activeModal === "categories" && (
                <ul
                  className="absolute top-10 left-0 bg-black/90 text-white px-4 py-3 rounded-lg shadow-xl w-96 grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 max-h-screen overflow-y-auto modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  {Array.isArray(categories) &&
                    categories.length > 0 &&
                    categories.map((item) => (
                      <li
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

            {/* <a
              href="/dien-vien"
              className="hover:text-blue-300 transition-colors"
              aria-label="Diễn viên"
            >
              Diễn viên
            </a> */}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a
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
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowLogin(true);
            }}
            className="hover:text-blue-300 transition-colors"
            aria-label="Đăng nhập"
          >
            Đăng nhập
          </a>
        </div>
      </div>

      {window.location.pathname === "/" && <Banner />}

      {showRegister && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-blue-950/70 p-10 rounded-lg shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300"
              onClick={closeModal}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl text-white font-semibold mb-4">
              Tạo tài khoản mới
            </h2>
            <p className="text-gray-300 mb-6">
              Nếu bạn đã có tài khoản, <a href="#" onClick={(e) => {
                e.preventDefault();
                setShowLogin(true);
                setShowRegister(false);
              }} className="text-blue-300">đăng nhập</a>
            </p>
            <form onSubmit={handleRegisterSubmit}>
              <input
                type="text"
                value={registerForm.displayName}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    displayName: e.target.value,
                  })
                }
                placeholder="Tên hiển thị"
                className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                placeholder="Email"
                className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                placeholder="Mật khẩu"
                className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <input
                type="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2 mb-4 bg-gray-900/10 border-[1px] border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                type="submit"
                className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      )}

      {showLogin && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div
            className="bg-blue-950/70 p-10 rounded-lg shadow-xl w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-300"
              onClick={closeModal}
            >
              <FaTimes />
            </button>
            <div className="mb-8">
              <h2 className="text-xl text-white font-semibold mb-2">
                Đăng nhập
              </h2>
              <p className="text-gray-300 mb-6">
                Nếu bạn chưa có tài khoản, <a href="#" onClick={(e) => {
                e.preventDefault();
                setShowRegister(true);
                setShowLogin(false);
              }} className="text-blue-300">đăng ký ngay</a>
              </p>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
                placeholder="Email"
                className="w-full px-4 py-2 mb-4 bg-gray-900/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 border-[1px] border-gray-700"
              />
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                placeholder="Mật khẩu"
                className="w-full px-4 py-2 mb-4 bg-gray-900/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 border-[1px] border-gray-700"
              />
              <button
                type="submit"
                className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-600 transition-colors"
              >
                Đăng nhập
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
