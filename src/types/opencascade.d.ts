
declare module 'opencascade.js' {
  export default function init(): Promise<{
    readSTEP: (buffer: ArrayBuffer) => any;
    toThreejsMesh: (shape: any) => {
      geometry: THREE.BufferGeometry;
      mesh?: THREE.Mesh;
    };
  }>;
  
  export function init(): Promise<{
    readSTEP: (buffer: ArrayBuffer) => any;
    toThreejsMesh: (shape: any) => {
      geometry: THREE.BufferGeometry;
      mesh?: THREE.Mesh;
    };
  }>;
}

// No longer needed with vite-plugin-wasm
// declare module 'opencascade.js?init' {
//   export default function init(): Promise<any>;
//   export function init(): Promise<any>;
// }
