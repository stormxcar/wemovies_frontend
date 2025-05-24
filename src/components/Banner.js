import React from "react";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/scrollbar";

// import required modules
import { Scrollbar } from "swiper/modules";

function Banner() {
  const [loading, setLoading] = useState(false);
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const mockMovies = [
      {
        title: "Movie 1",
        description: "Description for Movie 1",
        thumb_url:
          "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
        title: "Movie 2",
        description: "Description for Movie 2",
        thumb_url:
          "https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDJ8fHxlbnwwfHx8fHw%3D",
      },
      {
        title: "Movie 3",
        description: "Description for Movie 3",
        thumb_url:
          "https://images.unsplash.com/photo-1511875762315-c773eb98eec0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDI0fHx8ZW58MHx8fHx8",
      },
      {
        title: "Movie 4",
        description: "Description for Movie 4",
        thumb_url:
          "https://images.unsplash.com/photo-1725983615817-963c4b2ccb06?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
        title: "Movie 5",
        description: "Description for Movie 5",
        thumb_url:
          "https://images.unsplash.com/photo-1535446937720-e4cad0145efe?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
    ];
    setMovies(mockMovies);
  }, []);

  return (
    <div className="relative w-full h-[90vh] overflow-hidden">
      {movies.length > 0 && (
        <Swiper
          scrollbar={{
            hide: true,
            draggable: true,
            snapOnRelease: true,
            autoFocus: true,
          }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          onSlideChange={(swiper) => setCurrentIndex(swiper.realIndex)}
          onSwiper={(swiper) => setCurrentIndex(swiper.realIndex)}
          spaceBetween={0}
          slidesPerView={1}
          loop={true}
          speed={800}
          onTouchStart={() => setLoading(true)}
          onTouchEnd={() => setLoading(false)}
          onTouchMove={() => setLoading(false)}
          onTouchCancel={() => setLoading(false)}
          modules={[Scrollbar]}
          className="mySwiper overflow-hidden"
        >
          {movies.map((movie, index) => (
            <SwiperSlide key={index} className="w-full h-full relative">
              <div className="w-full h-full inset-0">
                <img
                  src={movie.thumb_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent z-10"></div>
              <div className="absolute top-52 left-12 text-left text-white z-20 max-w-2xl px-4 pointer-events-none">
                <h1 className="text-4xl font-bold">{movie.title}</h1>
                <p className="mt-2 text-lg">{movie.description}</p>
                <button className="mt-4 bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-full text-lg">
                  Xem ngay
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
export default Banner;
