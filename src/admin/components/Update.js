import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Update = ({ title, items, fields, updateEndpoint, onUpdate }) => {
  const [selectedId, setSelectedId] = useState("");
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Update component mounted - props:", {
      title,
      items,
      fields,
      updateEndpoint,
      onUpdate,
    });
    console.log(
      "Items structure:",
      items.map((item) => ({ category_id: item.id, name: item.name }))
    );
  }, [title, items, fields, updateEndpoint, onUpdate]);

  useEffect(() => {
    if (!selectedId || selectedId === "") {
      console.log("selectedId is empty, skipping sync");
      setFormData({});
      return;
    }
    const parsedId = parseInt(selectedId);
    if (isNaN(parsedId)) {
      console.warn("Invalid ID, resetting formData");
      setSelectedId("");
      setFormData({});
      return;
    }
    const item = items.find((item) => item.id === parsedId);
    console.log("Syncing formData with selectedId:", {
      selectedId,
      parsedId,
      item,
    });
    setFormData(item || {});
  }, [selectedId, items]);

  const handleSelect = (id) => {
    console.log("Received ID:", id, "Type:", typeof id);
    if (!id || id === "") {
      console.log("Empty ID selected, resetting formData");
      setSelectedId("");
      setFormData({});
      return;
    }
    const parsedId = parseInt(id);
    console.log("Parsed ID:", parsedId);
    const item = items.find((item) => item.id === parsedId); 
    console.log("Found item:", item);
    if (item) {
      setSelectedId(id);
    } else {
      console.warn(`No item found for ID: ${id}`);
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
    try {
      const response = await axios.put(
        `${updateEndpoint}/${formData.id}`, 
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success(`${title} đã được cập nhật`);
      console.log("Updated Item:", response.data);
      navigate(`/admin/${updateEndpoint.split("/").slice(-2, -1)[0]}`);
      if (onUpdate) onUpdate(response.data);
    } catch (error) {
      console.error(
        "Error updating item:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data || `Lỗi khi cập nhật ${title}`);
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
          console.log(
            "Dropdown selected value:",
            e.target.value,
            "Type:",
            typeof e.target.value
          );
          handleSelect(e.target.value);
        }}
        className="w-full p-2 mb-4 border rounded"
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
                  className="w-full p-2 border rounded"
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
                  className="w-full p-2 border rounded"
                />
              ) : (
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="w-full p-2 border rounded"
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Cập nhật
          </button>
        </form>
      )}
    </div>
  );
};

export default Update;
