import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../../services/api";
import { useCrudOperations } from "../../hooks/useCrudOperations";

const TypeList = ({ types: initialTypes, onEdit, onRefresh }) => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [localTypes, setLocalTypes] = useState(initialTypes); // Local state for types

  // Use CRUD operations hook
  const { handleDelete } = useCrudOperations("Loại phim", () => {
    if (onRefresh) {
      onRefresh();
    }
  });

  // Sync localTypes with initialTypes when it changes
  useEffect(() => {
    setLocalTypes(initialTypes);
  }, [initialTypes]);

  const filteredTypes = localTypes.filter((type) =>
    type?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (type) => {
    setCurrentType({ ...type });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      console.log("Saving type with data:", currentType);
      const response = await api.put(
        `/api/types/update/${currentType.id}`,
        currentType
      );
      console.log("Update successful, response:", response.data);
      toast.success("Loại phim đã được cập nhật");

      // Update localTypes immediately
      setLocalTypes((prevTypes) =>
        prevTypes.map((type) =>
          type.id === response.data.id ? response.data : type
        )
      );

      setIsModalOpen(false);
      if (onEdit) {
        console.log("Calling onEdit with updated type:", response.data);
        onEdit(response.data); // Still notify the parent
      }
    } catch (error) {
      console.error("Error updating type:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Lỗi khi cập nhật loại phim"
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách loại phim</h1>
      <input
        type="text"
        placeholder="Tìm kiếm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Tên</th>
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredTypes.map((type) => (
            <tr key={type.id} className="border">
              <td className="border p-2">{type.id}</td>
              <td className="border p-2">{type.name}</td>
              <td className="border p-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(type)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa loại phim</h2>
            <input
              type="text"
              value={currentType?.name || ""}
              onChange={(e) =>
                setCurrentType({ ...currentType, name: e.target.value })
              }
              className="w-full p-2 mb-4 border rounded"
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypeList;
