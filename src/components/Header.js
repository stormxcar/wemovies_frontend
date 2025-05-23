import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";

function Header() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchIcon, setSearchIcon] = useState(false);

    const navigate = useNavigate();

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/movies/search?keyword=${encodeURIComponent(query)}`
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

    return (
        <header className="flex items-center justify-between bg-gray-800 p-4 text-white w-full">
            {/* Logo */}
            <div className="text-2xl font-bold">
                <a href="/">Movies</a>
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
            <div className="hidden md:flex items-center w-1/2 group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDownToSearch}
                    placeholder="Tìm kiếm phim..."
                    className="w-full px-4 py-2 rounded-l-lg focus:outline-none text-gray-800"
                />
                <button
                    onClick={handleSearch}
                    className="bg-blue-500 rounded-r-lg hover:bg-blue-600 w-[100px] py-2 text-center group-focus-within:bg-blue-700 transition-all"
                    disabled={loading}
                >
                    {loading ? "Đang tìm..." : "Tìm kiếm"}
                </button>
            </div>
        </header>
    );
}

export default Header;
