
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

// Allow wildcard imports for OpenCascade module
declare module '*/opencascade.wasm.js' {
  import { OpenCascadeInstance } from 'opencascade.js';
  
  export function init(): Promise<OpenCascadeInstance>;
  export default function (): Promise<OpenCascadeInstance>;
}
