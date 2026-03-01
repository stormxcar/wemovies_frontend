import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
import { LoadingProvider, useLoading } from "./context/UnifiedLoadingContext";
import { QueryProvider } from "./utils/queryClient";
import PageLoader from "./components/loading/PageLoader";
import "./components/loading/animations.css";

// Lazy load components
const HomePage = lazy(() => import("./pages/Home.jsx"));
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
const AdminProfile = lazy(() => import("./admin/pages/Profile"));
const Notifications = lazy(() => import("./admin/pages/Notifications"));

// Admin pages
const AddCategory = lazy(() => import("./admin/pages/categories/AddCategory"));
const AddCountry = lazy(() => import("./admin/pages/countries/AddCountry"));
const AddType = lazy(() => import("./admin/pages/types/AddType"));
const AddMovie = lazy(() => import("./admin/pages/movies/AddMovie"));
const UpdateMovie = lazy(() => import("./admin/pages/movies/UpdateMovie"));
// Removed VideoTest as it's been deleted

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
import CookieConsentBanner from "./components/CookieConsentBanner";

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

  const logDeleteError = (entityName, id, error) => {
    console.error(`[DELETE ${entityName}] failed`, {
      id,
      status: error?.response?.status,
      url: error?.config?.url,
      method: error?.config?.method,
      response: error?.response?.data,
      message: error?.message,
    });
  };

  const getDeleteErrorMessage = (error, fallbackMessage) =>
    error?.response?.data?.message ||
    error?.response?.data?.details ||
    error?.response?.data?.errorMessage ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage;

  const categoriesWithUsage = useMemo(() => {
    const usageMap = new Map();

    movies.forEach((movie) => {
      const categoryCollections = [
        movie?.movieCategories,
        movie?.categories,
      ].filter(Array.isArray);

      categoryCollections.forEach((collection) => {
        collection.forEach((categoryItem) => {
          const categoryId =
            categoryItem?.id ??
            categoryItem?.categoryId ??
            categoryItem?.movieCategoryId;

          if (!categoryId) return;

          if (!usageMap.has(String(categoryId))) {
            usageMap.set(String(categoryId), 0);
          }

          usageMap.set(
            String(categoryId),
            usageMap.get(String(categoryId)) + 1,
          );
        });
      });
    });

    return categories.map((category) => {
      const usageCount = usageMap.get(String(category.id)) || 0;

      return {
        ...category,
        usageCount,
      };
    });
  }, [categories, movies]);

  const countriesWithUsage = useMemo(() => {
    const usageMap = new Map();

    movies.forEach((movie) => {
      const countryId = movie?.country?.id ?? movie?.countryId;

      if (!countryId) return;

      if (!usageMap.has(String(countryId))) {
        usageMap.set(String(countryId), 0);
      }

      usageMap.set(String(countryId), usageMap.get(String(countryId)) + 1);
    });

    return countries.map((country) => ({
      ...country,
      usageCount: usageMap.get(String(country.id)) || 0,
    }));
  }, [countries, movies]);

  const navigate = useNavigate();
  const location = useLocation();

  const handleEditMovie = () => {
    navigate("/admin/movies/update");
  };

  const handleDeleteMovie = async (id) => {
    try {
      await deleteMovieMutation.mutateAsync(id);
    } catch (error) {
      // display server message and log
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Không thể xóa phim";
      console.error("[DELETE MOVIE] failed", {
        id,
        status: error?.response?.status,
        response: error?.response?.data,
        msg,
      });
      toast.error(msg);
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
    const categoryInUse = categoriesWithUsage.some(
      (categoryItem) =>
        String(categoryItem.id) === String(id) &&
        Number(categoryItem.usageCount) > 0,
    );

    if (categoryInUse) {
      toast.error("Không thể xóa danh mục vì đang được gán cho phim");
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(id);
      toast.success("Xóa danh mục thành công");
    } catch (error) {
      logDeleteError("Category", id, error);
      const serverMessage = getDeleteErrorMessage(
        error,
        "Không thể xóa danh mục",
      );
      toast.error(serverMessage);
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
    const countryInUse = countriesWithUsage.some(
      (countryItem) =>
        String(countryItem.id) === String(id) &&
        Number(countryItem.usageCount) > 0,
    );

    if (countryInUse) {
      toast.error("Không thể xóa quốc gia vì đang được gán cho phim");
      return;
    }

    try {
      await deleteCountryMutation.mutateAsync(id);
      toast.success("Xóa quốc gia thành công");
    } catch (error) {
      logDeleteError("Country", id, error);
      const serverMessage = getDeleteErrorMessage(
        error,
        "Không thể xóa quốc gia",
      );
      toast.error(serverMessage);
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
    } catch (error) {}
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
    { key: "slug", label: "Slug" },
    {
      key: "usageCount",
      label: "Đang dùng",
      render: (value) =>
        Number(value) > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-medium">
            {value} phim
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
            Chưa gán
          </span>
        ),
    },
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
    { key: "slug", label: "Slug" },
    {
      key: "usageCount",
      label: "Đang dùng",
      render: (value) =>
        Number(value) > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-medium">
            {value} phim
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
            Chưa gán
          </span>
        ),
    },
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
      <Suspense fallback={<LazyLoadingFallback />}>
        <Routes>
          {/* User Routes */}
          {/* <Route path="/auth" element={<AuthPage />} /> */}
          <Route element={<UserLayout />}>
            <Route path="/" element={<HomePage />} />
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
            <Route path="/watch/:id" element={<Watch />} />
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
            <Route
              path="/notifications"
              element={
                <AuthRoute>
                  <Navigate to="/profile?tab=notifications" replace />
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
                  items={categoriesWithUsage}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onRefresh={refetchCategories}
                  searchFields={["name", "slug"]}
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
                  items={countriesWithUsage}
                  onEdit={handleEditCountry}
                  onDelete={handleDeleteCountry}
                  onRefresh={refetchCountries}
                  searchFields={["name", "slug"]}
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
            <Route path="notifications" element={<Notifications />} />
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
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* 404 Route - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        limit={3}
        closeButton={true}
        toastStyle={{
          backgroundColor: "#1e293b",
          color: "#fff",
          border: "1px solid #475569",
        }}
      />

      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
    </>
  );
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <SettingsProvider>
          <AuthProvider>
            <LoadingProvider>
              <GoogleOAuthProvider
                clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
              >
                <QueryProvider>
                  <AppContent />
                </QueryProvider>
              </GoogleOAuthProvider>
            </LoadingProvider>
          </AuthProvider>
        </SettingsProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
