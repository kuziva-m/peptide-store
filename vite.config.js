import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase the warning limit to 1000kB (1MB) to silence the warning
    chunkSizeWarningLimit: 1000,
  },
});
