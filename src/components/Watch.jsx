import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { fetchJson } from "../services/api";
import { useStartWatching } from "../hooks/useStartWatching";
import { useAuth } from "../context/AuthContext";

function Watch() {
  const location = useLocation();
  const { id: paramId } = useParams();
  const { movieDetail, id = paramId } = location.state || {};
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get startTime from URL or location state for resume functionality  
  const searchParams = new URLSearchParams(location.search);
  const startTime = searchParams.get('t') || (location.state && location.state.startTime) || 0;

  const [relatedMovies, setRelatedMovies] = useState([]);
  const [currentMovieData, setCurrentMovieData] = useState(movieDetail || null);
  const iframeRef = useRef(null);
  
  // Initialize watching tracker
  const { startWatchingMovie } = useStartWatching();

  const fetchRelatedMovies = useCallback(async (categoryId) => {
    if (!categoryId) {
      console.log("No valid categoryId provided");
      setRelatedMovies([]);
      return;
    }
    try {
      console.log("Fetching related movies for categoryId:", categoryId);
      const data = await fetchJson(`/api/movies/category/id/${categoryId}`);

      setRelatedMovies(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error("Error fetching related movies:", e);
      setRelatedMovies([]);
    }
  }, []);

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        const data = await fetchJson(`/api/movies/${id}`);
        setCurrentMovieData(data.data);

        if (data.data.movieCategories?.length) {
          fetchRelatedMovies(data.data.movieCategories[0].id);
        }
        
        // Start watching session if user is logged in
        if (user && data.data) {
          startWatchingMovie(data.data.id, data.data.title, user.id);
        }
      } catch (e) {
        console.error("Failed to fetch movie details:", e);
      }
    };
    fetchMovieDetail();
  }, [id, fetchRelatedMovies, user, startWatchingMovie]);
  
  // Handle iframe load to set start time for resume
  const handleIframeLoad = () => {
    if (startTime && startTime > 0 && iframeRef.current) {
      try {
        // Try to set start time via postMessage (if the iframe supports it)
        const iframe = iframeRef.current;
        const message = {
          type: 'SEEK_TO_TIME', 
          time: parseInt(startTime)
        };
        iframe.contentWindow?.postMessage(message, '*');
        
        // Also try to modify URL if possible
        const iframeSrc = iframe.src;
        if (iframeSrc && !iframeSrc.includes('t=')) {
          const separator = iframeSrc.includes('?') ? '&' : '?';
          iframe.src = `${iframeSrc}${separator}t=${startTime}`;
        }
      } catch (error) {
        console.warn('Could not set start time for video:', error);
      }
    }
  };

  const handleSeeAllMovies = () => {
    navigate("/allmovies", {
      state: { movies: relatedMovies, title: "Related Movies" },
    });
  };

  // const episodeLinks = movieDetail.episodeLinks?.split(",") || [];

  return (
    <div className="watch bg-gray-800 w-full h-auto flex flex-col text-white pt-28 px-4 pb-8 flex-1">
      <div>
        <div className="flex items-center px-5 mb-4">
          <div className="rounded-full text-white flex items-center justify-center border-2 p-3 mr-3">
            <FaChevronLeft className="text-xl cursor-pointer" />
          </div>
          <p className="text-xl">
            Xem phim {currentMovieData?.title} 
            {startTime > 0 && (
              <span className="text-blue-400 text-sm ml-2">
                (Tiếp tục từ {Math.floor(startTime / 60)}:{(startTime % 60).toString().padStart(2, '0')})
              </span>
            )}
          </p>
        </div>

        <iframe
          ref={iframeRef}
          src={currentMovieData?.link || ""}
          title={currentMovieData?.title || "Movie"}
          width="100%"
          height="600px"
          allowFullScreen
          className="rounded-lg shadow-lg"
          onLoad={handleIframeLoad}
        ></iframe>
      </div>

      <div className="flex mt-8 px-5 w-full">
        <div className="w-[70%] flex items-start">
          <div className="w-1/4 h-64 relative">
            <img
              src={currentMovieData?.thumb_url}
              alt={currentMovieData?.title}
              className=" h-full object-contain rounded-lg shadow-lg"
            />
          </div>
          <div className="mt-4 mx-4">
            <h2 className="text-2xl font-bold mb-2">Thông tin phim</h2>
            <p>
              <strong>Thể loại:</strong> {currentMovieData?.category || "N/A"}
            </p>
            <p>
              <strong>Đạo diễn:</strong> {currentMovieData?.director || "N/A"}
            </p>
            <p>
              <strong>Diễn viên:</strong> {currentMovieData?.actors || "N/A"}
            </p>
            <p>
              <strong>Năm phát hành:</strong> {currentMovieData?.year || "N/A"}
            </p>
          </div>
        </div>

        <div className="w-[30%] ml-8 pl-8 border-l-[1px] border-gray-600">
          <div>
            <h2 className="text-2xl font-bold mb-2">Mô tả</h2>
            <p
              className="text-gray-300"
              dangerouslySetInnerHTML={{
                __html: currentMovieData?.description || "N/A",
              }}
            ></p>
          </div>

          <div className="mt-8 border-t-[1px] border-gray-600 pt-8">
            <div className="flex items-center justify-between">
              <h2>Đề xuất cho bạn</h2>
              <button
                onClick={handleSeeAllMovies}
                className="text-white hover:bg-blue-700 rounded px-4 py-2 flex items-center"
              >
                Xem tất cả
                <FaChevronRight className="inline ml-2" />
              </button>
            </div>

            {relatedMovies.length > 0 ? (
              <div className="mt-4">
                {relatedMovies.map((movie) => (
                  <Link
                    to={`/watch/${movie.id}`}
                    key={movie.id}
                    className="flex mb-4 items-center rounded-lg"
                  >
                    <div className="flex-shrink-0 h-24">
                      <img
                        src={movie.thumb_url}
                        alt={movie.title}
                        className="h-full object-contain rounded-lg mr-4"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-normal">{movie.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p>Khong tim thay phim</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Watch;
