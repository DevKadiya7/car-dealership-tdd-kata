import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind to 0.0.0.0 so the dev server is reachable from outside localhost
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  },
});
