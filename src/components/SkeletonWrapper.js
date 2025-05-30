import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonWrapper = ({ loading, children, count = 1, height = 20, width, className }) => {
  return loading ? (
    <SkeletonTheme baseColor="#2d3748" highlightColor="#4a5568">
      <Skeleton
        count={count}
        height={height}
        width={width}
        className={`${className} skeleton-animation`}
      />
    </SkeletonTheme>
  ) : (
    children
  );
};

export default SkeletonWrapper;
