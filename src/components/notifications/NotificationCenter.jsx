import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaEye, FaTrash, FaCheck } from "react-icons/fa";
import NotificationService from "../../services/NotificationService";
import { fetchJson } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  // Helper function để get user ID từ multiple sources
  const getUserId = () => {
    if (!user) return null;

    // Try different user ID sources
    let userId = user.id || user.email || user.username;

    // If still no ID, try to get from localStorage
    if (!userId) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        userId = storedUser.id || storedUser.email;
      } catch (error) {
        // Silent error
      }
    }

    // Final attempt: check token for user info
    if (!userId) {
      try {
        const token = localStorage.getItem("jwtToken");
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.sub || payload.userId || payload.id || payload.email;
        }
      } catch (error) {
        // Silent error
      }
    }

    return userId;
  };

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (!user || !token) {
      return;
    }

    // Request browser notification permission
    NotificationService.requestNotificationPermission();

    // Connect to WebSocket
    connectWebSocket();

    // Load initial notifications
    loadNotifications();

    // Setup event listeners
    const unsubscribeNewNotification = NotificationService.onNewNotification(
      handleNewNotification,
    );
    const unsubscribeUnreadCount = NotificationService.onUnreadCountUpdate(
      handleUnreadCountUpdate,
    );

    // Cleanup on unmount
    return () => {
      unsubscribeNewNotification();
      unsubscribeUnreadCount();
      NotificationService.disconnect();
    };
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const connectWebSocket = async () => {
    if (!user) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setConnectionStatus("disconnected");
      return;
    }

    try {
      setConnectionStatus("connecting");

      const userId = getUserId();

      if (!userId) {
        setConnectionStatus("disconnected");
        return;
      }

      await NotificationService.connect(userId, token);
      setConnectionStatus("connected");
    } catch (error) {
      setConnectionStatus("disconnected");
    }
  };

  const loadNotifications = async () => {
    if (!user) {
      return;
    }

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetchJson("/api/notifications?page=0&size=10");

      // Backend returns ApiResponse<Page<NotificationResponse>>
      const notificationsData =
        response.data?.content || response.content || [];

      // Mark notifications as old (not new) when loading from API
      const processedNotifications = notificationsData.map((notif) => ({
        ...notif,
        isNew: false,
      }));

      setNotifications(processedNotifications);

      // Load unread count
      const countResponse = await fetchJson("/api/notifications/unread-count");

      // Backend returns ApiResponse<Map<String, Object>> with "unreadCount" key
      const unreadCountValue =
        countResponse.data?.unreadCount || countResponse.unreadCount || 0;
      setUnreadCount(unreadCountValue);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);

    // Animate bell icon
    if (bellRef.current) {
      bellRef.current.classList.add("bell-shake");
      setTimeout(() => {
        if (bellRef.current) {
          bellRef.current.classList.remove("bell-shake");
        }
      }, 1000);
    }
  };

  const handleUnreadCountUpdate = (count) => {
    setUnreadCount(count);
  };

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      await fetchJson(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif,
        ),
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Không thể đánh dấu đã đọc");
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
          isNew: false, // Remove new status when marking as read
        })),
      );
      setUnreadCount(0);
      toast.success("Đã đánh dấu tất cả là đã đọc!");
    } catch (error) {
      toast.error("Có lỗi xảy ra!");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith("http")) {
        window.open(notification.actionUrl, "_blank");
      } else {
        window.location.href = notification.actionUrl;
      }
    }

    setIsOpen(false);
  };

  const formatTimeAgo = (sentAt) => {
    if (!sentAt) return "";

    const now = new Date();
    const sent = new Date(sentAt);
    const diffMs = now - sent;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      default:
        return "text-red-500";
    }
  };

  if (!user) return null;

  return (
    <div className="notification-center relative">
      {/* Notification Bell Icon */}
      <div
        ref={bellRef}
        className="notification-bell relative cursor-pointer p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} thông báo chưa đọc`}
      >
        <FaBell className="text-white text-xl" />

        {/* Connection Status */}
        <div
          className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${getConnectionStatusColor()}`}
          title={connectionStatus}
        ></div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="notification-badge absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center font-bold animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {/* Notification Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="notification-dropdown absolute top-full right-0 mt-2 w-96 max-h-[500px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="notification-header flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
            <h3 className="text-white font-semibold text-lg flex items-center">
              <FaBell className="mr-2" />
              Thông báo
              {connectionStatus === "connected" && (
                <span className="ml-2 text-green-400 text-xs">🟢 Live</span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-400 text-sm hover:text-blue-300 transition-colors flex items-center"
                >
                  <FaCheck className="mr-1" />
                  Đọc tất cả
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="notification-list max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-400">
                <div className="animate-spin text-2xl mb-2">🔄</div>
                <p>Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-lg font-medium mb-1">
                  Chưa có thông báo nào
                </p>
                <p className="text-sm">Thông báo mới sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.isRead;
                const isNew = notification.isNew;

                return (
                  <div
                    key={notification.id}
                    className={`notification-item flex items-start p-4 border-b border-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-800 ${
                      isUnread
                        ? "bg-blue-900/30 border-l-4 border-l-blue-500"
                        : "hover:bg-gray-800/50"
                    } ${isNew ? "animate-pulse bg-yellow-900/20" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div className="notification-icon text-2xl mr-3 mt-1 flex-shrink-0 relative">
                      {notification.typeIcon || "🔔"}
                      {isNew && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="notification-content flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div
                          className={`notification-title font-medium line-clamp-1 ${
                            isUnread ? "text-white" : "text-gray-300"
                          }`}
                        >
                          {notification.title}
                          {isNew && (
                            <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                              Mới
                            </span>
                          )}
                        </div>
                        {isUnread && (
                          <div className="unread-indicator w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <div
                        className={`notification-message text-sm mb-2 line-clamp-2 ${
                          isUnread ? "text-gray-200" : "text-gray-400"
                        }`}
                      >
                        {notification.message}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="notification-time text-gray-500 text-xs">
                          {formatTimeAgo(
                            notification.sentAt || notification.createdAt,
                          )}
                          {notification.readAt && (
                            <span className="ml-2 text-green-400">
                              ✓ Đã đọc
                            </span>
                          )}
                        </div>
                        {notification.typeDisplayName && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              isUnread
                                ? "text-blue-300 bg-blue-900/50"
                                : "text-gray-400 bg-gray-800"
                            }`}
                          >
                            {notification.typeDisplayName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="notification-footer p-4 border-t border-gray-700 bg-gray-800">
            <Link
              to="/profile?tab=notifications"
              className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .bell-shake {
          animation: bellShake 0.5s ease-in-out;
        }

        @keyframes bellShake {
          0% {
            transform: rotate(0deg);
          }
          15% {
            transform: rotate(5deg);
          }
          30% {
            transform: rotate(-5deg);
          }
          45% {
            transform: rotate(4deg);
          }
          60% {
            transform: rotate(-4deg);
          }
          75% {
            transform: rotate(2deg);
          }
          90% {
            transform: rotate(-1deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;
