import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "@toast";
import { toast } from "@toast";
import "goey-toast/styles.css";
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
const MoviePage = lazy(() => import("./components/ShowMovies.jsx"));
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
import {
  createAdminUser,
  fetchJson,
  normalizeMoviesPageResponse,
  setAdminUserLockStatus,
} from "./services/api";

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

const WatchLegacyRedirect = () => {
  const { identifier } = useParams();
  const location = useLocation();
  const encodedIdentifier = encodeURIComponent(identifier || "");

  return (
    <Navigate
      to={`/movie/watch/${encodedIdentifier}${location.search || ""}`}
      replace
      state={location.state}
    />
  );
};

const AppContent = () => {
  const queryClient = useQueryClient();
  const { pageLoading, pageLoadingMessage, showPageLoading, hidePageLoading } =
    useLoading();

  const [adminMoviesQuery, setAdminMoviesQuery] = useState({
    page: 1,
    size: 10,
    sortField: "createdAt",
    sortDirection: "desc",
    search: "",
    filters: {},
  });
  const [adminMoviesLoadingAction, setAdminMoviesLoadingAction] =
    useState(null);

  const normalizeAdminMoviesQuery = useCallback((query) => {
    const page = Number.isFinite(Number(query?.page))
      ? Math.max(1, Number(query.page))
      : 1;
    const size = Number.isFinite(Number(query?.size))
      ? Math.max(1, Number(query.size))
      : 10;
    const sortDirection = query?.sortDirection === "asc" ? "asc" : "desc";
    const sortField =
      typeof query?.sortField === "string" && query.sortField.trim()
        ? query.sortField
        : "createdAt";
    const search = typeof query?.search === "string" ? query.search : "";
    const filters =
      query?.filters && typeof query.filters === "object" ? query.filters : {};

    return {
      page,
      size,
      sortField,
      sortDirection,
      search,
      filters,
    };
  }, []);

  const resolveAdminSortBy = useCallback((sortField) => {
    const sortMap = {
      title: "title",
      release_year: "release_year",
      views: "views",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      duration: "duration",
      hot: "hot",
    };

    return sortMap[sortField] || "createdAt";
  }, []);

  const buildMoviesListEndpoint = useCallback(
    (query, countriesList = []) => {
      const normalized = normalizeAdminMoviesQuery(query);
      const page0 = normalized.page - 1;
      const queryString = new URLSearchParams({
        page: String(page0),
        size: String(normalized.size),
        sortBy: resolveAdminSortBy(normalized.sortField),
        sortDir: normalized.sortDirection,
      });

      const keyword = normalized.search.trim();
      const countryId = normalized.filters?.["country.name"];
      const movieTypeName = normalized.filters?.movieTypes;
      const categoryName = normalized.filters?.movieCategories;

      if (keyword) {
        queryString.set("keyword", keyword);
        return `/api/movies/search?${queryString.toString()}`;
      }

      if (countryId && categoryName) {
        const countryName = countriesList.find(
          (country) => String(country.id) === String(countryId),
        )?.name;

        if (countryName) {
          return `/api/movies/country/${encodeURIComponent(countryName)}/category/${encodeURIComponent(categoryName)}?${queryString.toString()}`;
        }
      }

      if (categoryName) {
        return `/api/movies/category/${encodeURIComponent(categoryName)}?${queryString.toString()}`;
      }

      if (movieTypeName) {
        return `/api/movies/type/${encodeURIComponent(movieTypeName)}?${queryString.toString()}`;
      }

      if (countryId) {
        return `/api/movies/country/${encodeURIComponent(countryId)}?${queryString.toString()}`;
      }

      return `/api/movies?${queryString.toString()}`;
    },
    [normalizeAdminMoviesQuery, resolveAdminSortBy],
  );

  const fetchAdminMoviesPage = useCallback(
    async (query, countriesList = []) => {
      const normalized = normalizeAdminMoviesQuery(query);
      const endpoint = buildMoviesListEndpoint(normalized, countriesList);
      const response = await fetchJson(endpoint);
      return normalizeMoviesPageResponse(response, {
        page: normalized.page - 1,
        size: normalized.size,
      });
    },
    [buildMoviesListEndpoint, normalizeAdminMoviesQuery],
  );

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
    data: adminMoviesPage,
    isLoading: adminMoviesLoading,
    isFetching: adminMoviesFetching,
    refetch: refetchAdminMovies,
  } = useQuery({
    queryKey: ["admin-movies-list", adminMoviesQuery, countries],
    queryFn: () => fetchAdminMoviesPage(adminMoviesQuery, countries),
    staleTime: 10 * 1000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!adminMoviesFetching) {
      setAdminMoviesLoadingAction(null);
    }
  }, [adminMoviesFetching]);

  useEffect(() => {
    if (!adminMoviesPage?.hasNext) return;

    const nextQuery = normalizeAdminMoviesQuery({
      ...adminMoviesQuery,
      page: Number(adminMoviesQuery.page || 1) + 1,
    });

    queryClient.prefetchQuery({
      queryKey: ["admin-movies-list", nextQuery, countries],
      queryFn: () => fetchAdminMoviesPage(nextQuery, countries),
      staleTime: 10 * 1000,
    });
  }, [
    adminMoviesPage,
    adminMoviesQuery,
    countries,
    fetchAdminMoviesPage,
    normalizeAdminMoviesQuery,
    queryClient,
  ]);
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
      await refetchAdminMovies();
      await refetchMovies();
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
    refetchAdminMovies();
    refetchMovies();
  };

  const handleUpdateMovie = (data) => {
    // This will be handled by the mutation in UpdateMovie component
    refetchAdminMovies();
    refetchMovies();
  };

  const handleAdminMoviesQueryChange = useCallback(
    (nextPartial, action = null) => {
      if (action) {
        setAdminMoviesLoadingAction(action);
      }

      setAdminMoviesQuery((prev) => {
        const merged = {
          ...prev,
          ...nextPartial,
          filters: {
            ...(prev.filters || {}),
            ...((nextPartial && nextPartial.filters) || {}),
          },
        };

        return normalizeAdminMoviesQuery(merged);
      });
    },
    [normalizeAdminMoviesQuery],
  );
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

  const handleCreateUserByAdmin = async (userPayload) => {
    const createdUser = await createAdminUser(userPayload);
    await refetchUsers();
    return createdUser;
  };

  const handleToggleUserLock = async (userId, locked) => {
    const updatedUser = await setAdminUserLockStatus(userId, locked);
    await refetchUsers();
    return updatedUser;
  };

  const handleUpdateUser = (data) => {
    // This will be handled by the mutation in Update component
    refetchUsers();
  };

  const movieDisplayFields = [
    { key: "id", label: "ID" },
    {
      key: "thumb_url",
      label: "Thumbnail",
      render: (thumbUrl) => (
        <img
          src={thumbUrl || "/placeholder-professional.svg"}
          alt="thumb"
          className="w-12 h-16 object-cover rounded"
        />
      ),
    },
    { key: "title", label: "Tên phim" },
    { key: "release_year", label: "Năm phát hành" },
    {
      key: "views",
      label: "Lượt xem",
      render: (value) => Number(value || 0).toLocaleString(),
    },
    {
      key: "country.name",
      label: "Quốc gia",
      filterType: "select",
      filterOptions: countries.map((country) => ({
        value: country.id,
        label: country.name,
      })),
      filterFn: (item, value) =>
        String(item?.country?.id || "")
          .toLowerCase()
          .includes(String(value || "").toLowerCase()),
    },
    {
      key: "movieTypes",
      label: "Loại phim",
      render: (item) =>
        Array.isArray(item) ? item.map((type) => type.name).join(", ") : "N/A",
      filterType: "select",
      filterOptions: types.map((type) => ({
        value: type.name,
        label: type.name,
      })),
      filterFn: (item, value) =>
        Array.isArray(item?.movieTypes)
          ? item.movieTypes.some(
              (type) =>
                String(type?.name || "").toLowerCase() ===
                String(value || "").toLowerCase(),
            )
          : false,
    },
    {
      key: "movieCategories",
      label: "Danh mục",
      render: (item) =>
        Array.isArray(item) ? item.map((cat) => cat.name).join(", ") : "N/A",
      filterType: "select",
      filterOptions: categories.map((category) => ({
        value: category.name,
        label: category.name,
      })),
      filterFn: (item, value) =>
        Array.isArray(item?.movieCategories)
          ? item.movieCategories.some(
              (category) =>
                String(category?.name || "").toLowerCase() ===
                String(value || "").toLowerCase(),
            )
          : false,
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
    {
      key: "role",
      label: "Vai trò",
      render: (role) => role?.roleName || "USER",
      filterType: "select",
      filterOptions: [
        { value: "ADMIN", label: "ADMIN" },
        { value: "USER", label: "USER" },
      ],
      filterFn: (item, value) =>
        String(item?.role?.roleName || "USER")
          .toLowerCase()
          .includes(String(value || "").toLowerCase()),
    },
    {
      key: "isActive",
      label: "Trạng thái",
      render: (isActive) =>
        isActive === false ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">
            Đã khóa
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
            Hoạt động
          </span>
        ),
      filterType: "select",
      filterOptions: [
        { value: "active", label: "Hoạt động" },
        { value: "locked", label: "Đã khóa" },
      ],
      filterFn: (item, value) => {
        if (value === "active") return item?.isActive !== false;
        if (value === "locked") return item?.isActive === false;
        return true;
      },
    },
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
            <Route path="/movie/:identifier" element={<DetailMovie />} />
            <Route
              path="/movie/:identifier/episode/:episodeIndex"
              element={<EpisodeDetail />}
            />
            <Route path="/movies/:categoryName" element={<MovieList />} />
            <Route path="/movies/:countryName" element={<MovieList />} />
            <Route path="/search" element={<Search />} />
            <Route path="/allmovies" element={<MovieList />} />
            <Route path="/allmovies/:categoryName" element={<MovieList />} />
            <Route
              path="/watch/:identifier"
              element={<WatchLegacyRedirect />}
            />
            <Route path="/movie/watch/:identifier" element={<Watch />} />
            <Route
              path="/movie/:identifier/episode/:episodeIndex"
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
                  items={adminMoviesPage?.items || []}
                  onEdit={handleEditMovie}
                  onDelete={handleDeleteMovie}
                  onViewDetails={(id) => navigate(`/admin/movies/${id}`)}
                  onRefresh={refetchAdminMovies}
                  searchFields={[
                    "title",
                    "country.name",
                    "movieTypes",
                    "movieCategories",
                  ]}
                  displayFields={movieDisplayFields}
                  keyField="id"
                  isLoading={adminMoviesLoading || adminMoviesFetching}
                  serverMode
                  serverMeta={{
                    page: Number(adminMoviesPage?.page || 0) + 1,
                    size: Number(adminMoviesPage?.size || 10),
                    totalItems: Number(adminMoviesPage?.totalItems || 0),
                    totalPages: Number(adminMoviesPage?.totalPages || 0),
                  }}
                  serverQuery={adminMoviesQuery}
                  onServerQueryChange={handleAdminMoviesQueryChange}
                  serverLoadingAction={adminMoviesLoadingAction}
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
                  searchFields={["userName", "email"]}
                  displayFields={userDisplayFields}
                  keyField="id"
                  isLoading={usersLoading}
                  onCreateUser={handleCreateUserByAdmin}
                  onToggleUserLock={handleToggleUserLock}
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
        position="bottom-right"
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
