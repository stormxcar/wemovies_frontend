import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const tabs = [
    { id: "profile", name: t("profile.tabs.profile") },
    { id: "watchlist", name: t("profile.tabs.watchlist") },
    { id: "watch-later", name: t("profile.tabs.watch_later") },
    { id: "continue-watching", name: t("profile.tabs.continue_watching") },
    { id: "notifications", name: t("profile.tabs.notifications") },
    { id: "settings", name: t("profile.tabs.settings") },
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
    <div className={`min-h-screen ${themeClasses.primary} py-5 sm:py-8`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        {/* Header */}
        <div
          className={`${themeClasses.card} rounded-lg shadow-xl p-4 sm:p-6 mb-5 sm:mb-6`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-4 md:mb-0 min-w-0">
              <div className="relative">
                <img
                  src={user?.avatarUrl || "/placeholder-professional.svg"}
                  alt="Avatar"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-500 shadow-lg"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 ${themeClasses.secondary} rounded-full`}
                ></div>
              </div>
              <div className="text-white min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold mb-1 line-clamp-1">
                  {user?.fullName || t("profilePage.default_user")}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-300">
                  <span className="px-2 py-1 bg-orange-600 text-xs font-semibold rounded-full">
                    {user?.role?.roleName || "User"}
                  </span>
                  <span className="text-sm">
                    {t("profilePage.member_since", {
                      year: new Date().getFullYear(),
                    })}
                  </span>
                </div>
                {user?.email && (
                  <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                )}
              </div>
            </div>

            {/* Current tab indicator */}
            <div className="text-left md:text-right">
              <p className="text-gray-400 text-sm mb-1">
                {t("profilePage.currently_viewing")}
              </p>
              <div className="text-white">
                <span className="text-lg font-semibold">
                  {tabs.find((tab) => tab.id === activeTab)?.name ||
                    t("profile.tabs.profile")}
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
                {t("profilePage.navigation")}
              </h2>
              <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 hide-scrollbar">
                {tabs.map((tab) => (
                  <li key={tab.id} className="min-w-[165px] lg:min-w-0">
                    <button
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-orange-600 text-white shadow-lg border-l-4 border-orange-400"
                          : `${themeClasses.textSecondary} hover:${themeClasses.tertiary} hover:${themeClasses.textPrimary}`
                      }`}
                    >
                      <span className="font-medium text-left whitespace-nowrap">
                        {tab.name}
                      </span>
                      {activeTab === tab.id && (
                        <span className="ml-auto text-orange-200 text-[10px] sm:text-xs font-semibold uppercase">
                          {t("profilePage.active")}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div
              className={`${themeClasses.card} rounded-lg shadow-xl p-4 sm:p-6 min-h-[420px] sm:min-h-[500px]`}
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
