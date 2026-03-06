import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@toast";
import { RefreshCw, Send } from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { fetchJson } from "../../services/api";

const notificationTypes = [
  { value: "NEW_EPISODE", label: "Tập mới" },
  { value: "NEW_MOVIE", label: "Phim mới" },
  { value: "MOVIE_REMINDER", label: "Nhắc xem phim" },
  { value: "CONTINUE_WATCHING", label: "Tiếp tục xem" },
  { value: "WEEKLY_DIGEST", label: "Tổng hợp tuần" },
  { value: "WATCH_PROGRESS", label: "Tiến trình xem" },
  { value: "WATCHLIST_REMINDER", label: "Nhắc danh sách xem sau" },
  { value: "FRIEND_ACTIVITY", label: "Hoạt động bạn bè" },
  { value: "FRIEND_REVIEW", label: "Review từ bạn bè" },
  { value: "RECOMMENDATION", label: "Đề xuất" },
  { value: "SYSTEM", label: "Thông báo hệ thống" },
  { value: "MAINTENANCE", label: "Bảo trì" },
  { value: "UPDATE", label: "Cập nhật" },
  { value: "LIKE_RECEIVED", label: "Nhận lượt thích" },
  { value: "COMMENT_RECEIVED", label: "Nhận bình luận" },
  { value: "REVIEW_REPLY", label: "Phản hồi review" },
  { value: "PROMOTION", label: "Khuyến mãi" },
  { value: "DISCOUNT", label: "Giảm giá" },
  { value: "PREMIUM_REMINDER", label: "Nhắc Premium" },
];

const Notifications = () => {
  useDocumentTitle("Quản lý thông báo", "Admin");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showAdminBroadcastOnly, setShowAdminBroadcastOnly] = useState(true);

  const [formData, setFormData] = useState({
    type: "MAINTENANCE",
    title: "",
    message: "",
    actionUrl: "",
    metadata: "",
  });

  const fetchNotifications = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await fetchJson(
        `/api/notifications?page=${page}&size=20`,
      );
      const pageData = response?.data || response;
      const content = Array.isArray(pageData?.content) ? pageData.content : [];

      setNotifications(content);
      setCurrentPage(Number(pageData?.number ?? page));
      setTotalPages(Math.max(1, Number(pageData?.totalPages ?? 1)));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể tải danh sách thông báo";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(0);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parseMetadata = (metadata) => {
    if (!metadata) return null;
    if (typeof metadata === "object") return metadata;

    if (typeof metadata === "string") {
      try {
        return JSON.parse(metadata);
      } catch {
        return { raw: metadata };
      }
    }

    return null;
  };

  const isAdminBroadcastNotification = (notification) => {
    const metadata = parseMetadata(notification?.metadata);
    const sender = String(metadata?.sender || "").toLowerCase();
    const scope = String(metadata?.scope || "").toLowerCase();
    const target = String(notification?.target || "").toUpperCase();

    return (
      sender === "admin" ||
      scope === "broadcast" ||
      target === "ALL_USERS" ||
      String(metadata?.raw || "")
        .toLowerCase()
        .includes("sender")
    );
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesAdminScope = showAdminBroadcastOnly
        ? isAdminBroadcastNotification(notification)
        : true;

      const matchesType =
        typeFilter === "ALL" ? true : notification?.type === typeFilter;

      return matchesAdminScope && matchesType;
    });
  }, [notifications, showAdminBroadcastOnly, typeFilter]);

  const handleBroadcast = async (event) => {
    event.preventDefault();
    if (sending) return;

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung thông báo");
      return;
    }

    setSending(true);
    try {
      const params = {
        type: formData.type,
        title: formData.title.trim(),
        message: formData.message.trim(),
      };

      if (formData.actionUrl.trim()) {
        params.actionUrl = formData.actionUrl.trim();
      }

      if (formData.metadata.trim()) {
        params.metadata = formData.metadata.trim();
      } else {
        params.metadata = JSON.stringify({
          sender: "admin",
          scope: "broadcast",
        });
      }

      await fetchJson("/api/notifications/broadcast", {
        method: "POST",
        params,
      });

      toast.success("Gửi thông báo broadcast thành công");
      setFormData((prev) => ({
        ...prev,
        title: "",
        message: "",
        actionUrl: "",
        metadata: "",
      }));
      fetchNotifications(0);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Không thể gửi thông báo broadcast";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const pageLabel = useMemo(
    () => `Trang ${currentPage + 1} / ${Math.max(totalPages, 1)}`,
    [currentPage, totalPages],
  );

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Quản lý thông báo</h1>
        <p className="text-sm text-gray-600">
          Đăng thông báo broadcast (ví dụ: bảo trì hệ thống) đến toàn bộ người
          dùng.
        </p>
      </div>

      <form
        onSubmit={handleBroadcast}
        className="bg-white border rounded-lg p-4 space-y-4"
      >
        <h2 className="text-lg font-semibold">Đăng thông báo broadcast</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Loại thông báo
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} ({type.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Action URL (tuỳ chọn)
            </label>
            <input
              name="actionUrl"
              value={formData.actionUrl}
              onChange={handleChange}
              placeholder="/maintenance"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Thông báo bảo trì hệ thống"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nội dung</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Hệ thống sẽ bảo trì từ 01:00 đến 03:00..."
            className="w-full p-2 border rounded min-h-[120px]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Metadata (tuỳ chọn)
          </label>
          <input
            name="metadata"
            value={formData.metadata}
            onChange={handleChange}
            placeholder='{"priority":"high"}'
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {sending ? "Đang gửi..." : "Gửi thông báo"}
        </button>
      </form>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
          <h2 className="text-lg font-semibold">Danh sách thông báo</h2>
          <button
            onClick={() => fetchNotifications(currentPage)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showAdminBroadcastOnly}
              onChange={(event) =>
                setShowAdminBroadcastOnly(event.target.checked)
              }
            />
            Chỉ hiển thị thông báo broadcast từ admin
          </label>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="p-2 border rounded"
          >
            <option value="ALL">Tất cả type</option>
            {notificationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.value})
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600 mb-3">
          Tổng: {filteredNotifications.length} thông báo (đã lọc) • {pageLabel}
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Thời gian</th>
                <th className="border p-2 text-left">Loại</th>
                <th className="border p-2 text-left">Tiêu đề</th>
                <th className="border p-2 text-left">Nội dung</th>
                <th className="border p-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="border p-3" colSpan={5}>
                    Đang tải...
                  </td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td className="border p-3" colSpan={5}>
                    Chưa có thông báo
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="border p-2 whitespace-nowrap">
                      {notification.sentAt || "-"}
                    </td>
                    <td className="border p-2">
                      {notification.typeDisplayName || notification.type}
                    </td>
                    <td className="border p-2">{notification.title}</td>
                    <td className="border p-2">{notification.message}</td>
                    <td className="border p-2">
                      {notification.read ? "Đã đọc" : "Chưa đọc"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchNotifications(Math.max(0, currentPage - 1))}
            disabled={loading || currentPage <= 0}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Trước
          </button>
          <button
            onClick={() =>
              fetchNotifications(Math.min(totalPages - 1, currentPage + 1))
            }
            disabled={loading || currentPage >= totalPages - 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
