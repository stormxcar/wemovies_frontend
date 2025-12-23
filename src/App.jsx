import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

import ShowMovies from "./components/ShowMovies.jsx";
import DetailMovie from "./components/DetailMovie.jsx";
import CategoryMovies from "./components/CategoryMovies.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Search from "./components/Search.jsx";
import EpisodeDetail from "./components/EpisodeDetail.jsx";
import MovieList from "./components/MovieList.jsx";
import Watch from "./components/Watch.jsx";
import MoviePage from "./components/MoviePage.jsx";
import Dashboard from "./admin/pages/Dashboard";
import Home from "./admin/pages/Home";
import List from "./admin/components/List";
import Add from "./admin/components/Add";
import Update from "./admin/components/Update";
import MovieDetail from "./admin/pages/movies/Detail";
import Settings from "./admin/pages/Settings";
import TypeList from "./admin/pages/types/TypeList";

import { getCategories } from "./admin/api/Category.api";
import { getCountries } from "./admin/api/Country.api";
import { getMovies } from "./admin/api/Movie.api";
import { getTypes } from "./admin/api/Type.api";
import { getUsers } from "./admin/api/User.api";

import ProtectedRoute from "./ProtectRoute";
import AddCategory from "./admin/pages/categories/AddCategory";
import AddCountry from "./admin/pages/countries/AddCountry";
import AddType from "./admin/pages/types/AddType";
import AddMovie from "./admin/pages/movies/AddMovie";
import UpdateMovie from "./admin/pages/movies/UpdateMovie";

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
  const location = useLocation();

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

  const movieDisplayFields = [
    { key: "id", label: "ID" },
    { key: "title", label: "Tên phim" },
    { key: "release_year", label: "Năm phát hành" },
    { key: "country.name", label: "Quốc gia" },
    {
      key: "movieTypes",
      label: "Loại phim",
      render: (item) => item.map((type) => type.name).join(", "),
    },
    {
      key: "movieCategories",
      label: "Danh mục",
      render: (item) => item.map((cat) => cat.name).join(", "),
    },
  ];

  const categoryDisplayFields = [
    { key: "id", label: "ID" },
    { key: "name", label: "Tên danh mục" },
  ];

  const categoryFields = [
    {
      name: "name",
      label: "Tên danh mục",
      type: "text",
      placeholder: "Nhập tên danh mục",
    },
  ];

  const countryDisplayFields = [
    { key: "id", label: "ID" },
    { key: "name", label: "Tên quốc gia" },
  ];
  const countryFields = [
    {
      name: "name",
      label: "Tên quốc gia",
      type: "text",
      placeholder: "Nhập tên quốc gia",
    },
  ];

  const userDisplayFields = [
    { key: "id", label: "ID" },
    { key: "userName", label: "Tên người dùng" },
    { key: "email", label: "Email" },
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const [
          moviesData,
          categoriesData,
          countriesData,
          typesData,
          usersData,
        ] = await Promise.all([
          getMovies(),
          getCategories(),
          getCountries(),
          getTypes(),
          getUsers(),
        ]);

        if (isMounted) {
          setMovies(Array.isArray(moviesData) ? moviesData : []);
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          setCountries(Array.isArray(countriesData) ? countriesData : []);
          setTypes(Array.isArray(typesData) ? typesData : []);
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (location.pathname.startsWith("/admin/")) {
          if (location.pathname === "/admin/categories") {
            const categoriesData = await getCategories();
            if (isMounted)
              setCategories(
                Array.isArray(categoriesData) ? categoriesData : []
              );
          } else if (location.pathname === "/admin/countries") {
            const countriesData = await getCountries();
            if (isMounted)
              setCountries(Array.isArray(countriesData) ? countriesData : []);
          } else if (location.pathname === "/admin/types") {
            const typesData = await getTypes();
            if (isMounted) setTypes(Array.isArray(typesData) ? typesData : []);
          } else if (location.pathname === "/admin/movies") {
            const moviesData = await getMovies();
            if (isMounted)
              setMovies(Array.isArray(moviesData) ? moviesData : []);
          } else if (location.pathname === "/admin/users") {
            const usersData = await getUsers();
            if (isMounted) setUsers(Array.isArray(usersData) ? usersData : []);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* User Routes */}
        {/* <Route path="/auth" element={<AuthPage />} /> */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<ShowMovies />} />
          <Route path="/category/:categoryName" element={<CategoryMovies />} />
          <Route path="/country/:countryName" element={<CategoryMovies />} />
          <Route path="/movie/:id" element={<DetailMovie />} />
          <Route
            path="/movie/:id/episode/:episodeIndex"
            element={<EpisodeDetail />}
          />
          <Route path="/movies/:categoryName" element={<MovieList />} />
          <Route path="/movies/:countryName" element={<MovieList />} />
          <Route path="/search" element={<Search />} />
          <Route path="/allmovies" element={<MovieList />} />
          <Route path="/allmovies/:categoryName" element={<MovieList />} />
          <Route path="/movie/watch/:id" element={<Watch />} />
          <Route path="/movie/:id/episode/:episodeIndex" element={<Watch />} />
          <Route path="/moviepage" element={<MoviePage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
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
            </ProtectedRoute>
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
                keyField="id"
              />
            }
          />
          <Route path="movies/add" element={<AddMovie />} />
          <Route
            path="movies/update"
            element={
              <UpdateMovie
                title="Phim"
                items={movies}
                updateEndpoint={`/api/movies/update`}
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
                keyField="id"
              />
            }
          />
          <Route path="categories/add" element={<AddCategory />} />
          <Route
            path="categories/update"
            element={
              <Update
                title="Danh mục"
                items={categories}
                fields={categoryFields}
                updateEndpoint={`${
                  import.meta.env.VITE_API_URL
                }/api/categories/update`}
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
                keyField="id"
              />
            }
          />
          <Route path="countries/add" element={<AddCountry />} />
          <Route
            path="countries/update"
            element={
              <Update
                title="Quốc gia"
                items={countries}
                fields={countryFields}
                updateEndpoint={`${
                  import.meta.env.VITE_API_URL
                }/api/countries/update`}
                onUpdate={handleUpdateCountry}
              />
            }
          />
          <Route
            path="types"
            element={
              <TypeList
                types={types}
                onEdit={handleEditType}
                onAdd={handleAddType}
              />
            }
          />
          <Route path="types/add" element={<AddType />} />
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
                keyField="id"
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
                updateEndpoint={`${
                  import.meta.env.VITE_API_URL
                }/api/users/update`}
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
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <MainApp />
      </GoogleOAuthProvider>
    </Router>
  );
}

export default App;
