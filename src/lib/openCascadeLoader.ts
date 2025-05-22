
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // Get the base URL to determine where the wasm files are
    const baseUrl = window.location.origin;
    const wasmPath = `${baseUrl}/opencascade/opencascade.wasm.js`;
    
    console.log('Loading OpenCascade from:', wasmPath);
    
    // Load the OpenCascade module
    const OpenCascadeModule = await import('opencascade.js');
    
    // Call the init function with locateFile config
    const oc = await OpenCascadeModule.default({
      // The locateFile function is called by the emscripten loader
      // to determine where to fetch the wasm binary files
      locateFile: (path, scriptDirectory) => {
        console.log(`Locating file: ${path} from script dir: ${scriptDirectory}`);
        
        if (path.endsWith('.wasm')) {
          // Return the absolute path to the wasm file in the public directory
          return `${baseUrl}/opencascade/opencascade.wasm.wasm`;
        }
        // Default behavior for other files
        return scriptDirectory + path;
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
