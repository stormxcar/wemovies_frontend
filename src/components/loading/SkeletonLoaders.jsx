import React from "react";

// Skeleton for movie cards
export const SkeletonMovieCard = ({ count = 1 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="group relative overflow-hidden rounded-lg bg-gray-800">
            {/* Movie poster skeleton */}
            <div className="aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-800 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
              {/* Play icon placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-600 rounded-full opacity-30"></div>
              </div>
            </div>

            {/* Title and info skeleton */}
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              <div className="flex items-center space-x-2">
                <div className="h-3 bg-gray-700 rounded w-12"></div>
                <div className="h-3 bg-gray-700 rounded w-16"></div>
              </div>
            </div>

            {/* Quality badge skeleton */}
            <div className="absolute top-2 right-2 w-8 h-5 bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </>
  );
};

// Skeleton for movie list items
export const SkeletonMovieList = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          className="animate-pulse flex items-center space-x-4 p-4 bg-gray-800 rounded-lg"
        >
          {/* Thumbnail skeleton */}
          <div className="w-16 h-24 bg-gray-700 rounded flex-shrink-0"></div>

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="flex items-center space-x-3">
              <div className="h-3 bg-gray-700 rounded w-16"></div>
              <div className="h-3 bg-gray-700 rounded w-20"></div>
              <div className="h-3 bg-gray-700 rounded w-12"></div>
            </div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex flex-col space-y-2">
            <div className="w-8 h-8 bg-gray-700 rounded"></div>
            <div className="w-8 h-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton for movie detail page
export const SkeletonMovieDetail = () => {
  return (
    <div className="animate-pulse">
      {/* Hero section skeleton */}
      <div className="relative h-96 bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex items-end space-x-6">
            {/* Poster skeleton */}
            <div className="w-48 h-72 bg-gray-700 rounded-lg flex-shrink-0"></div>

            {/* Info skeleton */}
            <div className="space-y-4 text-white">
              <div className="h-8 bg-gray-700 rounded w-96"></div>
              <div className="h-5 bg-gray-700 rounded w-64"></div>
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-700 rounded w-24"></div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="w-20 h-10 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content section skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>

            {/* Episodes skeleton */}
            <div>
              <div className="h-6 bg-gray-700 rounded w-40 mb-4"></div>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div>
              <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>

            {/* Related movies */}
            <div>
              <div className="h-6 bg-gray-700 rounded w-40 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-12 h-16 bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for horizontal movie sliders
export const SkeletonMovieSlider = ({ title = true }) => {
  return (
    <div className="animate-pulse space-y-4">
      {title && <div className="h-6 bg-gray-700 rounded w-48"></div>}
      <div className="flex space-x-4 overflow-hidden">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex-shrink-0 w-48">
            <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-2"></div>
            <div className="h-4 bg-gray-700 rounded mb-1"></div>
            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton for banner/hero section
export const SkeletonBanner = () => {
  return (
    <div className="animate-pulse relative h-96 bg-gradient-to-r from-gray-800 to-gray-700 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      <div className="container mx-auto px-4 h-full flex items-center">
        <div className="max-w-md space-y-4 text-white">
          <div className="h-8 bg-gray-600 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-600 rounded w-2/3"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-32 h-10 bg-gray-600 rounded"></div>
            <div className="w-10 h-10 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 right-20 w-4 h-4 bg-gray-600 rounded-full opacity-30"></div>
      <div className="absolute bottom-20 right-32 w-2 h-2 bg-gray-600 rounded-full opacity-40"></div>
      <div className="absolute top-1/2 right-10 w-3 h-3 bg-gray-600 rounded-full opacity-20"></div>
    </div>
  );
};

export default {
  SkeletonMovieCard,
  SkeletonMovieList,
  SkeletonMovieDetail,
  SkeletonMovieSlider,
  SkeletonBanner,
};
