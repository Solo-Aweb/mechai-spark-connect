
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { Loader2 } from 'lucide-react';

interface StlViewerProps {
  url: string;
}

export const StlViewer = ({ url }: StlViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;
    
    setIsLoading(true);
    setError(null);

    // Set up the Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    // Set up camera
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    
    // Clear container and add renderer
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    
    // Variable to store the mesh for cleanup
    let mesh: THREE.Mesh | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let material: THREE.Material | null = null;
    
    // Load STL model
    const loader = new STLLoader();
    loader.load(
      url,
      (loadedGeometry) => {
        geometry = loadedGeometry;
        material = new THREE.MeshPhongMaterial({
          color: 0x3f88c5,
          specular: 0x111111,
          shininess: 200
        });
        
        mesh = new THREE.Mesh(geometry, material);
        
        // Center the model
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        if (geometry.boundingBox) {
          geometry.boundingBox.getCenter(center);
          mesh.position.sub(center);
        }
        
        scene.add(mesh);
        
        // Set up orbit controls manually
        let isMouseDown = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        const handleMouseDown = (e: MouseEvent) => {
          isMouseDown = true;
          previousMousePosition = {
            x: e.clientX,
            y: e.clientY
          };
        };
        
        const handleMouseMove = (e: MouseEvent) => {
          if (!isMouseDown || !mesh) return;
          
          const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
          };
          
          const rotationSpeed = 0.01;
          mesh.rotation.y += deltaMove.x * rotationSpeed;
          mesh.rotation.x += deltaMove.y * rotationSpeed;
          
          previousMousePosition = {
            x: e.clientX,
            y: e.clientY
          };
        };
        
        const handleMouseUp = () => {
          isMouseDown = false;
        };
        
        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          
          // Adjust camera position based on wheel delta
          camera.position.z += (e.deltaY > 0) ? 0.5 : -0.5;
          
          // Limit zoom range
          camera.position.z = Math.max(2, Math.min(10, camera.position.z));
        };
        
        // Add event listeners
        renderer.domElement.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        renderer.domElement.addEventListener('wheel', handleWheel);
        
        // Animation loop
        const animate = () => {
          if (!containerRef.current) return; // Stop animation if component is unmounted
          
          requestAnimationFrame(animate);
          
          // Add slight rotation when not being manipulated
          if (!isMouseDown && mesh) {
            mesh.rotation.y += 0.001;
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        setIsLoading(false);
      },
      undefined,
      (loadError) => {
        console.error('Error loading STL:', loadError);
        setError('Failed to load STL model');
        setIsLoading(false);
      }
    );
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight || 400;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Remove event listeners
      renderer.domElement.removeEventListener('mousedown', () => {});
      document.removeEventListener('mousemove', () => {});
      document.removeEventListener('mouseup', () => {});
      renderer.domElement.removeEventListener('wheel', () => {});
      
      // Dispose of Three.js resources
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [url]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading STL model...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
