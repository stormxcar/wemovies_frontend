import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ include: /\.(jsx|js)$/ })],
  resolve: {
    alias: {
      "@toast": fileURLToPath(
        new URL("./src/lib/toastCompat.jsx", import.meta.url),
      ),
    },
  },
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
