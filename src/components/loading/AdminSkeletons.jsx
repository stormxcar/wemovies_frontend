import React from "react";

// Skeleton for admin dashboard stats
export const SkeletonDashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton for admin tables
export const SkeletonAdminTable = ({ rows = 10, columns = 5 }) => {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Table header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        </div>
      </div>

      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {[...Array(columns)].map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(rows)].map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {[...Array(columns)].map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="flex space-x-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for admin forms
export const SkeletonAdminForm = ({ fields = 6 }) => {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="space-y-6">
        {/* Form title */}
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(fields)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>

        {/* Large text area */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-4">
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
          <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for admin cards/list items
export const SkeletonAdminCard = ({ count = 1, variant = "grid" }) => {
  const gridClass =
    variant === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : "space-y-4";

  return (
    <div className={gridClass}>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
        >
          <div className="flex items-center space-x-4">
            {/* Avatar/Image */}
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg flex-shrink-0"></div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              <div className="flex items-center space-x-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton for admin sidebar
export const SkeletonAdminSidebar = () => {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 w-64 h-full p-4 shadow-lg">
      {/* Logo */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      </div>

      {/* Menu items */}
      <div className="space-y-3">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-3">
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
          </div>
        ))}
      </div>

      {/* User profile */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for admin charts/analytics
export const SkeletonAdminChart = ({ type = "bar" }) => {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
      </div>

      {/* Chart content */}
      {type === "bar" && (
        <div className="space-y-4">
          <div className="flex items-end space-x-2 h-48">
            {[...Array(7)].map((_, index) => (
              <div
                key={index}
                className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-t"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between">
            {[...Array(7)].map((_, index) => (
              <div
                key={index}
                className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8"
              ></div>
            ))}
          </div>
        </div>
      )}

      {type === "line" && (
        <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded relative">
          <div className="absolute inset-4 bg-gradient-to-br from-blue-200 to-transparent dark:from-blue-800 rounded"></div>
        </div>
      )}

      {type === "pie" && (
        <div className="flex items-center justify-center h-48">
          <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full relative">
            <div className="absolute top-4 left-4 right-4 bottom-4 bg-white dark:bg-gray-800 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  SkeletonDashboardStats,
  SkeletonAdminTable,
  SkeletonAdminForm,
  SkeletonAdminCard,
  SkeletonAdminSidebar,
  SkeletonAdminChart,
};
