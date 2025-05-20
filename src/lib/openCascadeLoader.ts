
// Dynamic import for OpenCascade.js
export default async function OpenCascadeInstance() {
  try {
    // Using dynamic import to properly handle WebAssembly
    // The ?init suffix tells Vite to initialize the WASM module
    // We're using a more TypeScript-friendly approach with explicit casting
    const module = await import('opencascade.js?init');
    return module.default || module;
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    throw error;
  }
}
