
import { toast } from 'sonner';

export default async function OpenCascadeInstance() {
  try {
    console.log('Attempting to load OpenCascade.js WebAssembly module...');
    
    // Load OpenCascade.js from CDN at runtime
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/opencascade.js@1.1.1/dist/opencascade.full.js';
    
    return new Promise((resolve, reject) => {
      script.onload = async () => {
        try {
          // Access the global opencascade function
          const opencascade = (window as any).opencascade;
          
          if (!opencascade) {
            throw new Error('OpenCascade.js not loaded properly');
          }
          
          console.log('OpenCascade.js module loaded, initializing...');
          
          // Initialize OpenCascade with proper WASM loading configuration
          const oc = await opencascade({
            // This tells OpenCascade how to find its WASM file
            locateFile: (path: string) => {
              console.log('OpenCascade is looking for file:', path);
              // Return the correct path for the WASM file
              if (path.endsWith('.wasm')) {
                return `https://unpkg.com/opencascade.js@1.1.1/dist/${path}`;
              }
              return path;
            }
          });
          
          console.log('OpenCascade.js initialized successfully');
          resolve(oc);
        } catch (error) {
          console.error('Error initializing OpenCascade:', error);
          reject(error);
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load OpenCascade.js script'));
      };
      
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('Error loading OpenCascade.js:', error);
    toast.error('Failed to load 3D model viewer');
    throw error;
  }
}
