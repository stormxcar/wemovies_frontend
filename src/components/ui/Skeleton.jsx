import React from "react";

// Basic skeleton loading component
export const Skeleton = ({
  className = "",
  width,
  height,
  rounded = false,
}) => (
  <div
    className={`bg-gray-300 animate-pulse ${
      rounded ? "rounded-full" : "rounded"
    } ${className}`}
    style={{
      width: width || "100%",
      height: height || "1rem",
    }}
  />
);

// Form skeleton for loading forms
export const FormSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="space-y-2">
      <Skeleton height="2rem" width="200px" />
      <Skeleton height="1rem" width="400px" />
    </div>

    {/* Form fields skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height="1rem" width="120px" />
          <Skeleton height="2.5rem" />
        </div>
      ))}
    </div>

    {/* Large text area skeleton */}
    <div className="space-y-2">
      <Skeleton height="1rem" width="150px" />
      <Skeleton height="120px" />
    </div>

    {/* Buttons skeleton */}
    <div className="flex justify-end space-x-4">
      <Skeleton height="2.5rem" width="100px" />
      <Skeleton height="2.5rem" width="120px" />
    </div>
  </div>
);

// Card list skeleton
export const CardListSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <Skeleton height="150px" />
        <Skeleton height="1.5rem" width="80%" />
        <Skeleton height="1rem" width="60%" />
        <div className="flex justify-between">
          <Skeleton height="1rem" width="40%" />
          <Skeleton height="1rem" width="30%" />
        </div>
      </div>
    ))}
  </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {/* Header skeleton */}
    <div className="bg-gray-50 px-6 py-3 border-b">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {[...Array(columns)].map((_, index) => (
          <Skeleton key={index} height="1rem" width="80%" />
        ))}
      </div>
    </div>

    {/* Rows skeleton */}
    {[...Array(rows)].map((_, rowIndex) => (
      <div key={rowIndex} className="px-6 py-4 border-b border-gray-200">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[...Array(columns)].map((_, colIndex) => (
            <Skeleton key={colIndex} height="1rem" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Movie card skeleton
export const MovieCardSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
    {[...Array(count)].map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton height="200px" className="aspect-[2/3]" />
        <Skeleton height="1rem" />
        <Skeleton height="0.75rem" width="70%" />
      </div>
    ))}
  </div>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex items-center space-x-4">
      <Skeleton height="80px" width="80px" rounded />
      <div className="space-y-2">
        <Skeleton height="1.5rem" width="200px" />
        <Skeleton height="1rem" width="150px" />
      </div>
    </div>

    {/* Tabs skeleton */}
    <div className="flex space-x-4 border-b">
      {[...Array(3)].map((_, index) => (
        <Skeleton key={index} height="2rem" width="100px" />
      ))}
    </div>

    {/* Content skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height="1rem" width="120px" />
          <Skeleton height="2.5rem" />
        </div>
      ))}
    </div>
  </div>
);

// Loading wrapper component
export const LoadingWrapper = ({
  isLoading,
  skeleton: SkeletonComponent = FormSkeleton,
  skeletonProps = {},
  children,
}) => {
  if (isLoading) {
    return <SkeletonComponent {...skeletonProps} />;
  }

  return children;
};
