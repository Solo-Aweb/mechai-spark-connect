
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(), // Add top level await support for WebAssembly
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "opencascade.js": path.resolve(__dirname, "node_modules/opencascade.js"),
    },
    preserveSymlinks: true,
  },
  optimizeDeps: {
    exclude: ['opencascade.js'],
    include: ['three'],
  },
  build: {
    target: 'esnext', // Required for WebAssembly support
    assetsInlineLimit: 0, // Don't inline WebAssembly files
    sourcemap: true, // Enable sourcemaps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three']
        }
      }
    }
  },
}));
