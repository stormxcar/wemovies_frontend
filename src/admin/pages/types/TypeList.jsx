import React, { useState, useMemo } from "react";
import { toast } from "react-toastify";
import {
  RefreshCw,
  Trash2,
  Edit,
  Filter,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
} from "lucide-react";
import api from "../../../services/api";
import { useTypes, useDeleteType } from "../../../hooks/useAdminQueries";

const TypeList = () => {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Use TanStack Query hooks
  const { data: types = [], isLoading, refetch } = useTypes();
  const deleteTypeMutation = useDeleteType();

  // Handle multi-select
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems((prev) =>
      prev.length === filteredAndSortedTypes.length
        ? []
        : filteredAndSortedTypes.map((type) => type.id)
    );
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    if (
      window.confirm(
        `Bạn có chắc muốn xóa ${selectedItems.length} loại phim đã chọn?`
      )
    ) {
      try {
        await Promise.all(
          selectedItems.map((id) => deleteTypeMutation.mutateAsync(id))
        );
        setSelectedItems([]);
      } catch (error) {
        toast.error("Lỗi khi xóa loại phim");
      }
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle filtering
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Process types with search, filters, and sorting
  const filteredAndSortedTypes = useMemo(() => {
    let result = types.filter((type) => {
      // Search filter
      const matchesSearch = type?.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      // Additional filters
      const matchesFilters = Object.entries(filters).every(([field, value]) => {
        if (!value) return true;
        return type[field]
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase());
      });

      return matchesSearch && matchesFilters;
    });

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [types, search, filters, sortField, sortDirection]);

  const handleEdit = (type) => {
    setCurrentType({ ...type });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const response = await api.put(
        `/api/types/update/${currentType.id}`,
        currentType
      );
      toast.success("Loại phim đã được cập nhật");

      // Refetch data to update the list
      refetch();

      setIsModalOpen(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Lỗi khi cập nhật loại phim"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTypeMutation.mutateAsync(id);
    } catch (error) {
      toast.error("Lỗi khi xóa loại phim");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Danh sách loại phim</h1>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Xóa ({selectedItems.length})
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Bộ lọc
          </button>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Tìm kiếm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded border">
          <h3 className="font-semibold mb-2">Bộ lọc nâng cao</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên</label>
              <input
                type="text"
                placeholder="Lọc theo tên..."
                value={filters.name || ""}
                onChange={(e) => handleFilterChange("name", e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ID</label>
              <input
                type="text"
                placeholder="Lọc theo ID..."
                value={filters.id || ""}
                onChange={(e) => handleFilterChange("id", e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button
            onClick={() => setFilters({})}
            className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Hiển thị {filteredAndSortedTypes.length} / {types.length} loại phim
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 w-12">
              <button
                onClick={handleSelectAll}
                className="flex items-center justify-center w-full"
              >
                {selectedItems.length === filteredAndSortedTypes.length &&
                filteredAndSortedTypes.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </th>
            <th className="border p-2">
              <button
                onClick={() => handleSort("id")}
                className="flex items-center gap-1 hover:bg-gray-300 px-2 py-1 rounded"
              >
                ID
                {sortField === "id" &&
                  (sortDirection === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  ))}
              </button>
            </th>
            <th className="border p-2">
              <button
                onClick={() => handleSort("name")}
                className="flex items-center gap-1 hover:bg-gray-300 px-2 py-1 rounded"
              >
                Tên
                {sortField === "name" &&
                  (sortDirection === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  ))}
              </button>
            </th>
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border animate-pulse">
                  <td className="border p-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </td>
                  <td className="border p-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </td>
                  <td className="border p-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </td>
                  <td className="border p-2">
                    <div className="flex space-x-2">
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                      <div className="h-6 w-12 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))
            : filteredAndSortedTypes.map((type) => (
                <tr
                  key={type.id}
                  className={`border ${
                    selectedItems.includes(type.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="border p-2">
                    <button
                      onClick={() => handleSelectItem(type.id)}
                      className="flex items-center justify-center w-full"
                    >
                      {selectedItems.includes(type.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="border p-2">{type.id}</td>
                  <td className="border p-2">{type.name}</td>
                  <td className="border p-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
                        title="Sửa"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
                        title="Xóa"
                      >
                        <Trash2 className="h-3 w-3" />
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
