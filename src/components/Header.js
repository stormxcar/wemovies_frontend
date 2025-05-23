import React from "react";
import {useState, useRef, useEffect} from "react";
import {Link} from "react-router-dom";
import {useNavigate} from "react-router-dom";
import {FaSearch} from 'react-icons/fa';

function Header() {
    const [query, setQuery] = useState('');
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchIcon, setSearchIcon] = useState(false);
    const [searchMovieFound , setSearchMovieFound] = useState(false);
    // const inputRef = useRef(null); // tạo tham chiêu đến thẻ input
    //  useEffect(() => {
    //      if(searchIcon && inputRef.current){
    //          console.log("focus input" ,inputRef.current)
    //          inputRef.current.focus();
    //      }
    //  },[searchIcon]); // chạy mỗi khi searchIcon thay đổi

    const navigate = useNavigate();
    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/movies/search?keyword=${query}`);

            // Kiểm tra phản hồi từ server
            if (!response.ok) {
                console.error('Failed to fetch data:', response.statusText);
                return;
            }

            // Kiểm tra nếu phản hồi có dữ liệu
            const textResponse = await response.text();
            if (textResponse) {
                const data = JSON.parse(textResponse); // Phân tích dữ liệu JSON

                // Kiểm tra xem có phim nào được tìm thấy không
                if (data.length === 0) {
                    setSearchMovieFound(true);
                    // console.log('Không tìm thấy phim nào.');
                    navigate('search', {state: {movies: data}});
                }else{
                    setSearchMovieFound(false);
                    setMovies(data);
                    navigate('/search', {state: {movies: data}});
                }


                // setMovies(data);
                // navigate('/search', {state: {movies: data}});
            } else {
                console.error('Không có phản hồi từ server.');
            }
        } catch (error) {
            console.error("Error during fetch:", error);
        } finally {
            setLoading(false);
            setSearchIcon(false);
        }
    };

    const handleKeyDownToSearch = (event) => {
        if(event.key == 'Enter'){
            handleSearch();
        }
    }

    return (
        <>
            <header className="flex items-center justify-between bg-gray-800 p-4 text-white w-full">
                {/* Logo */}
                <div className="text-2xl font-bold">
                    <a href="/">Movies</a>
                </div>

                <button onClick={() => setSearchIcon(true)}
                        className="md:hidden p-2 rounded-full bg-blue-500 text-white"
                >
                    <FaSearch/>
                </button>

                {searchIcon && ( // Dùng {searchIcon && ...} thay vì hidden để giữ DOM
                    <div
                        className="fixed top-0 left-0 w-full h-full bg-black/80 flex justify-center items-center md:hidden z-10"
                        onClick={() => setSearchIcon(false)} // Click ngoài để đóng
                    >
                        <div className="bg-white p-4 rounded-lg shadow-lg w-3/4"
                             onClick={(e) => e.stopPropagation()} // Không đóng khi click vào trong
                        >
                            <input
                                // ref={inputRef} // Gán ref vào input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDownToSearch}
                                placeholder="Tìm kiếm phim..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none text-black"
                            />
                            <button
                                onClick={handleSearch}
                                className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md">
                                Tìm kiếm
                            </button>
                        </div>
                    </div>
                )}


                {/* Thanh tìm kiếm hiển thị màn hình lớn */}
                <div className="hidden md:flex flex items-center w-1/2 group">
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
                        className="bg-blue-500 rounded-r-lg hover:bg-blue-600 w-[100px] py-2
                        text-center
                        group-focus-within:bg-blue-700 transition-all">
                        Tìm kiếm
                    </button>
                </div>

            </header>
        </>
    );
}

export default Header;
