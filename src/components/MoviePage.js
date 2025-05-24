import React from 'react';
import MovieList from './MovieList';

function MoviePage() {
  // Mock data for different filters (replace with API calls)
  const moviesByCategory = [
    { movie_id: 1, thumb_url: 'https://picsum.photos/200/300', title: 'Franklin', release_year: '2025' },
    { movie_id: 2, thumb_url: 'https://picsum.photos/200/301', title: 'Ngủ Yên Lenh', release_year: '2025' },
    { movie_id: 3, thumb_url: 'https://picsum.photos/200/302', title: 'Ngươi Murderbot', release_year: '2025' },
    { movie_id: 4, thumb_url: 'https://picsum.photos/200/303', title: 'Snakes and Ladders', release_year: '2025' },
    { movie_id: 5, thumb_url: 'https://picsum.photos/200/305', title: 'Tom Segura: Bad Thoughts', release_year: '2025' },
    { movie_id: 6, thumb_url: 'https://picsum.photos/200/307', title: 'Nhân Sinh Giông Nhữ Thủy', release_year: '2025' },
    { movie_id: 7, thumb_url: 'https://picsum.photos/200/306', title: 'Ba Lần Gặp Chợ Ma Quán', release_year: '2025' },
    { movie_id: 8, thumb_url: 'https://picsum.photos/200/302', title: 'My Ví Dường', release_year: '2025' },
  ];

  const moviesByActor = [
    { movie_id: 9, thumb_url: 'https://via.placeholder.com/150', title: 'Actor Movie 1', release_year: '2024' },
    { movie_id: 10, thumb_url: 'https://via.placeholder.com/150', title: 'Actor Movie 2', release_year: '2024' },
  ];

  const moviesByCountry = [
    { movie_id: 11, thumb_url: 'https://via.placeholder.com/150', title: 'Country Movie 1', release_year: '2023' },
    { movie_id: 12, thumb_url: 'https://via.placeholder.com/150', title: 'Country Movie 2', release_year: '2023' },
  ];

  const handleMovieClick = (movieId) => {
    console.log(`Navigating to movie with ID: ${movieId}`);
    // Add navigation logic here
  };

  return (
    <div className="bg-gray-900 w-full h-100% flex flex-col text-white pt-28 px-4 pb-8">
      {/* Movies by Category */}
      <MovieList
        movies={moviesByCategory}
        title="Movies by Category: Drama"
        onMovieClick={handleMovieClick}
      />
     
    </div>
  );
}

export default MoviePage;