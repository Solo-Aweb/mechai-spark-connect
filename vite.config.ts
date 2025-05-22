
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import fs from 'fs';
import { exec } from 'child_process';

// Copy OpenCascade WASM files to public directory during build
const copyOpenCascadeFiles = () => {
  return {
    name: 'copy-opencascade-wasm',
    buildStart: async () => {
      const sourceDir = path.resolve(__dirname, 'node_modules/opencascade.js/dist');
      const targetDir = path.resolve(__dirname, 'public/opencascade');
      
      // Create target directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Copy the WASM files
      const filesToCopy = [
        'opencascade.wasm.js',
        'opencascade.wasm.wasm'
      ];
      
      filesToCopy.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Copied ${sourcePath} to ${targetPath}`);
        } else {
          console.warn(`Warning: Source file not found: ${sourcePath}`);
        }
      });
    }
  };
};

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
    copyOpenCascadeFiles(),
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
  },
  // Make sure all WebAssembly assets are properly handled
  publicDir: 'public',
}));
