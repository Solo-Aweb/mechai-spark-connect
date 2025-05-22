
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // Import the module dynamically at runtime
    const opencascadeModule = await import('opencascade.js');
    
    // Get the initializer function
    const opencascade = opencascadeModule.default;
    
    console.log('OpenCascade.js module imported, initializing...');
    
    // Initialize OpenCascade with proper WASM loading configuration
    const oc = await opencascade({
      // This tells OpenCascade how to find its WASM file
      locateFile: (path) => {
        console.log('OpenCascade is looking for file:', path);
        // Make sure it gets the correct path from node_modules
        return `./node_modules/opencascade.js/dist/${path}`;
      }
    });
    
    console.log('OpenCascade.js initialized successfully');
    return oc;
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
