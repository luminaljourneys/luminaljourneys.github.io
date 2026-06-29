import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Vite 8 / Rolldown requires manualChunks to be a function, not an object.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("firebase/firestore")) return "firebase-firestore";
          if (id.includes("firebase/auth")) return "firebase-auth";
          if (id.includes("firebase/app") || id.includes("@firebase")) return "firebase-app";
          if (id.includes("react") || id.includes("react-dom")) return "react-vendor";
        },
      },
    },
  },
});