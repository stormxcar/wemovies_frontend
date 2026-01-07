import React from "react";

const SkeletonTable = ({ displayFields, rows = 5 }) => {
  return (
    <div className="w-full border-collapse animate-pulse">
      <thead>
        <tr className="bg-gray-200">
          {displayFields.map((field) => (
            <th key={field.key} className="border p-2">
              <div className="h-4 bg-gray-300 rounded"></div>
            </th>
          ))}
          <th className="border p-2">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, index) => (
          <tr key={index} className="border">
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
        ))}
      </tbody>
    </div>
  );
};

export default SkeletonTable;
