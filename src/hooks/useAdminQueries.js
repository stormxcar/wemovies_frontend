import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
    select: (data) => (Array.isArray(data) ? data : []),
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
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    select: (data) => (Array.isArray(data) ? data : []),
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
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    select: (data) => (Array.isArray(data) ? data : []),
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
  return useQuery({
    queryKey: ["types"],
    queryFn: fetchMovieType,
    select: (data) => (Array.isArray(data) ? data : []),
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
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    select: (data) => (Array.isArray(data) ? data : []),
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
