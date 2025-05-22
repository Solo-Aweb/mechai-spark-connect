
// Dynamic import for OpenCascade.js
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // Try different import approaches
    try {
      // Use a relative path for imports - this works better with TypeScript
      console.log('Loading OpenCascade via package import');
      const opencascadeModule = await import('opencascade.js');
      
      const oc = await (typeof opencascadeModule.default === 'function' 
        ? opencascadeModule.default() 
        : opencascadeModule.init());
        
      console.log('OpenCascade.js initialized successfully via package import');
      return oc;
    } catch (firstError) {
      console.log('First import attempt failed, trying alternative method', firstError);
      
      // Use dynamic import with proper relative path - this is essential for TypeScript
      // Starting with "./" makes it a proper relative import rather than a bare specifier
      const modulePath = './node_modules/opencascade.js/dist/opencascade.wasm.js';
      console.log('Attempting dynamic import with proper path: ', modulePath);
      
      try {
        const directModule = await import(/* @vite-ignore */ modulePath);
        
        const oc = await (typeof directModule.default === 'function' 
          ? directModule.default() 
          : directModule.init());
          
        console.log('OpenCascade.js initialized successfully via dynamic import');
        return oc;
      } catch (dynamicImportError) {
        console.error('Dynamic import failed:', dynamicImportError);
        
        // Last resort - try with absolute path
        const absolutePath = '/node_modules/opencascade.js/dist/opencascade.wasm.js';
        console.log('Attempting with absolute path:', absolutePath);
        
        const lastResortModule = await import(/* @vite-ignore */ absolutePath);
        const oc = await (typeof lastResortModule.default === 'function' 
          ? lastResortModule.default() 
          : lastResortModule.init());
          
        console.log('OpenCascade.js initialized successfully via absolute path');
        return oc;
      }
    }
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
