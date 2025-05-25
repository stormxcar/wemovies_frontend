import React, { useState } from "react";
import Modal from "./Modal";
import { toast } from "react-toastify";

// Type List with Edit Modal
// TypeList Component
const TypeList = ({ types, onEdit }) => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState(null);

const filteredTypes = types.filter((type) =>
    type?.type_name?.toLowerCase().includes(search.toLowerCase())
);

  const handleEdit = (type) => {
    setCurrentType(type);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    onEdit(currentType);
    setIsModalOpen(false);
    toast.success("Loại phim đã được cập nhật");
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
            <tr key={type.movie_type_id} className="border">
              <td className="border p-2">{type.movie_type_id}</td>
              <td className="border p-2">{type.type_name}</td>
              <td className="border p-2">
                <button
                  onClick={() => handleEdit(type)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded"
                >
                  Sửa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Placeholder cho react-modal */}
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
