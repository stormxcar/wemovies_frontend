import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import {FaChevronLeft, FaChevronRight} from 'react-icons/fa'

function HorizontalMovies({ title, movies }) {
    const navigate = useNavigate();
    const validMovies = Array.isArray(movies) ? movies : [];

    const handleClickToDetail = (movieID) => {
        navigate(`/movie/${movieID}`);
    };

    return (
        <div className="my-6 py-5 overflow-hidden">
            <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
            <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={20}
                slidesPerView={5}
                navigation={{
                    nextEl: '.custom-next',
                    prevEl: '.custom-prev',
                }}

                autoplay={{ delay: 3000, disableOnInteraction: false }}
                className="relative"
                pagination={{clickable: true}}
                style={{width: '100%', maxWidth: '1400px', margin: '0 auto'}}
                breakpoints={{
                    1024: {slidesPerView: 5},
                    768: {slidesPerView: 3},
                    480: {slidesPerView: 2},
                    350: {slidesPerView: 2},
                }}
            >
                {validMovies.length > 0 ? (
                    validMovies.map((movie) => (
                        <SwiperSlide key={movie.movie_id} onClick={() => handleClickToDetail(movie.movie_id)}>
                            <div className="rounded-lg w-45 h-80 cursor-pointer border-2 bg-gray-500 overflow-hidden">
                                <div className="relative w-full h-[100%] group overflow-hidden min-w-[200px]">
                                    <img
                                        src={movie.thumb_url}
                                        alt={movie.title}
                                        className="rounded-lg w-full h-full object-fill transition-transform group-hover:scale-105"
                                    />
                                    <div
                                        className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black to-transparent text-white text-center"
                                        style={{height: '40%'}}>
                                        <h3 className="text-lg mt-2">{movie.title}</h3>
                                        <h3 className="font-bold">{movie.release_year}</h3>
                                    </div>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))
                ) : (
                    <p>No movies available</p>
                )}
                <button
                    className="custom-prev absolute left-0] top-1/2 transform -translate-y-1/2 p-2 z-10 text-blue-600 p-3 text-2xl lg:bg-gray-200 rounded-full">
                    <FaChevronLeft/>
                </button>
                <button
                    className="custom-next absolute right-0 top-1/2 transform -translate-y-1/2 lg:bg-gray-200 p-3 text-2xl rounded-full z-10 text-blue-600">
                    <FaChevronRight/>
                </button>
            </Swiper>
        </div>
    );
}

export default HorizontalMovies;
