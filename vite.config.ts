
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
      // Define a specific alias for opencascade.js with an absolute path
      "opencascade.js": path.resolve(__dirname, "node_modules/opencascade.js/dist/opencascade.wasm.js"),
    },
    // Enable nodeModules resolution to fix bare imports issue
    preserveSymlinks: true,
  },
  optimizeDeps: {
    exclude: ['opencascade.js'],
    // Include OpenCascade.js in the optimization
    include: ['three'],
  },
  build: {
    target: 'esnext', // Required for WebAssembly support
    // Improve handling of WebAssembly and large modules
    rollupOptions: {
      output: {
        manualChunks: {
          'opencascade': ['opencascade.js'],
          'three': ['three']
        }
      }
    }
  },
}));
