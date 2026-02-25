import React from "react";
import { useLoading } from "../../context/UnifiedLoadingContext";
import {
  Skeleton,
  FormSkeleton,
  CardListSkeleton,
  TableSkeleton,
  MovieCardSkeleton,
  ProfileSkeleton,
  LoadingWrapper,
} from "./Skeleton";

// Hook để sử dụng skeleton loading dễ dàng
export const useSkeletonLoading = (loadingKey, skeletonType = "form") => {
  const { isLoading } = useLoading();

  const SkeletonComponent =
    {
      form: FormSkeleton,
      cards: CardListSkeleton,
      table: TableSkeleton,
      movies: MovieCardSkeleton,
      profile: ProfileSkeleton,
    }[skeletonType] || FormSkeleton;

  return {
    isLoading: isLoading(loadingKey),
    SkeletonComponent,
    wrap: (children, props = {}) => (
      <LoadingWrapper
        isLoading={isLoading(loadingKey)}
        skeleton={SkeletonComponent}
        skeletonProps={props}
      >
        {children}
      </LoadingWrapper>
    ),
  };
};

// Component wrapper đơn giản cho các trang thông thường
export const PageSkeleton = ({
  isLoading,
  children,
  type = "form",
  ...props
}) => (
  <LoadingWrapper
    isLoading={isLoading}
    skeleton={
      type === "form"
        ? FormSkeleton
        : type === "cards"
          ? CardListSkeleton
          : type === "table"
            ? TableSkeleton
            : type === "movies"
              ? MovieCardSkeleton
              : type === "profile"
                ? ProfileSkeleton
                : FormSkeleton
    }
    skeletonProps={props}
  >
    {children}
  </LoadingWrapper>
);

// Export all components
export {
  Skeleton,
  FormSkeleton,
  CardListSkeleton,
  TableSkeleton,
  MovieCardSkeleton,
  ProfileSkeleton,
  LoadingWrapper,
};
