
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
      
      // Use a dynamic import with a constructed URL
      // This bypasses TypeScript's static analysis while still allowing runtime loading
      const modulePath = 'opencascade.js/dist/opencascade.wasm.js';
      console.log('Attempting dynamic import with: ', modulePath);
      
      // Using Function constructor to bypass TypeScript's static analysis
      // This is a workaround for the TypeScript error
      const importModule = new Function('modulePath', 'return import(modulePath)');
      const directModule = await importModule(modulePath);
      
      const oc = await (typeof directModule.default === 'function' 
        ? directModule.default() 
        : directModule.init());
        
      console.log('OpenCascade.js initialized successfully via dynamic import');
      return oc;
    }
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
