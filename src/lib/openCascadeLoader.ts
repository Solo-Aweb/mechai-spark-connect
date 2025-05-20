
// Dynamic import for OpenCascade.js
export default async function OpenCascadeInstance() {
  try {
    // Using dynamic import to properly handle WebAssembly
    // The ?init suffix tells Vite to initialize the WASM module
    const module = await import('opencascade.js?init');
    
    // Ensure we return the initialized instance with proper methods
    const instance = module.default ? await module.default() : await module();
    return instance;
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    throw error;
  }
}
