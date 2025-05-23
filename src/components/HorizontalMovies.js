import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function HorizontalMovies({ title, movies = [] }) {
    const navigate = useNavigate();
    const validMovies = Array.isArray(movies) ? movies : [];

    const handleClickToDetail = (movieID) => navigate(`/movie/${movieID}`);

    return (
        <div className="my-6 py-5 overflow-hidden">
            <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
            <div className="relative" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
                <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    spaceBetween={20}
                    slidesPerView={5}
                    navigation={{
                        nextEl: '.custom-next',
                        prevEl: '.custom-prev',
                    }}
                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                    pagination={{ clickable: true }}
                    breakpoints={{
                        1024: { slidesPerView: 5 },
                        768: { slidesPerView: 3 },
                        480: { slidesPerView: 2 },
                        350: { slidesPerView: 2 },
                    }}
                >
                    {validMovies.length > 0 ? (
                        validMovies.map(({ movie_id, thumb_url, title, release_year }) => (
                            <SwiperSlide key={movie_id} onClick={() => handleClickToDetail(movie_id)}>
                                <div className="rounded-lg w-45 h-80 cursor-pointer border-2 bg-gray-500 overflow-hidden">
                                    <div className="relative w-full h-full group overflow-hidden min-w-[200px]">
                                        <img
                                            src={thumb_url}
                                            alt={title}
                                            className="rounded-lg w-full h-full object-fill transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black to-transparent text-white text-center" style={{ height: '40%' }}>
                                            <h3 className="text-lg mt-2">{title}</h3>
                                            <h3 className="font-bold">{release_year}</h3>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))
                    ) : (
                        <SwiperSlide>
                            <div className="flex items-center justify-center h-80 text-white">No movies available</div>
                        </SwiperSlide>
                    )}
                </Swiper>
                <button
                    className="custom-prev absolute left-0 top-1/2 transform -translate-y-1/2 p-3 z-10 text-blue-600 text-2xl lg:bg-gray-200 rounded-full"
                    aria-label="Previous"
                    type="button"
                >
                    <FaChevronLeft />
                </button>
                <button
                    className="custom-next absolute right-0 top-1/2 transform -translate-y-1/2 lg:bg-gray-200 p-3 text-2xl rounded-full z-10 text-blue-600"
                    aria-label="Next"
                    type="button"
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}

export default HorizontalMovies;
