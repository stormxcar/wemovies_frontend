import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AddCategory = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_LOCAL_API_URL}/api/categories/add`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success("Danh mục đã được thêm");
      //   console.log("Added Category:", response.data);
      setFormData({ name: "" });
      navigate("/admin/categories");
    } catch (error) {
      console.error(
        "Error adding category:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data || "Lỗi khi thêm danh mục");
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
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thêm
        </button>
      </form>
    </div>
  );
};

export default AddCategory;
