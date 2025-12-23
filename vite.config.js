import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ include: /\.(jsx|js)$/ })],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://wemovies-backend.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.(js|jsx)$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
});
