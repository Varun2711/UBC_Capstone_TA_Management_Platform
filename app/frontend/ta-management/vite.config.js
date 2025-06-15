import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // server configuration to allow for interaction with nginx reverse proxy
  server: {
    host: true,
    port: 5173,
    allowedHosts: [".frontend"], // allow for the nginx frontend server to host
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      //vite specific, strictly specify protocol for hmr(hot module replacement)
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
  },
});
