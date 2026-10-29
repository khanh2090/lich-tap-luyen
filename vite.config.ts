import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Relative base so the build works both locally and under /<repo>/ on GitHub Pages.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  server: { port: 5181, strictPort: true },
});
