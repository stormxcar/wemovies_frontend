import React, { useState, useEffect } from "react";
import {
  FaBell,
  FaFilter,
  FaCheck,
  FaTrash,
  FaSearch,
  FaEye,
} from "react-icons/fa";
import { fetchJson } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import NotificationService from "../services/NotificationService";
import Pagination from "../components/ui/pagination";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const pageSize = 20;

  // Notification types for filter
  const notificationTypes = [
    { value: "all", label: "Tất cả", icon: "📋" },
    { value: "NEW_EPISODE", label: "Tập mới", icon: "📺" },
    { value: "NEW_MOVIE", label: "Phim mới", icon: "🎬" },
    { value: "MOVIE_REMINDER", label: "Nhắc nhở", icon: "⏰" },
    { value: "RECOMMENDATION", label: "Gợi ý", icon: "🎯" },
    { value: "CONTINUE_WATCHING", label: "Tiếp tục xem", icon: "▶️" },
    { value: "SYSTEM", label: "Hệ thống", icon: "🔔" },
    { value: "PROMOTION", label: "Khuyến mãi", icon: "🎁" },
  ];

  // Helper function to get user ID
  const getUserId = () => {
    if (!user) return null;
    return user.id || user.email || user.username;
  };

  useEffect(() => {
    if (!user) return;

    loadNotifications();
    loadStats();
    connectToNotificationService();

    // Listen for new notifications
    const unsubscribeNewNotification = NotificationService.onNewNotification(
      handleNewNotification,
    );
    const unsubscribeUnreadCount = NotificationService.onUnreadCountUpdate(
      handleUnreadCountUpdate,
    );

    return () => {
      unsubscribeNewNotification();
      unsubscribeUnreadCount();
    };
  }, [currentPage, filter, typeFilter, searchTerm, user]);

  const connectToNotificationService = async () => {
    if (!user) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      setConnectionStatus("connecting");
      const userId = getUserId();
      if (userId) {
        await NotificationService.connect(userId, token);
        setConnectionStatus("connected");
      }
    } catch (error) {
      console.error("Failed to connect to notification service:", error);
      setConnectionStatus("disconnected");
    }
  };

  const handleNewNotification = (notification) => {
    // Only add if matches current filters
    const matchesFilter =
      filter === "all" || (filter === "unread" && !notification.isRead);
    const matchesTypeFilter =
      typeFilter === "all" || notification.type === typeFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase());

    if (matchesFilter && matchesTypeFilter && matchesSearch) {
      setNotifications((prev) => [{ ...notification, isNew: true }, ...prev]);
    }

    // Always update stats
    loadStats();
  };

  const handleUnreadCountUpdate = (count) => {
    setStats((prev) => ({
      ...prev,
      unread: count,
      read: prev.total - count,
    }));
  };

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [currentPage, filter, typeFilter, searchTerm]);

  const loadNotifications = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !user) return;

    try {
      setLoading(true);

      let url = `/api/notifications?page=${currentPage}&size=${pageSize}`;

      if (filter !== "all") {
        url += `&read=${filter === "read"}`;
      }
      if (typeFilter !== "all") {
        url += `&type=${typeFilter}`;
      }
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetchJson(url);
      const data = response.data || {};

      // Mark all loaded notifications as not new
      const processedNotifications = (data.content || []).map((notif) => ({
        ...notif,
        isNew: false,
      }));

      setNotifications(processedNotifications);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !user) return;

    try {
      // Get unread count
      const unreadResponse = await fetchJson("/api/notifications/unread-count");
      const unread = unreadResponse.data?.unreadCount || 0;

      // Get total count by fetching all notifications
      const totalResponse = await fetchJson(
        "/api/notifications?page=0&size=1000",
      );
      const total = totalResponse.data?.totalElements || 0;

      // Calculate read count
      const read = total - unread;

      setStats({
        total,
        unread,
        read: Math.max(0, read),
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      setStats({ total: 0, unread: 0, read: 0 });
    }
  };

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !user) return;

    try {
      await fetchJson(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? {
                ...notif,
                isRead: true,
                readAt: new Date().toISOString(),
                isNew: false,
              }
            : notif,
        ),
      );

      // Update stats
      loadStats();
      toast.success("Đã đánh dấu đã đọc");
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const markSelectedAsRead = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !user || selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetchJson(`/api/notifications/${id}/read`, { method: "PUT" }),
        ),
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          selectedIds.includes(notif.id)
            ? {
                ...notif,
                isRead: true,
                readAt: new Date().toISOString(),
                isNew: false,
              }
            : notif,
        ),
      );

      setSelectedIds([]);
      loadStats();
      toast.success(`Đã đánh dấu ${selectedIds.length} thông báo là đã đọc`);
    } catch (error) {
      console.error("Failed to mark selected as read:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const deleteSelected = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !user || selectedIds.length === 0) return;

    if (
      !window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} thông báo?`)
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetchJson(`/api/notifications/${id}`, { method: "DELETE" }),
        ),
      );

      // Remove from local state
      setNotifications((prev) =>
        prev.filter((notif) => !selectedIds.includes(notif.id)),
      );
      setSelectedIds([]);
      loadStats();
      toast.success(`Đã xóa ${selectedIds.length} thông báo`);
    } catch (error) {
      console.error("Failed to delete selected:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith("http")) {
        window.open(notification.actionUrl, "_blank");
      } else {
        window.location.href = notification.actionUrl;
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n.id));
    }
  };

  const formatTime = (sentAt) => {
    if (!sentAt) return "";

    const date = new Date(sentAt);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resetFilters = () => {
    setFilter("all");
    setTypeFilter("all");
    setSearchTerm("");
    setCurrentPage(0);
  };

  return (
    <div className="notifications-page pt-24 bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <FaBell className="text-3xl text-blue-500 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                Thông báo
                <span
                  className={`ml-3 text-sm ${
                    connectionStatus === "connected"
                      ? "text-green-500"
                      : connectionStatus === "connecting"
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                >
                  {connectionStatus === "connected"
                    ? "🟢 Live"
                    : connectionStatus === "connecting"
                      ? "🟡 Đang kết nối..."
                      : "🔴 Offline"}
                </span>
              </h1>
              <p className="text-gray-400 mt-1">
                Tổng cộng {totalElements} thông báo • {stats.unread} chưa đọc
                {connectionStatus === "connected" && (
                  <span className="ml-2 text-green-400">
                    • Cập nhật thời gian thực
                  </span>
                )}
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stats.total}
                </div>
                <div className="text-gray-400 text-sm">Tổng thông báo</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🔔</div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {stats.unread}
                </div>
                <div className="text-gray-400 text-sm">Chưa đọc</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {stats.read}
                </div>
                <div className="text-gray-400 text-sm">Đã đọc</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Trạng thái
              </label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả ({stats.total})</option>
                <option value="unread">Chưa đọc ({stats.unread})</option>
                <option value="read">Đã đọc ({stats.read})</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Loại thông báo
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {notificationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(0);
                  }}
                  placeholder="Tìm theo tiêu đề, nội dung..."
                  className="w-full bg-gray-700 text-white px-10 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                <FaFilter className="inline mr-2" />
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-blue-400">
                Đã chọn {selectedIds.length} thông báo
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={markSelectedAsRead}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <FaCheck className="inline mr-2" />
                  Đánh dấu đã đọc
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  <FaTrash className="inline mr-2" />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={
                  notifications.length > 0 &&
                  selectedIds.length === notifications.length
                }
                onChange={handleSelectAll}
                className="mr-4 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-300 font-medium">
                Thông báo ({notifications.length})
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="divide-y divide-gray-700">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin text-3xl mb-4">🔄</div>
                <p>Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-xl font-medium mb-2">
                  Không có thông báo nào
                </p>
                <p>Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.isRead;
                const isNew = notification.isNew;

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start p-6 border-b border-gray-700 hover:bg-gray-750 transition-all duration-200 ${
                      isUnread
                        ? "bg-blue-900/20 border-l-4 border-l-blue-500"
                        : "hover:bg-gray-800/50"
                    } ${isNew ? "animate-pulse bg-yellow-900/10" : ""}`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => [...prev, notification.id]);
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((id) => id !== notification.id),
                          );
                        }
                      }}
                      className="mr-4 mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div className="text-3xl mr-4 mt-1 flex-shrink-0 relative">
                      {notification.typeIcon || "🔔"}
                      {isNew && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className={`font-semibold mb-1 flex items-center ${
                              isUnread ? "text-white" : "text-gray-300"
                            }`}
                          >
                            {notification.title}
                            {isNew && (
                              <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                MỚI
                              </span>
                            )}
                            {isUnread && !isNew && (
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                            )}
                          </h3>

                          <p
                            className={`text-sm mb-2 line-clamp-2 ${
                              isUnread ? "text-gray-200" : "text-gray-400"
                            }`}
                          >
                            {notification.message}
                          </p>

                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span>⏰ {formatTime(notification.sentAt)}</span>
                            {notification.typeDisplayName && (
                              <span
                                className={`px-2 py-1 rounded-full ${
                                  isUnread
                                    ? "bg-blue-900/50 text-blue-300"
                                    : "bg-gray-700 text-gray-400"
                                }`}
                              >
                                {notification.typeDisplayName}
                              </span>
                            )}
                            {notification.readAt && (
                              <span className="text-green-400">
                                ✓ Đã đọc {formatTime(notification.readAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="ml-4 flex items-center space-x-2">
                          {isUnread && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                          {isUnread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-700 rounded transition-colors"
                              title="Đánh dấu đã đọc"
                            >
                              <FaEye />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              showInfo={true}
              showQuickJump={totalPages > 5}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
