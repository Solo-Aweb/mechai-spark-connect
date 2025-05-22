
declare module 'opencascade.js' {
  // Configuration options for the OpenCascade initializer
  interface OpenCascadeInitOptions {
    locateFile?: (path: string, scriptDirectory: string) => string;
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

  // Export pattern for the init function
  export function init(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
  export default function init(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
}

// Allow imports from direct path to wasm file
declare module 'opencascade.js/dist/opencascade.wasm.js' {
  import { OpenCascadeInitOptions, OpenCascadeInstance } from 'opencascade.js';
  
  export function init(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
  export default function(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
}

// Handle dynamic imports with relative paths
declare module './node_modules/opencascade.js/dist/opencascade.wasm.js' {
  import { OpenCascadeInitOptions, OpenCascadeInstance } from 'opencascade.js';
  
  export function init(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
  export default function(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
}

// Handle dynamic imports with absolute paths
declare module '/node_modules/opencascade.js/dist/opencascade.wasm.js' {
  import { OpenCascadeInitOptions, OpenCascadeInstance } from 'opencascade.js';
  
  export function init(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
  export default function(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
}

// Handle any wasm module imports
declare module '*.wasm.js' {
  import { OpenCascadeInitOptions, OpenCascadeInstance } from 'opencascade.js';
  
  export function init(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
  export default function(options?: OpenCascadeInitOptions): Promise<OpenCascadeInstance>;
}
