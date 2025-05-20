
// Dynamic import for OpenCascade.js
export default async function OpenCascadeInstance() {
  try {
    // Using dynamic import to properly handle WebAssembly
    // The ?init suffix tells Vite to initialize the WASM module
    const module = await import('opencascade.js?init');
    
    // Handle the correct initialization of the module
    if (module.default && typeof module.default === 'function') {
      return await module.default();
    } else if (typeof module === 'object' && module.init && typeof module.init === 'function') {
      return await module.init();
    } else {
      console.error('Unexpected module structure:', module);
      throw new Error('Failed to initialize OpenCascade: Invalid module structure');
    }
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    throw error;
  }
}
