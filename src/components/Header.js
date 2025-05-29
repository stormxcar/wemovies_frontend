import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import Banner from "./Banner";
import { fetchCategories } from "../services/api";
import { fetchJson } from "../services/api";

function Header() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchIcon, setSearchIcon] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [navOpen, setNavOpen] = useState(false);

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

    console.log("data: ", categories);
  }, []);

  // Handle scroll for nav background change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full bg-transparent">
      {/* Navigation */}
      <div
        className={`fixed top-0 left-0 w-full z-30 transition-all duration-300 ${
          isScrolled ? "bg-black/70 shadow-lg" : "opacity-100"
        } p-4 flex items-center justify-between text-white`}
      >
        {/* Logo */}
        <div className="text-2xl font-bold">
          <a href="/">Wemovies</a>
        </div>

        {/* Mobile Search Icon */}
        <button
          onClick={() => setSearchIcon(true)}
          className="md:hidden p-2 rounded-full bg-blue-500 text-white"
          aria-label="Open search"
        >
          <FaSearch />
        </button>

        {/* Mobile Search Modal */}
        {searchIcon && (
          <div
            className="fixed top-0 left-0 w-full h-full bg-black/80 flex justify-center items-center md:hidden z-10"
            onClick={() => setSearchIcon(false)}
          >
            <div
              className="bg-white p-4 rounded-lg shadow-lg w-3/4"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownToSearch}
                placeholder="Tìm kiếm phim..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none text-black"
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md"
                disabled={loading}
              >
                {loading ? "Đang tìm..." : "Tìm kiếm"}
              </button>
            </div>
          </div>
        )}

        {/* Desktop Search Bar */}
        <div className="hidden md:flex items-center w-1/3 group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownToSearch}
            placeholder="Tìm kiếm phim..."
            className={`w-full px-4 py-2 rounded-lg focus:outline-none text-white ${
              isScrolled ? "bg-gray-800" : "bg-transparent"
            } border-2 border-gray-600 outline-none
            focus:border-blue-500 transition-all`}
          />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setNavOpen((prev) => !prev)}
              className="hover:text-blue-300 transition-colors"
              aria-label="Thể loại"
            >
              Thể loại
            </button>
            {navOpen && (
              <ul className="absolute left-0 mt-2 bg-black/80 text-white px-4 py-2 rounded shadow-lg w-48">
                {Array.isArray(categories) &&
                  categories.length > 0 &&
                  categories.map((item) => (
                    <li
                      key={item.name}
                      className="cursor-pointer hover:text-blue-400 transition mb-4 last:mb-0 text-sm"
                    >
                      <li
                        key={item.name}
                        className="cursor-pointer hover:text-blue-400 transition mb-4 last:mb-0 text-sm"
                        onClick={async () => {
                          try {
                            const movies = await fetchJson(
                              `/api/movies/category/id/${item.id}`
                            );
                          
                            navigate(`/category/${item.name}`, {
                              state: {
                                movies: Array.isArray(movies.data) ? movies.data : [],
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
                      </li>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <a
            href="/quoc-gia"
            className="hover:text-blue-300 transition-colors"
            aria-label="Quốc gia"
          >
            Quốc gia
          </a>
          <a
            href="/dien-vien"
            className="hover:text-blue-300 transition-colors"
            aria-label="Diễn viên"
          >
            Diễn viên
          </a>
        </div>
      </div>

      {window.location.pathname === "/" && <Banner />}
    </header>
  );
}

export default Header;
