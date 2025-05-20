
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configure WebAssembly loading directly in Vite
  optimizeDeps: {
    // This ensures Vite doesn't try to bundle WASM files
    exclude: ['opencascade.js'],
  },
  build: {
    // Properly handle WASM files during build
    rollupOptions: {
      external: ['opencascade.js'],
    },
  },
}));
