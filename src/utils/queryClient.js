import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Provider component
export const QueryProvider = ({ children }) => {
  return createElement(QueryClientProvider, { client: queryClient }, children);
};
