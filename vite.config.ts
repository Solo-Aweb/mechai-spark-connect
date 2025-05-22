
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    preserveSymlinks: true,
  },
  optimizeDeps: {
    exclude: ['opencascade.js'],
  },
  build: {
    target: 'esnext', // Required for WebAssembly support
    assetsInlineLimit: 0, // Don't inline WebAssembly files
    sourcemap: true, // Enable sourcemaps for debugging
    rollupOptions: {
      // Explicitly mark wasm files as external to prevent Rollup from trying to bundle them
      external: [/\.wasm$/],
    },
  },
}));
