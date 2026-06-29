import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase split into own chunks — loaded async, not on first paint
          "firebase-app":       ["firebase/app"],
          "firebase-firestore": ["firebase/firestore"],
          "firebase-auth":      ["firebase/auth"],
          // React core
          "react-vendor":       ["react", "react-dom"],
        },
      },
    },
  },
});