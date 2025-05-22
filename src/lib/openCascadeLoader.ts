
import { toast } from 'sonner';
import opencascade from 'opencascade.js/dist/opencascade.full.js';
import opencascadeWasm from 'opencascade.js/dist/opencascade.full.wasm?url';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    console.log('Using WASM URL:', opencascadeWasm);
    
    // Initialize OpenCascade with the explicit WASM path
    const oc = await opencascade({
      locateFile: () => opencascadeWasm,
    });
    
    console.log('OpenCascade.js initialized successfully');
    return oc;
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
