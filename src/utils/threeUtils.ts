
import * as THREE from 'three';

// Setup a basic Three.js scene with lighting
export const setupThreeScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);
  
  return scene;
};

// Setup Three.js renderer
export const setupRenderer = (container: HTMLDivElement) => {
  const width = container.clientWidth;
  const height = container.clientHeight || 400;
  
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);
  
  return { renderer, width, height };
};

// Setup a perspective camera
export const setupCamera = (width: number, height: number) => {
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;
  return camera;
};

// Center a mesh based on its bounding box
export const centerMesh = (mesh: THREE.Mesh) => {
  const box = new THREE.Box3().setFromObject(mesh);
  const center = box.getCenter(new THREE.Vector3());
  mesh.position.sub(center);
};

// Create standard material for 3D models
export const createStandardMaterial = () => {
  return new THREE.MeshPhongMaterial({
    color: 0x3f88c5,
    specular: 0x111111,
    shininess: 200
  });
};
