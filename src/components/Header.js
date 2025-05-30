import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaCaretDown } from "react-icons/fa";
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

  const closeModal = () => setActiveModal(null);

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

            <a
              href="/dien-vien"
              className="hover:text-blue-300 transition-colors"
              aria-label="Diễn viên"
            >
              Diễn viên
            </a>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="/dang-ky"
            className="hover:text-blue-300 transition-colors"
            aria-label="Đăng ký"
          >
            Đăng ký
          </a>
          <a
            href="/dang-nhap"
            className="hover:text-blue-300 transition-colors"
            aria-label="Đăng nhập"
          >
            Đăng nhập
          </a>
        </div>
      </div>

      {window.location.pathname === "/" && <Banner />}
    </header>
  );
}

export default Header;
