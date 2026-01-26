import React, { useState, useMemo, useEffect } from "react";
import {
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
} from "lucide-react";
import { useCrudOperations } from "../hooks/useCrudOperations";
import SkeletonTable from "./SkeletonTable";
import Pagination from "./Pagination";

const List = ({
  title,
  items,
  onEdit,
  onViewDetails,
  onDelete,
  searchFields,
  displayFields,
  keyField,
  onRefresh,
  isLoading = false,
}) => {
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { handleRefresh } = useCrudOperations(title, onRefresh);

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
      prev.length === paginatedItems.length
        ? []
        : paginatedItems.map((item) => item[keyField])
    );
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    if (
      window.confirm(
        `Bạn có chắc muốn xóa ${selectedItems.length} mục đã chọn?`
      )
    ) {
      try {
        await Promise.all(selectedItems.map((id) => onDelete(id)));
        setSelectedItems([]);
      } catch (error) {
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

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters]);

  // Reset to first page when items array changes (e.g., after refresh)
  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  // Process items with search, filters, and sorting
  const { filteredItems, paginatedItems, totalPages } = useMemo(() => {
    let result = items.filter((item) => {
      // Search filter
      const matchesSearch = searchFields.some((field) => {
        try {
          if (field.includes(".")) {
            const [parent, child] = field.split(".");
            return item[parent]?.[child]
              ?.toString()
              .toLowerCase()
              .includes(search.toLowerCase());
          } else if (Array.isArray(item[field])) {
            return item[field]
              .map((subItem) => subItem.name || subItem.type_name)
              .join(", ")
              .toLowerCase()
              .includes(search.toLowerCase());
          } else {
            return item[field]
              ?.toString()
              .toLowerCase()
              .includes(search.toLowerCase());
          }
        } catch (error) {
          return false;
        }
      });

      // Additional filters
      const matchesFilters = Object.entries(filters).every(([field, value]) => {
        if (!value) return true;
        return item[field]
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase());
      });

      return matchesSearch && matchesFilters;
    });

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (sortField.includes(".")) {
          const [parent, child] = sortField.split(".");
          aValue = a[parent]?.[child];
          bValue = b[parent]?.[child];
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const totalPages = Math.ceil(result.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = result.slice(startIndex, endIndex);

    return {
      filteredItems: result,
      paginatedItems,
      totalPages,
    };
  }, [
    items,
    search,
    searchFields,
    filters,
    sortField,
    sortDirection,
    currentPage,
    itemsPerPage,
  ]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Danh sách {title}</h1>
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
            onClick={handleRefresh}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  placeholder={`Lọc ${field.label.toLowerCase()}...`}
                  value={filters[field.key] || ""}
                  onChange={(e) =>
                    handleFilterChange(field.key, e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
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
        Hiển thị {paginatedItems.length} / {filteredItems.length} mục (trang{" "}
        {currentPage} / {totalPages})
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 w-12">
              <button
                onClick={handleSelectAll}
                className="flex items-center justify-center w-full"
              >
                {selectedItems.length === paginatedItems.length &&
                paginatedItems.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </th>
            {displayFields.map((field) => (
              <th key={field.key} className="border p-2">
                <button
                  onClick={() => handleSort(field.key)}
                  className="flex items-center gap-1 hover:bg-gray-300 px-2 py-1 rounded"
                >
                  {field.label}
                  {sortField === field.key &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    ))}
                </button>
              </th>
            ))}
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? // Show skeleton rows when loading
              Array.from({ length: Math.min(5, itemsPerPage) }).map(
                (_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    className="border animate-pulse"
                  >
                    <td className="border p-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
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
                )
              )
            : paginatedItems.map((item) => (
                <tr
                  key={item[keyField]}
                  className={`border ${
                    selectedItems.includes(item[keyField]) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="border p-2">
                    <button
                      onClick={() => handleSelectItem(item[keyField])}
                      className="flex items-center justify-center w-full"
                    >
                      {selectedItems.includes(item[keyField]) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
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
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                        title="Chi tiết"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(item)}
                      className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
                      title="Sửa"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onDelete(item[keyField])}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
                      title="Xóa"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        totalItems={filteredItems.length}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default List;
