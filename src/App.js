import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ShowMovies from "./components/ShowMovies";
import DetailMovie from "./components/DetailMovie";
import CategoryMovies from "./components/CategoryMovies";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Search from "./components/Search";
import EpisodeDetail from "./components/EpisodeDetail";
import MovieList from "./components/MovieList";
import Watch from "./components/Watch";
import MoviePage from "./components/MoviePage";
import Dashboard from "./admin/Dashboard";
import Home from "./admin/Home";
import List from "./admin/List";
import Add from "./admin/Add";
import Update from "./admin/Update";
import MovieDetail from "./admin/Detail";
import Settings from "./admin/Settings";
import TypeList from "./admin/TypeList";

import { getCategories } from "./admin/api/Category.api";
import { getCountries } from "./admin/api/Country.api";
import { getMovies } from "./admin/api/Movie.api";
import { getTypes } from "./admin/api/Type.api";
import { getUsers } from "./admin/api/User.api";

const UserLayout = () => (
  <div className="flex flex-col items-center justify-center w-full min-h-screen">
    <Header />
    <Outlet />
    <Footer />
  </div>
);

const AdminLayout = ({
  movies,
  setMovies,
  categories,
  setCategories,
  countries,
  setCountries,
  types,
  setTypes,
  users,
  setUsers,
  user,
  handleEditMovie,
  handleDeleteMovie,
  handleAddMovie,
  handleUpdateMovie,
  handleEditCategory,
  handleDeleteCategory,
  handleAddCategory,
  handleUpdateCategory,
  handleEditCountry,
  handleDeleteCountry,
  handleAddCountry,
  handleUpdateCountry,
  handleEditType,
  handleAddType,
  handleEditUser,
  handleDeleteUser,
  handleAddUser,
  handleUpdateUser,
}) => (
  <Dashboard
    movies={movies}
    setMovies={setMovies}
    categories={categories}
    setCategories={setCategories}
    countries={countries}
    setCountries={setCountries}
    types={types}
    setTypes={setTypes}
    users={users}
    setUsers={setUsers}
    user={user}
    handleEditMovie={handleEditMovie}
    handleDeleteMovie={handleDeleteMovie}
    handleAddMovie={handleAddMovie}
    handleUpdateMovie={handleUpdateMovie}
    handleEditCategory={handleEditCategory}
    handleDeleteCategory={handleDeleteCategory}
    handleAddCategory={handleAddCategory}
    handleUpdateCategory={handleUpdateCategory}
    handleEditCountry={handleEditCountry}
    handleDeleteCountry={handleDeleteCountry}
    handleAddCountry={handleAddCountry}
    handleUpdateCountry={handleUpdateCountry}
    handleEditType={handleEditType}
    handleAddType={handleAddType}
    handleEditUser={handleEditUser}
    handleDeleteUser={handleDeleteUser}
    handleAddUser={handleAddUser}
    handleUpdateUser={handleUpdateUser}
  />
);

const MainApp = () => {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [types, setTypes] = useState([]);
  const [users, setUsers] = useState([]);

  const user = { username: "Admin", email: "admin@example.com" };

  const navigate = useNavigate();

  const handleEditMovie = () => {
    navigate("/admin/movies/update");
  };
  const handleDeleteMovie = (id) => {
    setMovies(movies.filter((movie) => movie.id !== id));
  };
  const handleAddMovie = (data) => {
    setMovies([...movies, { id: movies.length + 1, ...data }]);
  };
  const handleUpdateMovie = (data) => {
    setMovies(movies.map((movie) => (movie.id === data.id ? data : movie)));
  };
  const handleEditCategory = () => {
    navigate("/admin/categories/update");
  };
  const handleDeleteCategory = (id) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };
  const handleAddCategory = (data) => {
    setCategories([...categories, { id: categories.length + 1, ...data }]);
  };
  const handleUpdateCategory = (data) => {
    setCategories(categories.map((cat) => (cat.id === data.id ? data : cat)));
  };
  const handleEditCountry = () => {
    navigate("/admin/countries/update");
  };
  const handleDeleteCountry = (id) => {
    setCountries(countries.filter((country) => country.id !== id));
  };
  const handleAddCountry = (data) => {
    setCountries([...countries, { id: countries.length + 1, ...data }]);
  };
  const handleUpdateCountry = (data) => {
    setCountries(
      countries.map((country) => (country.id === data.id ? data : country))
    );
  };
  const handleEditType = (type) => {
    setTypes(types.map((t) => (t.id === type.id ? type : t)));
  };
  const handleAddType = (data) => {
    setTypes([...types, { id: types.length + 1, ...data }]);
  };
  const handleEditUser = () => {
    navigate("/admin/users/update");
  };
  const handleDeleteUser = (id) => {
    setUsers(users.filter((user) => user.id !== id));
  };
  const handleAddUser = (data) => {
    setUsers([...users, { id: users.length + 1, ...data }]);
  };
  const handleUpdateUser = (data) => {
    setUsers(users.map((user) => (user.id === data.id ? data : user)));
  };

  // Define display fields for each list type
  const movieDisplayFields = [
    { key: "movie_id", label: "ID" },
    { key: "title", label: "Tên phim" },
    { key: "release_year", label: "Năm phát hành" },
    { key: "country.name", label: "Quốc gia" },
    {
      key: "movieTypes",
      label: "Loại phim",
      render: (item) => item.map((type) => type.type_name).join(", "),
    },
    {
      key: "movieCategories",
      label: "Danh mục",
      render: (item) => item.map((cat) => cat.name).join(", "),
    },
  ];

  const categoryDisplayFields = [
    { key: "category_id", label: "ID" },
    { key: "name", label: "Tên danh mục" },
  ];

  const countryDisplayFields = [
    { key: "country_id", label: "ID" },
    { key: "name", label: "Tên quốc gia" },
  ];

  const userDisplayFields = [
    { key: "id", label: "ID" },
    { key: "userName", label: "Tên người dùng" },
    { key: "email", label: "Email" },
  ];

  useEffect(() => {
    try {
      const fetchData = async () => {
        const categoriesData = await getCategories();
        const countriesData = await getCountries();
        const moviesData = await getMovies();
        const typesData = await getTypes();
        const usersData = await getUsers();

        setCategories(categoriesData);
        setCountries(countriesData);
        setMovies(moviesData);
        setTypes(typesData);
        setUsers(usersData);

        

      };
      fetchData();
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* User Routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<ShowMovies />} />
          <Route path="/category/:categoryName" element={<CategoryMovies />} />
          <Route path="/movie/:id" element={<DetailMovie />} />
          <Route
            path="/movie/:id/episode/:episodeIndex"
            element={<EpisodeDetail />}
          />
          <Route path="/movies/:categoryName" element={<CategoryMovies />} />
          <Route path="/search" element={<Search />} />
          <Route path="/allmovies" element={<MovieList />} />
          <Route path="/allmovies/:categoryName" element={<MovieList />} />
          <Route path="/movie/watch/:id" element={<Watch />} />
          <Route path="/moviepage" element={<MoviePage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <AdminLayout
              movies={movies}
              setMovies={setMovies}
              categories={categories}
              setCategories={setCategories}
              countries={countries}
              setCountries={setCountries}
              types={types}
              setTypes={setTypes}
              users={users}
              setUsers={setUsers}
              user={user}
              handleEditMovie={handleEditMovie}
              handleDeleteMovie={handleDeleteMovie}
              handleAddMovie={handleAddMovie}
              handleUpdateMovie={handleUpdateMovie}
              handleEditCategory={handleEditCategory}
              handleDeleteCategory={handleDeleteCategory}
              handleAddCategory={handleAddCategory}
              handleUpdateCategory={handleUpdateCategory}
              handleEditCountry={handleEditCountry}
              handleDeleteCountry={handleDeleteCountry}
              handleAddCountry={handleAddCountry}
              handleUpdateCountry={handleUpdateCountry}
              handleEditType={handleEditType}
              handleAddType={handleAddType}
              handleEditUser={handleEditUser}
              handleDeleteUser={handleDeleteUser}
              handleAddUser={handleAddUser}
              handleUpdateUser={handleUpdateUser}
            />
          }
        >
          <Route index element={<Home />} />
          <Route
            path="movies"
            element={
              <List
                title="Phim"
                items={movies}
                onEdit={handleEditMovie}
                onDelete={handleDeleteMovie}
                onViewDetails={(id) => navigate(`/admin/movies/${id}`)}
                searchFields={["title", "category", "country"]}
                displayFields={movieDisplayFields}
                keyField="movie_id"
              />
            }
          />
          <Route
            path="movies/add"
            element={<Add title="Phim" onAdd={handleAddMovie} />}
          />
          <Route
            path="movies/update"
            element={
              <Update
                title="Phim"
                items={movies}
                onUpdate={handleUpdateMovie}
              />
            }
          />
          <Route path="movies/:id" element={<MovieDetail />} />
          <Route
            path="categories"
            element={
              <List
                title="Danh mục"
                items={categories}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                searchFields={["name"]}
                displayFields={categoryDisplayFields}
                keyField="category_id"
              />
            }
          />
          <Route
            path="categories/add"
            element={<Add title="Danh mục" onAdd={handleAddCategory} />}
          />
          <Route
            path="categories/update"
            element={
              <Update
                title="Danh mục"
                items={categories}
                onUpdate={handleUpdateCategory}
              />
            }
          />
          <Route
            path="countries"
            element={
              <List
                title="Quốc gia"
                items={countries}
                onEdit={handleEditCountry}
                onDelete={handleDeleteCountry}
                searchFields={["name"]}
                displayFields={countryDisplayFields}
                keyField="country_id"
              />
            }
          />
          <Route
            path="countries/add"
            element={<Add title="Quốc gia" onAdd={handleAddCountry} />}
          />
          <Route
            path="countries/update"
            element={<Update title="Quốc gia" items={countries} />}
          />
          <Route path="types" element={<TypeList types={types} />} />
          <Route
            path="types/add"
            element={<Add title="Loại phim" onAdd={handleAddType} />}
          />
          <Route
            path="users"
            element={
              <List
                title="Người dùng"
                items={users}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                searchFields={["username", "email"]}
                displayFields={userDisplayFields}
                keyField={"id"}
              />
            }
          />
          <Route
            path="users/add"
            element={<Add title="Người dùng" onAdd={handleAddUser} />}
          />
          <Route
            path="users/update"
            element={
              <Update
                title="Người dùng"
                items={users}
                onUpdate={handleUpdateUser}
              />
            }
          />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}

export default App;
