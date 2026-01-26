import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Update = ({ title, items, fields, updateEndpoint, onUpdate }) => {
  const [selectedId, setSelectedId] = useState("");
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  }, [title, items, fields, updateEndpoint, onUpdate]);

  useEffect(() => {
    if (!selectedId || selectedId === "") {
      setFormData({});
      return;
    }
    // Find item directly with string ID (UUID)
    const item = items.find((item) => item.id === selectedId);
    setFormData(item || {});
  }, [selectedId, items]);

  const handleSelect = (id) => {
    if (!id || id === "") {
      setSelectedId("");
      setFormData({});
      return;
    }
    // Keep ID as string (UUID) instead of parsing to number
    const item = items.find((item) => item.id === id);
    if (item) {
      setSelectedId(id);
    } else {
      setSelectedId("");
      toast.error("Mục không hợp lệ, vui lòng chọn lại.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      toast.error("Vui lòng chọn một mục để cập nhật.");
      return;
    }
    if (loading) return; // Prevent multiple submissions

    setLoading(true);
    try {
      const response = await api.put(
        `${updateEndpoint}/${formData.id}`,
        formData
      );
      toast.success(`${title} đã được cập nhật`);
      navigate(`/admin/${updateEndpoint.split("/").slice(-2, -1)[0]}`);
      if (onUpdate) onUpdate(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || `Lỗi khi cập nhật ${title}`);
    } finally {
      setLoading(false);
    }
  };

  if (!fields) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Cập nhật {title}</h1>
        <p className="text-red-500">
          Lỗi: Không tìm thấy cấu hình fields cho {title}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cập nhật {title}</h1>
      <select
        value={selectedId || ""}
        onChange={(e) => {
          handleSelect(e.target.value);
        }}
        className="w-full p-2 mb-4 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
        disabled={loading}
      >
        <option value="">Chọn {title}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {" "}
            {item.title || item.name || item.username}
          </option>
        ))}
      </select>
      {selectedId && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium">
                {field.label}
              </label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <option value="">Chọn {field.label.toLowerCase()}</option>
                  {(field.options || []).map((option) => (
                    <option key={option.id} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Update;
