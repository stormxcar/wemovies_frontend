import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import ShowMovies from './components/ShowMovies';
import DetailMovie from './components/DetailMovie';
import CategoryMovies from './components/CategoryMovies';
import Header from './components/Header';
// import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Search from './components/Search';
import EpisodeDetail from './components/EpisodeDetail';
import MovieList from './components/MovieList';
import Watch from './components/Watch';
import MoviePage from './components/MoviePage';

function App() {
    return (
        <Router>
            <div className="flex flex-col items-center justify-center w-full">
                <Header />
                {/* <Navbar /> */}
                <Routes>
                    <Route path="/" element={<ShowMovies />} />
                    <Route path="/category/:categoryName" element={<CategoryMovies />} />
                    <Route path="/movie/:id" element={<DetailMovie />} />
                    <Route path="/movie/:id/episode/:episodeIndex" element={<EpisodeDetail />} />
                    <Route path="/movies/:categoryName" element={<CategoryMovies />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/allmovies" element={<MovieList />} />
                    <Route path="/allmovies/:categoryName" element={<MovieList />} />
                    <Route path="/movie/watch/:id" element={<Watch />} />
                    <Route path="/moviepage" element={<MoviePage />} />
                </Routes>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
