import React from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";

const Pagination = ({
  currentPage = 0,
  totalPages = 0,
  totalItems = 0,
  itemsPerPage = 20,
  onPageChange,
  showInfo = true,
  showQuickJump = true,
  className = "",
}) => {
  // Calculate page numbers to show
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(0, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (range[0] > 1) {
      rangeWithDots.push(0);
      if (range[0] > 2) {
        rangeWithDots.push("...");
      }
    } else if (range[0] === 1) {
      rangeWithDots.push(0);
    }

    rangeWithDots.push(...range);

    if (range[range.length - 1] < totalPages - 2) {
      rangeWithDots.push("...");
      rangeWithDots.push(totalPages - 1);
    } else if (range[range.length - 1] === totalPages - 2) {
      rangeWithDots.push(totalPages - 1);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  const startItem = currentPage * itemsPerPage + 1;
  const endItem = Math.min((currentPage + 1) * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* Info */}
      {showInfo && (
        <div className="text-sm text-gray-400">
          Hiển thị <span className="text-white font-medium">{startItem}</span> -{" "}
          <span className="text-white font-medium">{endItem}</span> trong tổng
          số <span className="text-white font-medium">{totalItems}</span> kết
          quả
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* First Page */}
        {showQuickJump && currentPage > 0 && (
          <button
            onClick={() => onPageChange(0)}
            className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Trang đầu"
          >
            <FaAngleDoubleLeft />
          </button>
        )}

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) =>
            page === "..." ? (
              <span key={index} className="px-2 py-1 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 rounded transition-colors ${
                  page === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {page + 1}
              </button>
            ),
          )}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        {showQuickJump && currentPage < totalPages - 1 && (
          <button
            onClick={() => onPageChange(totalPages - 1)}
            className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Trang cuối"
          >
            <FaAngleDoubleRight />
          </button>
        )}
      </div>
    </div>
  );
};

export default Pagination;
