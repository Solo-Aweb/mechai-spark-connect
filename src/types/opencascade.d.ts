
declare module 'opencascade.js/dist/opencascade.full.js' {
  // Configuration options for the OpenCascade initializer
  interface OpenCascadeInitOptions {
    locateFile?: (path: string, scriptDirectory?: string) => string;
    [key: string]: any;
  }
  
  // Proper interface for OpenCascade.js module
  interface OpenCascadeInstance {
    readSTEP: (buffer: ArrayBuffer) => any;
    toThreejsMesh: (shape: any) => {
      geometry: THREE.BufferGeometry;
      mesh?: THREE.Mesh;
    };
    // Add any other methods you might use
  }

  // Default export is the init function
  export default function(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
}

// Global declaration for runtime loaded OpenCascade
declare global {
  interface Window {
    opencascade?: (options?: any) => Promise<any>;
  }
}

// Allow importing WASM file directly with URL query
declare module '*.wasm?url' {
  const src: string;
  export default src;
}
