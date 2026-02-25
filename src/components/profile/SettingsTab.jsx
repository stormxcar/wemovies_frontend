import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";
import { useTranslation } from "react-i18next";
import { Settings, Bell, Shield, Palette, Globe, Download } from "lucide-react";
import { toast } from "react-toastify";

const SettingsTab = () => {
  const { logout } = useAuth();
  const { isDarkMode, setTheme, themeClasses } = useTheme();
  const { settings, updateSetting } = useSettings();
  const { t } = useTranslation();

  const handleSettingChange = (key, value) => {
    if (key === "darkMode") {
      setTheme(value);
      toast.success(
        value
          ? t("settings.messages.dark_mode_on")
          : t("settings.messages.dark_mode_off"),
      );
      return;
    }

    updateSetting(key, value);

    // Special messages for certain settings
    if (key === "autoPlay") {
      toast.success(
        value
          ? t("settings.messages.autoplay_on")
          : t("settings.messages.autoplay_off"),
      );
    } else if (key === "language") {
      toast.success(t("settings.messages.language_changed"));
    } else {
      toast.success(t("settings.messages.updated"));
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t("settings.account.logout_confirm"))) {
      await logout();
    }
  };

  const clearCache = () => {
    localStorage.clear();
    toast.success(t("common.success"));
  };

  const handleSaveSettings = () => {
    toast.success(t("settings.messages.updated"));
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      t("settings.account.logout_confirm"), // Reusing this key for now
    );
    if (confirmed) {
      toast.error("Feature in development"); // Generic error message
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <div className={`${themeClasses.cardSecondary} rounded-lg p-6`}>
        <h3
          className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6 flex items-center`}
        >
          <Bell className="mr-2 h-5 w-5" />
          {t("settings.notifications.title")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`${themeClasses.textPrimary} font-medium`}>
                {t("settings.notifications.email_notifications")}
              </h4>
              <p className={`${themeClasses.textMuted} text-sm`}>
                {t("settings.notifications.email_description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  handleSettingChange("emailNotifications", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">
                {t("settings.notifications.push_notifications")}
              </h4>
              <p className="text-gray-400 text-sm">
                {t("settings.notifications.push_description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) =>
                  handleSettingChange("pushNotifications", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">
                {t("settings.notifications.movie_recommendations")}
              </h4>
              <p className="text-gray-400 text-sm">
                {t("settings.notifications.movie_description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.movieRecommendations}
                onChange={(e) =>
                  handleSettingChange("movieRecommendations", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">
                {t("settings.notifications.new_releases")}
              </h4>
              <p className="text-gray-400 text-sm">
                {t("settings.notifications.release_description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.newReleaseAlerts}
                onChange={(e) =>
                  handleSettingChange("newReleaseAlerts", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className={`${themeClasses.cardSecondary} rounded-lg p-6`}>
        <h3
          className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6 flex items-center`}
        >
          <Palette className="mr-2 h-5 w-5" />
          {t("settings.appearance.title")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">
                {t("settings.appearance.dark_mode")}
              </h4>
              <p className="text-gray-400 text-sm">
                {t("settings.appearance.dark_description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={(e) =>
                  handleSettingChange("darkMode", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <h4 className={`${themeClasses.textPrimary} font-medium mb-2`}>
              {t("settings.appearance.language")}
            </h4>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange("language", e.target.value)}
              className={`w-full px-3 py-2 ${themeClasses.secondary} border ${themeClasses.border} rounded-lg ${themeClasses.textPrimary} focus:ring-2 focus:ring-blue-500`}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
      </div>

      {/* Playback Settings */}
      <div className={`${themeClasses.cardSecondary} rounded-lg p-6`}>
        <h3
          className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6 flex items-center`}
        >
          <Settings className="mr-2 h-5 w-5" />
          {t("settings.playback.title")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`${themeClasses.textPrimary} font-medium`}>
                {t("settings.playback.auto_play")}
              </h4>
              <p className={`${themeClasses.textMuted} text-sm`}>
                {t("settings.playback.auto_play_description")}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) =>
                  handleSettingChange("autoPlay", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Account Management */}
      <div className={`${themeClasses.cardSecondary} rounded-lg p-6`}>
        <h3
          className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6 flex items-center`}
        >
          <Shield className="mr-2 h-5 w-5" />
          {t("settings.account.title")}
        </h3>

        <div className="space-y-4">
          <button
            onClick={() => toast.info("Contact admin to delete account")}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Shield className="mr-2 h-4 w-4" />
            {t("settings.account.delete_account")}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t("settings.account.logout")}
          </button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Lưu ý về quyền riêng tư:</strong> Tất cả cài đặt của bạn được
          lưu trữ an toàn và chỉ được sử dụng để cải thiện trải nghiệm của bạn.
          Chúng tôi không chia sẻ thông tin cá nhân với bên thứ ba.
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;
