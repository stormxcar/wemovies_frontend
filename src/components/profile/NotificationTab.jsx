import React, { useState, useEffect } from "react";
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaEye,
  FaFilter,
  FaCog,
} from "react-icons/fa";
import { fetchJson } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import NotificationService from "../../services/NotificationService";
import Pagination from "../ui/pagination";

const NotificationTab = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const pageSize = 10; // Smaller page size for tab view

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
  }, [filter, user, currentPage]);

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
      setConnectionStatus("disconnected");
    }
  };

  const loadNotifications = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token || !user) return;

    try {
      setLoading(true);

      let url = `/api/notifications?page=${currentPage}&size=${pageSize}`;
      if (filter !== "all") {
        url += `&read=${filter === "read"}`;
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
      toast.error("Không thể tải thông báo");
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
        read: Math.max(0, read), // Ensure read count is never negative
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
      setStats({ total: 0, unread: 0, read: 0 });
    }
  };

  const handleNewNotification = (notification) => {
    // Reset to first page if on later pages and filter matches new notification
    const matchesFilter =
      filter === "all" || (filter === "unread" && !notification.isRead);

    if (matchesFilter) {
      if (currentPage > 0) {
        setCurrentPage(0); // This will trigger useEffect to reload
      } else {
        // Only add to list if on first page
        setNotifications((prev) => [
          { ...notification, isNew: true },
          ...prev.slice(0, pageSize - 1),
        ]);
      }
    }

    // Update stats for new unread notification
    setStats((prev) => ({
      total: prev.total + 1,
      unread: prev.unread + 1,
      read: prev.read,
    }));
  };

  const handleUnreadCountUpdate = (count) => {
    setStats((prev) => {
      const newRead = Math.max(0, prev.total - count);
      return {
        ...prev,
        unread: count,
        read: newRead,
      };
    });
  };

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      await fetchJson(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

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

      // Update stats locally
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1,
      }));

      toast.success("Đã đánh dấu đã đọc");
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      await fetchJson("/api/notifications/read-all", {
        method: "PUT",
      });

      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString(),
          isNew: false,
        })),
      );

      // Update stats locally
      setStats((prev) => ({
        ...prev,
        unread: 0,
        read: prev.total,
      }));

      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const deleteNotification = async (notificationId) => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    if (!window.confirm("Bạn có chắc muốn xóa thông báo này?")) {
      return;
    }

    try {
      // Find the notification to check if it was read or unread
      const notificationToDelete = notifications.find(
        (n) => n.id === notificationId,
      );

      await fetchJson(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId),
      );

      // Update stats locally
      setStats((prev) => ({
        total: Math.max(0, prev.total - 1),
        unread:
          notificationToDelete && !notificationToDelete.isRead
            ? Math.max(0, prev.unread - 1)
            : prev.unread,
        read:
          notificationToDelete && notificationToDelete.isRead
            ? Math.max(0, prev.read - 1)
            : prev.read,
      }));

      toast.success("Đã xóa thông báo");
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith("http")) {
        window.open(notification.actionUrl, "_blank");
      } else {
        window.location.href = notification.actionUrl;
      }
    }
  };

  const formatTime = (sentAt) => {
    if (!sentAt) return "";

    const date = new Date(sentAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getConnectionStatusColor = () => {
    return connectionStatus === "connected" ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="notification-tab">
      {/* Header with Stats */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <FaBell className="mr-2" />
            Thông báo
            <span className={`ml-2 text-sm ${getConnectionStatusColor()}`}>
              {connectionStatus === "connected"
                ? "🟢 Kết nối"
                : "🔴 Ngắt kết nối"}
            </span>
          </h3>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => (window.location.href = "/notifications")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Xem tất cả
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center border border-gray-600 hover:border-gray-500 transition-colors">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {stats.total}
            </div>
            <div className="text-gray-300 text-sm font-medium">Tổng số</div>
            <div className="text-gray-500 text-xs mt-1">Tất cả thông báo</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center border border-orange-500/30 hover:border-orange-500/50 transition-colors">
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {stats.unread}
            </div>
            <div className="text-gray-300 text-sm font-medium">Chưa đọc</div>
            <div className="text-gray-500 text-xs mt-1">Cần xem xét</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center border border-green-500/30 hover:border-green-500/50 transition-colors">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {stats.read}
            </div>
            <div className="text-gray-300 text-sm font-medium">Đã đọc</div>
            <div className="text-gray-500 text-xs mt-1">Đã xử lý</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-gray-400 text-sm">Hiển thị:</label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(0); // Reset to first page when filter changes
              }}
              className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Tất cả ({stats.total})</option>
              <option value="unread">Chưa đọc ({stats.unread})</option>
              <option value="read">Đã đọc ({stats.read})</option>
            </select>
          </div>

          {stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
            >
              <FaCheck className="mr-2" />
              Đọc tất cả
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin text-3xl mb-4">🔄</div>
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg font-medium mb-2">Không có thông báo nào</p>
            <p className="text-sm">
              {filter === "unread"
                ? "Bạn đã đọc hết thông báo!"
                : "Thông báo mới sẽ xuất hiện ở đây"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {notifications.slice(0, 20).map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start p-4 hover:bg-gray-750 transition-colors ${
                  !notification.isRead
                    ? "bg-blue-900/20 border-l-4 border-l-blue-500"
                    : ""
                }`}
              >
                {/* Icon */}
                <div className="text-2xl mr-3 mt-1 flex-shrink-0">
                  {notification.typeIcon || "🔔"}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className="cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <h4
                      className={`font-medium mb-1 ${
                        !notification.isRead ? "text-white" : "text-gray-300"
                      }`}
                    >
                      {notification.title}
                      {!notification.isRead && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                      )}
                    </h4>

                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center text-xs text-gray-500 space-x-3">
                      <span>⏰ {formatTime(notification.sentAt)}</span>
                      {notification.typeDisplayName && (
                        <span className="px-2 py-1 bg-gray-700 rounded-full">
                          {notification.typeDisplayName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2 ml-3">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-500 hover:bg-gray-700 rounded transition-colors"
                      title="Đánh dấu đã đọc"
                    >
                      <FaEye />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded transition-colors"
                    title="Xóa thông báo"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalElements}
            itemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            showInfo={true}
            showQuickJump={totalPages > 5}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default NotificationTab;
