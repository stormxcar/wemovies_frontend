import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getWatchlist } from "../services/api";
import WatchlistTab from "../components/profile/WatchlistTab";
import ProfileTab from "../components/profile/ProfileTab";
import WatchingHistoryTab from "../components/profile/WatchingHistoryTab";
import SettingsTab from "../components/profile/SettingsTab";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === "watchlist") {
      loadWatchlist();
    }
  }, [activeTab]);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const data = await getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error("Error loading watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", name: "Thông tin cá nhân", icon: "👤" },
    { id: "watchlist", name: "Phim yêu thích", icon: "❤️" },
    { id: "watching", name: "Phim đang xem", icon: "📺" },
    { id: "settings", name: "Cài đặt", icon: "⚙️" },
  ];

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
      case "watching":
        return <WatchingHistoryTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={user?.avatarUrl || "https://via.placeholder.com/80"}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-4 border-blue-500"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.displayName || "Tên người dùng"}
              </h1>
              <p className="text-gray-600">{user?.role?.roleName || "User"}</p>
              <p className="text-sm text-gray-500">
                Thành viên từ {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
