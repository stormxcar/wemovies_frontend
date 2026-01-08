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
import { QueryProvider } from "./utils/queryClient";
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
const Profile = lazy(() => import("./pages/Profile.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

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

import {
  useMovies,
  useCategories,
  useCountries,
  useTypes,
  useUsers,
  useDeleteMovie,
  useDeleteCategory,
  useDeleteCountry,
  useDeleteType,
  useDeleteUser,
} from "./hooks/useAdminQueries";

import ProtectedRoute, { AuthRoute } from "./ProtectRoute";
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

  // Use TanStack Query hooks
  const {
    data: movies = [],
    isLoading: moviesLoading,
    refetch: refetchMovies,
  } = useMovies();
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();
  const {
    data: countries = [],
    isLoading: countriesLoading,
    refetch: refetchCountries,
  } = useCountries();
  const {
    data: types = [],
    isLoading: typesLoading,
    refetch: refetchTypes,
  } = useTypes();
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useUsers();

  // Delete mutations
  const deleteMovieMutation = useDeleteMovie();
  const deleteCategoryMutation = useDeleteCategory();
  const deleteCountryMutation = useDeleteCountry();
  const deleteTypeMutation = useDeleteType();
  const deleteUserMutation = useDeleteUser();

  const user = { username: "Admin", email: "admin@example.com" };

  const navigate = useNavigate();
  const location = useLocation();

  const handleEditMovie = () => {
    navigate("/admin/movies/update");
  };

  const handleDeleteMovie = async (id) => {
    try {
      await deleteMovieMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting movie:", error);
    }
  };

  const handleAddMovie = (data) => {
    // This will be handled by the mutation in AddMovie component
    refetchMovies();
  };

  const handleUpdateMovie = (data) => {
    // This will be handled by the mutation in UpdateMovie component
    refetchMovies();
  };
  const handleEditCategory = () => {
    navigate("/admin/categories/update");
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleAddCategory = (data) => {
    // This will be handled by the mutation in AddCategory component
    refetchCategories();
  };

  const handleUpdateCategory = (data) => {
    // This will be handled by the mutation in Update component
    refetchCategories();
  };
  const handleEditCountry = () => {
    navigate("/admin/countries/update");
  };

  const handleDeleteCountry = async (id) => {
    try {
      await deleteCountryMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting country:", error);
    }
  };

  const handleAddCountry = (data) => {
    // This will be handled by the mutation in AddCountry component
    refetchCountries();
  };

  const handleUpdateCountry = (data) => {
    // This will be handled by the mutation in Update component
    refetchCountries();
  };
  const handleEditType = (type) => {
    // This will be handled by TypeList component
    refetchTypes();
  };

  const handleAddType = (data) => {
    // This will be handled by the mutation in AddType component
    refetchTypes();
  };

  const handleEditUser = () => {
    navigate("/admin/users/update");
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUserMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleAddUser = (data) => {
    // This will be handled by the mutation in AddUser component
    refetchUsers();
  };

  const handleUpdateUser = (data) => {
    // This will be handled by the mutation in Update component
    refetchUsers();
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

  // Handle page loading on route changes
  useEffect(() => {
    showPageLoading("Đang chuyển trang...");
    const timer = setTimeout(() => {
      hidePageLoading();
    }, 300); // Quick transition for better UX

    return () => clearTimeout(timer);
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
            <Route
              path="/profile"
              element={
                <AuthRoute>
                  <Profile />
                </AuthRoute>
              }
            />
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
                  onRefresh={refetchMovies}
                  searchFields={["title", "category", "country"]}
                  displayFields={movieDisplayFields}
                  keyField="id"
                  isLoading={moviesLoading}
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
                  onRefresh={refetchCategories}
                  searchFields={["name"]}
                  displayFields={categoryDisplayFields}
                  keyField="id"
                  isLoading={categoriesLoading}
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
                  onRefresh={refetchCountries}
                  searchFields={["name"]}
                  displayFields={countryDisplayFields}
                  keyField="id"
                  isLoading={countriesLoading}
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
            <Route path="types" element={<TypeList />} />
            <Route path="types/add" element={<AddType />} />
            <Route
              path="users"
              element={
                <List
                  title="Người dùng"
                  items={users}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onRefresh={refetchUsers}
                  searchFields={["username", "email"]}
                  displayFields={userDisplayFields}
                  keyField="id"
                  isLoading={usersLoading}
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

          {/* 404 Route - must be last */}
          <Route path="*" element={<NotFound />} />
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
            <QueryProvider>
              <AppContent />
              <CookieConsentBanner />
            </QueryProvider>
          </GoogleOAuthProvider>
        </LoadingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
