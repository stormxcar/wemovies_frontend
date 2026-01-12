import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import {
  fetchMovies,
  fetchCategories,
  fetchCountries,
  fetchMovieType,
  fetchUsers,
  deleteMovie,
  deleteCategory,
  deleteCountry,
  deleteType,
  deleteUser,
} from "../services/api";

// Movies queries
export const useMovies = () => {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
    select: (data) => (Array.isArray(data) ? data : []),
    enabled: isAuthenticated && user?.role?.roleName === "ADMIN", // Check role object
  });
};

export const useDeleteMovie = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
  });
};

// Categories queries
export const useCategories = () => {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    select: (data) => (Array.isArray(data) ? data : []),
    enabled: isAuthenticated && user?.role?.roleName === "ADMIN", // Check role object
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
};

// Countries queries
export const useCountries = () => {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    select: (data) => (Array.isArray(data) ? data : []),
    enabled: isAuthenticated && user?.role?.roleName === "ADMIN", // Check role object
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
};

// Types queries
export const useTypes = () => {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["types"],
    queryFn: fetchMovieType,
    select: (data) => (Array.isArray(data) ? data : []),
    enabled: isAuthenticated && user?.role?.roleName === "ADMIN", // Check role object
  });
};

export const useDeleteType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["types"] });
    },
  });
};

// Users queries
export const useUsers = () => {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    select: (data) => (Array.isArray(data) ? data : []),
    enabled: isAuthenticated && user?.role?.roleName === "ADMIN", // Check role object
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
