
// Dynamic import for OpenCascade.js
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // First attempt: Standard package import
    try {
      console.log('Loading OpenCascade via package import');
      const opencascadeModule = await import('opencascade.js');
      
      const oc = await (typeof opencascadeModule.default === 'function' 
        ? opencascadeModule.default() 
        : opencascadeModule.init());
        
      console.log('OpenCascade.js initialized successfully via package import');
      return oc;
    } catch (firstError) {
      console.log('First import attempt failed:', firstError);
      
      // Second attempt: Try with relative path
      try {
        console.log('Trying with relative path');
        // Use vite's special syntax for dynamic imports
        const directModule = await import(/* @vite-ignore */ './node_modules/opencascade.js/dist/opencascade.wasm.js');
        
        const oc = await (typeof directModule.default === 'function' 
          ? directModule.default() 
          : directModule.init());
          
        console.log('OpenCascade.js initialized successfully via relative path');
        return oc;
      } catch (secondError) {
        console.log('Second import attempt failed:', secondError);
        
        // Third attempt: Try with document base URL for production
        try {
          // Get the base URL of the current document
          const baseUrl = document.baseURI.split('/').slice(0, -1).join('/');
          const wasmPath = `${baseUrl}/node_modules/opencascade.js/dist/opencascade.wasm.js`;
          
          console.log('Trying with base URL path:', wasmPath);
          const baseUrlModule = await import(/* @vite-ignore */ wasmPath);
          
          const oc = await (typeof baseUrlModule.default === 'function' 
            ? baseUrlModule.default() 
            : baseUrlModule.init());
            
          console.log('OpenCascade.js initialized successfully via base URL path');
          return oc;
        } catch (thirdError) {
          console.log('Third import attempt failed:', thirdError);
          throw new Error(`Failed to load OpenCascade.js module: ${thirdError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
