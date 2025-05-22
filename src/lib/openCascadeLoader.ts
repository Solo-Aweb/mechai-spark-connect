
// Dynamic import for OpenCascade.js
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // Import the OpenCascade.js module using a relative path
    // This works better with bundlers and in production
    const opencascadeModule = await import('opencascade.js');
    console.log('OpenCascade module loaded successfully:', opencascadeModule);
    
    // Initialize the module
    const oc = await (typeof opencascadeModule.default === 'function' 
      ? opencascadeModule.default() 
      : opencascadeModule.init());
      
    console.log('OpenCascade.js initialized successfully');
    return oc;
    
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
