import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { getWatchlist, fetchJson } from "../services/api";
// import { trackUserAction } from "../services/analytics";
import WatchlistTab from "../components/profile/WatchlistTab";
import ProfileTab from "../components/profile/ProfileTab";
import WatchingHistoryTab from "../components/profile/WatchingHistoryTab";
import WatchLaterTab from "../components/profile/WatchLaterTab";
import NotificationTab from "../components/profile/NotificationTab";
import SettingsTab from "../components/profile/SettingsTab";

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { themeClasses } = useTheme();

  const tabs = [
    { id: "profile", name: "Thông tin cá nhân", icon: "👤" },
    { id: "watchlist", name: "Phim yêu thích", icon: "❤️" },
    { id: "watch-later", name: "Xem sau", icon: "⏰" },
    { id: "continue-watching", name: "Phim đang xem", icon: "📺" },
    { id: "notifications", name: "Thông báo", icon: "🔔" },
    { id: "settings", name: "Cài đặt", icon: "⚙️" },
  ];

  const isValidTab = (tabId) => {
    return tabs.some((tab) => tab.id === tabId);
  };

  // Get tab from URL parameters
  const urlParams = new URLSearchParams(location.search);

  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = urlParams.get("tab");

    if (urlTab && isValidTab(urlTab)) {
      return urlTab;
    }

    return "profile";
  });
  const [watchlist, setWatchlist] = useState([]);
  const [watchLaterMovies, setWatchLaterMovies] = useState([]);
  const [continueWatchingMovies, setContinueWatchingMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    if (!isValidTab(tabId)) {
      return;
    }

    setActiveTab(tabId);
    const newParams = new URLSearchParams();
    if (tabId !== "profile") {
      newParams.set("tab", tabId);
    }
    const newUrl = `/profile${
      newParams.toString() ? "?" + newParams.toString() : ""
    }`;

    navigate(newUrl, { replace: true });

    // Track tab navigation
  };

  // Sync activeTab with URL changes
  useEffect(() => {
    const urlTab = urlParams.get("tab") || "profile";
    if (isValidTab(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    } else if (!isValidTab(urlTab) && urlTab !== "profile") {
      navigate("/profile", { replace: true });
    }
  }, [location.search, navigate, activeTab, isValidTab]);

  useEffect(() => {
    if (activeTab === "watchlist") {
      loadWatchlist();
    } else if (activeTab === "watch-later") {
      loadWatchLater();
    } else if (activeTab === "continue-watching") {
      loadContinueWatching();
    }
  }, [activeTab]);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadWatchLater = async () => {
    setLoading(true);
    try {
      const data = await fetchJson("/api/schedules/watch-later");
      setWatchLaterMovies(data || []);
    } catch (error) {
      setWatchLaterMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContinueWatching = async () => {
    setLoading(true);
    try {
      const response = await fetchJson(
        `/api/hybrid-watching/watching-list/${user.id}`,
      );
      // Hybrid API returns array directly, not wrapped in object
      setContinueWatchingMovies(Array.isArray(response) ? response : []);
    } catch (error) {
      // Handle backend errors gracefully
      if (error.response?.status === 500) {
        setContinueWatchingMovies([]);
        return;
      }
      setContinueWatchingMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileTab />;
      case "watchlist":
        return (
          <WatchlistTab
            watchlist={watchlist}
            loading={loading}
            onRefresh={loadWatchlist}
          />
        );
      case "watch-later":
        return (
          <WatchLaterTab
            movies={watchLaterMovies}
            loading={loading}
            onRefresh={loadWatchLater}
          />
        );
      case "continue-watching":
        return (
          <WatchingHistoryTab
            movies={continueWatchingMovies}
            loading={loading}
            onRefresh={loadContinueWatching}
          />
        );
      case "notifications":
        return <NotificationTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.primary} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        {/* Header */}
        <div className={`${themeClasses.card} rounded-lg shadow-xl p-6 mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="relative">
                <img
                  src={user?.avatarUrl || "/placeholder-professional.svg"}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full border-4 border-blue-500 shadow-lg"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 ${themeClasses.secondary} rounded-full`}
                ></div>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-1">
                  {user?.displayName || "Tên người dùng"}
                </h1>
                <div className="flex items-center space-x-4 text-gray-300">
                  <span className="px-2 py-1 bg-blue-600 text-xs font-semibold rounded-full">
                    {user?.role?.roleName || "User"}
                  </span>
                  <span className="text-sm">
                    Thành viên từ {new Date().getFullYear()}
                  </span>
                </div>
                {user?.email && (
                  <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                )}
              </div>
            </div>

            {/* Current tab indicator */}
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">Đang xem</p>
              <div className="flex items-center space-x-2 text-white">
                <span className="text-2xl">
                  {tabs.find((tab) => tab.id === activeTab)?.icon}
                </span>
                <span className="text-lg font-semibold">
                  {tabs.find((tab) => tab.id === activeTab)?.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className={`${themeClasses.card} rounded-lg shadow-xl p-4`}>
              <h2 className="text-white font-semibold mb-4 text-lg">
                Điều hướng
              </h2>
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white shadow-lg transform scale-105 border-l-4 border-blue-400"
                          : `${themeClasses.textSecondary} hover:${themeClasses.tertiary} hover:${themeClasses.textPrimary} hover:scale-102`
                      }`}
                    >
                      <span
                        className={`text-xl ${
                          activeTab === tab.id
                            ? "animate-pulse"
                            : "group-hover:scale-110"
                        } transition-transform`}
                      >
                        {tab.icon}
                      </span>
                      <span className="font-medium">{tab.name}</span>
                      {activeTab === tab.id && (
                        <span className="ml-auto text-blue-300">●</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Quick Stats */}
            <div
              className={`mt-6 ${themeClasses.card} rounded-lg shadow-xl p-4`}
            >
              <h3 className="text-white font-semibold mb-3">Thống kê</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Phim yêu thích</span>
                  <span className="text-white font-medium">
                    {watchlist.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Đã xem</span>
                  <span className="text-white font-medium">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Đánh giá</span>
                  <span className="text-white font-medium">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div
              className={`${themeClasses.card} rounded-lg shadow-xl p-6 min-h-[500px]`}
            >
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
