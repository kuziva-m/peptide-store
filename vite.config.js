import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Minify code heavily
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Removes console.logs from production
        drop_debugger: true,
      },
    },
    // 2. Chunking strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code (React, Router, etc.) into a separate file
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "react-helmet-async",
          ],
          // Split heavy UI icons into their own file
          icons: ["lucide-react"],
          // Split Supabase (database) logic
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
