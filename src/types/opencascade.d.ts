
declare module 'opencascade.js' {
  // Proper interface for OpenCascade.js module
  interface OpenCascadeInstance {
    readSTEP: (buffer: ArrayBuffer) => any;
    toThreejsMesh: (shape: any) => {
      geometry: THREE.BufferGeometry;
      mesh?: THREE.Mesh;
    };
    // Add any other methods you might use
  }

  // Export pattern for the init function
  export function init(): Promise<OpenCascadeInstance>;
  export default function init(): Promise<OpenCascadeInstance>;
}

// Allow imports from direct path to wasm file
declare module 'opencascade.js/dist/opencascade.wasm.js' {
  import { OpenCascadeInstance } from 'opencascade.js';
  
  export function init(): Promise<OpenCascadeInstance>;
  export default function (): Promise<OpenCascadeInstance>;
}

// Handle absolute path imports that might happen in production
declare module '/node_modules/opencascade.js/dist/opencascade.wasm.js' {
  import { OpenCascadeInstance } from 'opencascade.js';
  
  export function init(): Promise<OpenCascadeInstance>;
  export default function (): Promise<OpenCascadeInstance>;
}
