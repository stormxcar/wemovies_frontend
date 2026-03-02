import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useLoading } from "../../context/UnifiedLoadingContext";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import {
  fetchCategories as getCategories,
  fetchMovies as getMovies,
  fetchUsers as getUsers,
  fetchCountries as getCountries,
  fetchMovieType as getTypes,
  fetchAdminReportDashboard,
} from "../../services/api";

// Icons components (you can replace with react-icons if available)
const StatsCard = ({ title, value, icon, color, link, description, trend }) => (
  <Link
    to={link}
    className={`${color} p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-white`}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold opacity-90">{title}</h3>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <p className="text-sm opacity-75 mt-1">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  </Link>
);

const QuickAction = ({ title, icon, link, color }) => (
  <Link
    to={link}
    className={`${color} p-4 rounded-lg text-white hover:shadow-lg transition-all duration-300 flex items-center space-x-3`}
  >
    <span className="text-2xl">{icon}</span>
    <span className="font-medium">{title}</span>
  </Link>
);

// Home Component
const Home = () => {
  const { themeClasses } = useTheme();
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [types, setTypes] = useState([]);
  const [reportStats, setReportStats] = useState(null);
  const [error, setError] = useState(null);
  const { setLoading } = useLoading();

  // Set document title for admin dashboard
  useDocumentTitle("Bảng điều khiển", "Admin");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          categoriesData,
          moviesData,
          usersData,
          countriesData,
          typesData,
          reportData,
        ] = await Promise.all([
          getCategories(),
          getMovies(),
          getUsers(),
          getCountries(),
          getTypes(),
          fetchAdminReportDashboard(),
        ]);

        setCategories(categoriesData || []);
        setMovies(moviesData || []);
        setUsers(usersData || []);
        setCountries(countriesData || []);
        setTypes(typesData || []);
        setReportStats(reportData);
      } catch (error) {
        setError("Không thể tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setLoading]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Calculate some analytics
  const recentMovies = movies.filter((movie) => {
    const movieDate = new Date(movie.createdAt || movie.releaseDate);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return movieDate > thirtyDaysAgo;
  }).length;

  const activeUsers = users.filter((user) => user.isActive).length;
  const adminUsers = users.filter(
    (user) => user.role?.roleName === "ADMIN",
  ).length;

  const dashboardMetrics = {
    totalMovies:
      reportStats?.totalMovies ?? reportStats?.moviesCount ?? movies.length,
    totalUsers:
      reportStats?.totalUsers ?? reportStats?.usersCount ?? users.length,
    totalCategories:
      reportStats?.totalCategories ??
      reportStats?.categoriesCount ??
      categories.length,
    totalCountries:
      reportStats?.totalCountries ??
      reportStats?.countriesCount ??
      countries.length,
    recentMovies:
      reportStats?.recentMovies ??
      reportStats?.newMoviesLast30Days ??
      recentMovies,
    activeUsers:
      reportStats?.activeUsers ?? reportStats?.activeUsersCount ?? activeUsers,
    adminUsers:
      reportStats?.adminUsers ?? reportStats?.adminUsersCount ?? adminUsers,
  };

  return (
    <div className={`min-h-screen ${themeClasses.primary}`}>
      {/* Header */}
      <div className={`${themeClasses.card} shadow-sm border-b`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${themeClasses.textPrimary}`}>
                Dashboard Quản Trị
              </h1>
              <p className={`${themeClasses.textSecondary} mt-1`}>
                Chào mừng đến với hệ thống quản lý WeMovies
              </p>
            </div>
            <div className={`text-sm ${themeClasses.textMuted}`}>
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tổng Phim"
            value={dashboardMetrics.totalMovies.toLocaleString()}
            icon="🎬"
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            link="/admin/movies"
            description="Tổng số phim trong hệ thống"
            trend={
              dashboardMetrics.recentMovies > 0
                ? `+${dashboardMetrics.recentMovies} phim mới (30 ngày)`
                : "Không có phim mới"
            }
          />

          <StatsCard
            title="Người Dùng"
            value={dashboardMetrics.totalUsers.toLocaleString()}
            icon="👥"
            color="bg-gradient-to-r from-green-500 to-green-600"
            link="/admin/users"
            description={`${dashboardMetrics.activeUsers} đang hoạt động`}
            trend={`${dashboardMetrics.adminUsers} quản trị viên`}
          />

          <StatsCard
            title="Danh Mục"
            value={dashboardMetrics.totalCategories.toLocaleString()}
            icon="📁"
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            link="/admin/categories"
            description="Thể loại phim"
            trend="Đã phân loại"
          />

          <StatsCard
            title="Quốc Gia"
            value={dashboardMetrics.totalCountries.toLocaleString()}
            icon="🌍"
            color="bg-gradient-to-r from-orange-500 to-orange-600"
            link="/admin/countries"
            description="Nguồn gốc phim"
            trend={`${types.length} định dạng`}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Thao Tác Nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickAction
              title="Thêm Phim Mới"
              icon="➕"
              link="/admin/movies/add"
              color="bg-gradient-to-r from-blue-500 to-blue-600"
            />
            <QuickAction
              title="Quản Lý Thể Loại"
              icon="🏷️"
              link="/admin/categories"
              color="bg-gradient-to-r from-purple-500 to-purple-600"
            />
            <QuickAction
              title="Xem Người Dùng"
              icon="👤"
              link="/admin/users"
              color="bg-gradient-to-r from-green-500 to-green-600"
            />
            <QuickAction
              title="Cài Đặt Hệ Thống"
              icon="⚙️"
              link="/admin/settings"
              color="bg-gradient-to-r from-gray-500 to-gray-600"
            />
          </div>
        </div>

        {/* Recent Activity & System Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Movies */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Phim Mới Nhất
            </h2>
            <div className="space-y-3">
              {movies.slice(0, 5).map((movie, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {movie.name || movie.title || `Phim ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {movie.year || movie.releaseDate || "Không xác định"}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Mới
                  </span>
                </div>
              ))}
              {movies.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Chưa có phim nào
                </p>
              )}
            </div>
          </div>

          {/* System Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Tổng Quan Hệ Thống
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Phim có sẵn</span>
                <span className="font-bold text-green-600">
                  {dashboardMetrics.totalMovies} phim
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Thể loại đa dạng</span>
                <span className="font-bold text-purple-600">
                  {dashboardMetrics.totalCategories} thể loại
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-700">Nguồn quốc gia</span>
                <span className="font-bold text-orange-600">
                  {dashboardMetrics.totalCountries} quốc gia
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Thống Kê Chi Tiết
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((movies.length / (categories.length || 1)) * 10) /
                  10}
              </div>
              <div className="text-sm text-gray-600">Phim/Thể loại</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(
                  (dashboardMetrics.activeUsers /
                    (dashboardMetrics.totalUsers || 1)) *
                    100,
                ) || 0}
                %
              </div>
              <div className="text-sm text-gray-600">Người dùng hoạt động</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {dashboardMetrics.recentMovies}
              </div>
              <div className="text-sm text-gray-600">Phim mới (30 ngày)</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {dashboardMetrics.adminUsers}
              </div>
              <div className="text-sm text-gray-600">Quản trị viên</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
