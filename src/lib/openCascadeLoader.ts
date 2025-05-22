
// Dynamic import for OpenCascade.js
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // Try to load via direct path first (production build)
    try {
      const directModule = await import('/node_modules/opencascade.js/dist/opencascade.wasm.js');
      console.log('OpenCascade module loaded via direct path');
      
      const oc = await (typeof directModule.default === 'function' 
        ? directModule.default() 
        : directModule.init());
        
      console.log('OpenCascade.js initialized successfully');
      return oc;
    } catch (directImportError) {
      console.log('Direct import failed, falling back to module import', directImportError);
      
      // Fall back to regular import
      const opencascadeModule = await import('opencascade.js');
      console.log('OpenCascade module loaded via module import');
      
      const oc = await (typeof opencascadeModule.default === 'function' 
        ? opencascadeModule.default() 
        : opencascadeModule.init());
        
      console.log('OpenCascade.js initialized successfully');
      return oc;
    }
    
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
