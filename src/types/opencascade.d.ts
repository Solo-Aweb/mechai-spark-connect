
declare module 'opencascade.js' {
  export default function OpenCascadeInstance(): Promise<{
    readSTEP: (buffer: ArrayBuffer) => any;
    toThreejsMesh: (shape: any) => {
      geometry: THREE.BufferGeometry;
      mesh?: THREE.Mesh;
    };
  }>;
}

// Add support for the ?init suffix
declare module 'opencascade.js?init' {
  function init(): Promise<{
    readSTEP: (buffer: ArrayBuffer) => any;
    toThreejsMesh: (shape: any) => {
      geometry: THREE.BufferGeometry;
      mesh?: THREE.Mesh;
    };
  }>;
  export default init;
}
