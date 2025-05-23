import React from 'react';
import ShowMovies from './components/ShowMovies';
import DetailMovie from './components/DetailMovie';
import CategoryMovies from './components/CategoryMovies';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Search from './components/Search';

import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import EpisodeDetail from "./components/EpisodeDetail";


function App() {
    return (
        <div className="flex items-center justify-center flex-col w-100%">
            <Router>
                <Header />
                <Navbar />
                <Routes>
                    <Route path="/" element={<ShowMovies />} />
                    <Route path="/category/:categoryName" element={<CategoryMovies/>} />
                    <Route path="/movie/:id" element={<DetailMovie />} /> {/* Chi tiết phim */}
                    <Route path="/movie/:id/episode/:episodeIndex" element={<EpisodeDetail />} /> {/* Chi tiết tập phim */}
                    <Route path="/movies/:categoryName" element={<CategoryMovies />} />
                    <Route path="/search" element={<Search />} />
                </Routes>
            </Router>
            <Footer />
        </div>
    );
}

export default App;
