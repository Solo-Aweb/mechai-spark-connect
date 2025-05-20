
declare module 'opencascade.js' {
  export default function OpenCascadeInstance(): Promise<{
    readSTEP: (buffer: ArrayBuffer) => any;
    toThreejsMesh: (shape: any) => {
      geometry: THREE.BufferGeometry;
      mesh?: THREE.Mesh;
    };
  }>;
}
