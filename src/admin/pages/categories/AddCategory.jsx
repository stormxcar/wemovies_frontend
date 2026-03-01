import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import api from "../../../services/api";
import { queryClient } from "../../../utils/queryClient";

const AddCategory = () => {
  const navigate = useNavigate();

  // Set document title for add category page
  useDocumentTitle("Thêm danh mục", "Admin");

  const [formData, setFormData] = useState({ name: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions

    setLoading(true);
    try {
      await api.post("/api/categories/add", formData);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Danh mục đã được thêm");
      setFormData({ name: "" });
      navigate("/admin/categories");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm danh mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thêm Danh mục</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Tên danh mục"
          className="w-full p-2 border rounded disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? "Đang thêm..." : "Thêm"}
        </button>
      </form>
    </div>
  );
};

export default AddCategory;
