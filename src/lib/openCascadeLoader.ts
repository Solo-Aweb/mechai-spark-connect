
// Dynamic import for OpenCascade.js
export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    // Using dynamic import with the proper suffix for WebAssembly initialization
    const module = await import('opencascade.js');
    
    // Handle the correct initialization of the module
    if (module.default && typeof module.default === 'function') {
      console.log('Initializing OpenCascade.js via default export...');
      return await module.default();
    } else if (typeof module === 'object' && module.init && typeof module.init === 'function') {
      console.log('Initializing OpenCascade.js via init function...');
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
