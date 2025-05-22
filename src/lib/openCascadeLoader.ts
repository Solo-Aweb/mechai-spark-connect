
// Dynamic import for OpenCascade.js
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // Use dynamic import with a full path - this is the crucial change
    const oc = await import('/node_modules/opencascade.js/dist/opencascade.wasm.js')
      .then(module => {
        console.log('OpenCascade module loaded successfully');
        
        // Initialize the module based on its export pattern
        if (typeof module.default === 'function') {
          return module.default();
        } else if (typeof module.init === 'function') {
          return module.init();
        } else {
          throw new Error('Invalid OpenCascade.js module structure');
        }
      });
    
    console.log('OpenCascade.js initialized:', oc);
    return oc;
    
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
