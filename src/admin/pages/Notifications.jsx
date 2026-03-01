import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { RefreshCw, Send } from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import api, { fetchJson } from "../../services/api";

const notificationTypes = [
  "NEW_MOVIE",
  "SYSTEM_ALERT",
  "ANNOUNCEMENT",
  "MAINTENANCE",
];

const Notifications = () => {
  useDocumentTitle("Quản lý thông báo", "Admin");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

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
      setTotalElements(Number(pageData?.totalElements ?? content.length));
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
      }

      await api.post("/api/notifications/broadcast", null, { params });
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
      console.error("[ADMIN BROADCAST] failed", {
        status: error?.response?.status,
        url: error?.config?.url,
        response: error?.response?.data,
      });

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
    <div className="p-6 space-y-6">
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
                <option key={type} value={type}>
                  {type}
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {sending ? "Đang gửi..." : "Gửi thông báo"}
        </button>
      </form>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
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

        <div className="text-sm text-gray-600 mb-3">
          Tổng: {totalElements} thông báo • {pageLabel}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
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
              ) : notifications.length === 0 ? (
                <tr>
                  <td className="border p-3" colSpan={5}>
                    Chưa có thông báo
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
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

        <div className="mt-4 flex items-center gap-2">
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
