import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AddType = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/api/types/add",
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      toast.success("Loai phim đã được thêm");
      setFormData({ name: "" });
      navigate("/admin/types");
    } catch (error) {
      console.error(
        "Error adding type:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data || "Lỗi khi thêm loai");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thêm loai</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Tên loai"
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

export default AddType;
