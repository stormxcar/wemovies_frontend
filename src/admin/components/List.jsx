import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useCrudOperations } from "../hooks/useCrudOperations";
import SkeletonTable from "./SkeletonTable";

const List = ({
  title,
  items,
  onEdit,
  onViewDetails,
  searchFields,
  displayFields,
  keyField,
  onRefresh,
  isLoading = false,
}) => {
  const [search, setSearch] = useState("");
  const { handleDelete, handleRefresh } = useCrudOperations(title, onRefresh);

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Danh sách {title}</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>
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
          {isLoading
            ? // Show skeleton rows when loading
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border animate-pulse">
                  {displayFields.map((field) => (
                    <td key={field.key} className="border p-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                  ))}
                  <td className="border p-2">
                    <div className="flex space-x-2">
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))
            : filteredItems.map((item) => (
                <tr key={item[keyField]} className="border">
                  {displayFields.map((field) => (
                    <td key={field.key} className="border p-2">
                      {field.render
                        ? field.render(item[field.key])
                        : field.key.includes(".")
                        ? item[field.key.split(".")[0]]?.[
                            field.key.split(".")[1]
                          ] ?? "N/A"
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
