import api from "../../services/api";
import { toast } from "react-toastify";

const getEndpointName = (title) => {
  const endpointMap = {
    Phim: "movies",
    "Danh mục": "categories",
    "Quốc gia": "countries",
    "Người dùng": "users",
  };
  return endpointMap[title] || title.toLowerCase().replace(/\s+/g, "");
};

export const useCrudOperations = (title, onRefresh) => {
  const endpoint = getEndpointName(title);
  const handleDelete = async (id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${title} này?`)) {
      return;
    }

    try {
      await api.delete(`/api/${endpoint}/${id}`);
      toast.success(`${title} đã được xóa thành công`);
      if (onRefresh) {
        onRefresh(); // Refresh data after delete
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      if (error.response?.status === 403) {
        toast.error("Bạn không có quyền thực hiện hành động này");
      } else if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
      } else {
        toast.error(
          `Lỗi khi xóa ${title}: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  };

  const handleCreate = async (data) => {
    try {
      const response = await api.post(`/api/${endpoint}/add`, data);
      toast.success(`${title} đã được thêm thành công`);
      if (onRefresh) {
        onRefresh();
      }
      return response.data;
    } catch (error) {
      console.error("Lỗi khi thêm:", error);
      toast.error(
        `Lỗi khi thêm ${title}: ${
          error.response?.data?.message || error.message
        }`
      );
      throw error;
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const response = await api.put(`/api/${endpoint}/update/${id}`, data);
      toast.success(`${title} đã được cập nhật thành công`);
      if (onRefresh) {
        onRefresh();
      }
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error(
        `Lỗi khi cập nhật ${title}: ${
          error.response?.data?.message || error.message
        }`
      );
      throw error;
    }
  };

  const handleRefresh = async () => {
    try {
      if (onRefresh) {
        await onRefresh();
        toast.success("Dữ liệu đã được làm mới");
      }
    } catch (error) {
      console.error("Lỗi khi làm mới:", error);
      toast.error("Lỗi khi làm mới dữ liệu");
    }
  };

  return {
    handleDelete,
    handleCreate,
    handleUpdate,
    handleRefresh,
  };
};
