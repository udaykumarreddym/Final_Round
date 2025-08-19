import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      "/ingest": "http://127.0.0.1:8000",
      "/search": "http://127.0.0.1:8000",
      "/insights": "http://127.0.0.1:8000",
      "/podcast": "http://127.0.0.1:8000",
      "/config/adobe-key": "http://127.0.0.1:8000",
    },
  },
});
