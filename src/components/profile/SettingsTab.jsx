import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";
import { Settings, Bell, Shield, Palette, Globe, Download } from "lucide-react";
import { toast } from "react-toastify";

const SettingsTab = () => {
  const { logout } = useAuth();
  const { isDarkMode, setTheme, themeClasses } = useTheme();
  const { settings, updateSetting } = useSettings();

  const handleSettingChange = (key, value) => {
    if (key === 'darkMode') {
      setTheme(value);
      toast.success(value ? "Đã chuyển sang chế độ tối!" : "Đã chuyển sang chế độ sáng!");
      return;
    }
    
    updateSetting(key, value);
    
    // Special messages for certain settings
    if (key === 'autoPlay') {
      toast.success(value ? "Đã bật tự động phát video!" : "Đã tắt tự động phát video!");
    } else {
      toast.success("Cài đặt đã được cập nhật!");
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      await logout();
    }
  };

  const clearCache = () => {
    localStorage.clear();
    toast.success("Đã xóa cache!");
  };

  const handleSaveSettings = () => {
    toast.success("Cài đặt đã được lưu!");
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.",
    );
    if (confirmed) {
      toast.error("Chức năng xóa tài khoản đang được phát triển");
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <div className={`${themeClasses.cardSecondary} rounded-lg p-6`}>
        <h3 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6 flex items-center`}>
          <Bell className="mr-2 h-5 w-5" />
          Thông báo
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`${themeClasses.textPrimary} font-medium`}>Email thông báo</h4>
              <p className={`${themeClasses.textMuted} text-sm`}>Nhận thông báo qua email</p>
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
              <h4 className="text-white font-medium">Thông báo đẩy</h4>
              <p className="text-gray-400 text-sm">
                Nhận thông báo trên trình duyệt
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
              <h4 className="text-white font-medium">Gợi ý phim</h4>
              <p className="text-gray-400 text-sm">Nhận gợi ý phim phù hợp</p>
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
              <h4 className="text-white font-medium">Phim mới ra mắt</h4>
              <p className="text-gray-400 text-sm">Thông báo khi có phim mới</p>
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
        <h3 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6 flex items-center`}>
          <Palette className="mr-2 h-5 w-5" />
          Giao diện
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium">Chế độ tối</h4>
              <p className="text-gray-400 text-sm">Sử dụng giao diện tối</p>
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
            <h4 className={`${themeClasses.textPrimary} font-medium mb-2`}>Ngôn ngữ</h4>
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
        <h3 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6 flex items-center`}>
          <Settings className="mr-2 h-5 w-5" />
          Phát video
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`${themeClasses.textPrimary} font-medium`}>Tự động phát</h4>
              <p className={`${themeClasses.textMuted} text-sm`}>
                Tự động phát video khi tải trang (video sẽ bị tắt tiếng)
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
        <h3 className={`text-xl font-semibold ${themeClasses.textPrimary} mb-6 flex items-center`}>
          <Shield className="mr-2 h-5 w-5" />
          Quản lý tài khoản
        </h3>

        <div className="space-y-4">
          <button
            onClick={() => toast.info("Liên hệ admin để xóa tài khoản")}
            className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Shield className="mr-2 h-4 w-4" />
            Yêu cầu xóa tài khoản
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Đăng xuất
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
