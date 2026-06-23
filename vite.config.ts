import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the build works whether it's served from the domain root
  // or an FTP subfolder (e.g. example.com/hichord/).
  base: "./",
  plugins: [react()],
  server: {
    host: true,
  },
});
