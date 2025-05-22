
// Dynamic import for OpenCascade.js
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // Use a direct import path to the node_modules package
    // This avoids the bare specifier issue
    const modulePath = '/node_modules/opencascade.js/dist/opencascade.wasm.js';
    console.log('Loading OpenCascade from path:', modulePath);
    
    const module = await import(/* @vite-ignore */ modulePath);
    console.log('OpenCascade module loaded:', module);
    
    if (module.default && typeof module.default === 'function') {
      console.log('Initializing OpenCascade.js via default export...');
      return module.default();
    } else if (module.init && typeof module.init === 'function') {
      console.log('Initializing OpenCascade.js via init function...');
      return module.init();
    } else {
      console.error('Unexpected module structure:', module);
      toast.error('Failed to initialize 3D viewer');
      throw new Error('Failed to initialize OpenCascade: Invalid module structure');
    }
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
