
declare module 'opencascade.js' {
  // Proper interface for OpenCascade.js module
  interface OpenCascadeInstance {
    readSTEP: (buffer: ArrayBuffer) => any;
    toThreejsMesh: (shape: any) => {
      geometry: THREE.BufferGeometry;
      mesh?: THREE.Mesh;
    };
  }

  // Export pattern for the init function
  export function init(): Promise<OpenCascadeInstance>;
  export default function init(): Promise<OpenCascadeInstance>;
}
