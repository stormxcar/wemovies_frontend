import React, { useState } from "react";
import { toast } from "react-toastify";

// List Component (Generic for Movies, Categories, Countries, Users)
const List = ({
  title,
  items,
  onEdit,
  onDelete,
  onViewDetails,
  searchFields,
}) => {
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((item) =>
    searchFields.some((field) =>
      item[field].toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleDelete = (id) => {
    onDelete(id);
    toast.success(`${title} đã được xóa`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Danh sách {title}</h1>
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
            {Object.keys(items[0] || {}).map((key) => (
              <th key={key} className="border p-2">
                {key.toUpperCase()}
              </th>
            ))}
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr key={item.id} className="border">
              {Object.values(item).map((value, index) => (
                <td key={index} className="border p-2">
                  {value}
                </td>
              ))}
              <td className="border p-2 flex space-x-2">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(item.id)}
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                  >
                    Chi tiết
                  </button>
                )}
                <button
                  onClick={() => onEdit(item)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default List;
