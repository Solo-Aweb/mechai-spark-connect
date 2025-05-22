
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

// Also allow direct import from the path
declare module '*/opencascade.wasm.js' {
  export * from 'opencascade.js';
  export { default } from 'opencascade.js';
}
