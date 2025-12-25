import React, { useState, useEffect, lazy, Suspense } from "react";
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

import { AuthProvider } from "./context/AuthContext";
import { LoadingProvider, useLoading } from "./utils/LoadingContext";
import CookieConsentBanner from "./components/CookieConsentBanner";
import PageLoader from "./components/loading/PageLoader";
import "./components/loading/animations.css";

// Lazy load components
const ShowMovies = lazy(() => import("./components/ShowMovies.jsx"));
const DetailMovie = lazy(() => import("./components/DetailMovie.jsx"));
const CategoryMovies = lazy(() => import("./components/CategoryMovies.jsx"));
const Search = lazy(() => import("./components/Search.jsx"));
const EpisodeDetail = lazy(() => import("./components/EpisodeDetail.jsx"));
const MovieList = lazy(() => import("./components/MovieList.jsx"));
const Watch = lazy(() => import("./components/Watch.jsx"));
const MoviePage = lazy(() => import("./components/MoviePage.jsx"));

// Admin components
const Home = lazy(() => import("./admin/pages/Home"));
const List = lazy(() => import("./admin/components/List"));
const Add = lazy(() => import("./admin/components/Add"));
const Update = lazy(() => import("./admin/components/Update"));
const MovieDetail = lazy(() => import("./admin/pages/movies/Detail"));
const Settings = lazy(() => import("./admin/pages/Settings"));
const TypeList = lazy(() => import("./admin/pages/types/TypeList"));

// Admin pages
const AddCategory = lazy(() => import("./admin/pages/categories/AddCategory"));
const AddCountry = lazy(() => import("./admin/pages/countries/AddCountry"));
const AddType = lazy(() => import("./admin/pages/types/AddType"));
const AddMovie = lazy(() => import("./admin/pages/movies/AddMovie"));
const UpdateMovie = lazy(() => import("./admin/pages/movies/UpdateMovie"));

// API functions
import {
  fetchCategories as getCategories,
  fetchCountries as getCountries,
  fetchMovies as getMovies,
  fetchMovieType as getTypes,
  fetchUsers as getUsers,
} from "./services/api";

import ProtectedRoute from "./ProtectRoute";
import { UserLayout, AdminLayout } from "./layout";

// Loading component for lazy loading
const LazyLoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <PageLoader message="Đang tải component..." />
    </div>
  );
};

const AppContent = () => {
  const { pageLoading, pageLoadingMessage, showPageLoading, hidePageLoading } =
    useLoading();
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

  // Handle page loading on route changes
  useEffect(() => {
    showPageLoading("Đang chuyển trang...");
    const timer = setTimeout(() => {
      hidePageLoading();
    }, 300); // Quick transition for better UX

    return () => clearTimeout(timer);
  }, [location.pathname, showPageLoading, hidePageLoading]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        if (location.pathname.startsWith("/admin/")) {
          showPageLoading("Đang tải dữ liệu...");

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

          hidePageLoading();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        hidePageLoading();
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, showPageLoading, hidePageLoading]);

  return (
    <>
      {pageLoading && <PageLoader message={pageLoadingMessage} />}
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={<LazyLoadingFallback />}>
        <Routes>
          {/* User Routes */}
          {/* <Route path="/auth" element={<AuthPage />} /> */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<ShowMovies />} />
            <Route
              path="/category/:categoryName"
              element={<CategoryMovies />}
            />
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
            <Route
              path="/movie/:id/episode/:episodeIndex"
              element={<Watch />}
            />
            <Route path="/moviepage" element={<MoviePage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
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
      </Suspense>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LoadingProvider>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <AppContent />
            <CookieConsentBanner />
          </GoogleOAuthProvider>
        </LoadingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
