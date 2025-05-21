import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Loader2 } from 'lucide-react';
import OpenCascadeInstance from '@/lib/openCascadeLoader';

interface StepViewerProps {
  url: string;
}

export const StepViewer = ({ url }: StepViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    let cleanup: (() => void) | undefined;

    const loadStep = async () => {
      try {
        console.log('Loading STEP file from URL:', url);

        // Fetch the STEP file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch STEP file: ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        console.log('STEP file fetched, size:', buffer.byteLength);

        // Load OpenCascade using our loader
        const occ = await OpenCascadeInstance();
        console.log('OpenCascade loaded', occ);

        // Read the STEP file
        const shape = occ.readSTEP(buffer);
        console.log('STEP file parsed:', shape);

        // Convert to Three.js mesh
        const mesh = occ.toThreejsMesh(shape);
        console.log('Converted to Three.js mesh:', mesh);

        // Clear container
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }

        // Setup Three.js scene
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
        container.appendChild(renderer.domElement);
        
        // Add the mesh to the scene
        const material = new THREE.MeshPhongMaterial({
          color: 0x3f88c5,
          specular: 0x111111,
          shininess: 200
        });

        // Use the mesh geometry from OpenCascade
        const stepMesh = new THREE.Mesh(mesh.geometry, material);
        
        // Center the model
        const box = new THREE.Box3().setFromObject(stepMesh);
        const center = box.getCenter(new THREE.Vector3());
        stepMesh.position.sub(center);
        
        scene.add(stepMesh);
        
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
          if (!isMouseDown) return;
          
          const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
          };
          
          const rotationSpeed = 0.01;
          stepMesh.rotation.y += deltaMove.x * rotationSpeed;
          stepMesh.rotation.x += deltaMove.y * rotationSpeed;
          
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
          requestAnimationFrame(animate);
          
          // Add slight rotation when not being manipulated
          if (!isMouseDown) {
            stepMesh.rotation.y += 0.001;
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        setIsLoading(false);

        // Set up cleanup function
        cleanup = () => {
          renderer.domElement.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          renderer.domElement.removeEventListener('wheel', handleWheel);
          
          renderer.dispose();
          mesh.geometry.dispose();
          material.dispose();
          scene.clear();
        };

      } catch (error) {
        console.error('Error loading STEP file:', error);
        setError('Failed to load STEP model. See console for details.');
        setIsLoading(false);
      }
    };

    loadStep();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [url]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading STEP model...</span>
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
