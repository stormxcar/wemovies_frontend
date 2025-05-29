import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const List = ({
  title,
  items,
  onEdit,
  onDelete,
  onViewDetails,
  searchFields,
  displayFields,
  keyField,
}) => {
  const [search, setSearch] = useState("");

  // Filter items based on search query
  const filteredItems = items.filter((item) =>
    searchFields.some((field) => {
      try {
        if (field.includes(".")) {
          // Handle nested fields (e.g., country.name)
          const [parent, child] = field.split(".");
          return item[parent]?.[child]
            ?.toString()
            .toLowerCase()
            .includes(search.toLowerCase());
        } else if (Array.isArray(item[field])) {
          // Handle arrays (e.g., movieTypes, movieCategories)
          return item[field]
            .map((subItem) => subItem.name || subItem.type_name)
            .join(", ")
            .toLowerCase()
            .includes(search.toLowerCase());
        } else {
          // Handle simple fields (e.g., title, name)
          return item[field]
            ?.toString()
            .toLowerCase()
            .includes(search.toLowerCase());
        }
      } catch (error) {
        return false; // Skip invalid fields
      }
    })
  );

  const handleDelete = (id) => {
    try{
      const response = axios.delete(
        `${process.env.REACT_APP_LOCAL_API_URL}/api/${title.toLowerCase()}/delete/${id}`,
        { withCredentials: true }
      );
    }catch(error){
      console.log(error);
    }
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
            {displayFields.map((field) => (
              <th key={field.key} className="border p-2">
                {field.label}
              </th>
            ))}
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr key={item[keyField]} className="border">
              {displayFields.map((field) => (
                <td key={field.key} className="border p-2">
                  {field.render
                    ? field.render(item[field.key])
                    : field.key.includes(".")
                    ? item[field.key.split(".")[0]]?.[field.key.split(".")[1]] ?? "N/A"
                    : item[field.key] ?? "N/A"}
                </td>
              ))}
              <td className="border p-2 flex space-x-2">
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(item[keyField])}
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
                  onClick={() => handleDelete(item[keyField])}
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
