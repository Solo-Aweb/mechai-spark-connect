
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { toast } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

interface ModelViewerProps {
  url: string;
  fileType: string;
}

export const ModelViewer = ({ url, fileType }: ModelViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;
    
    setIsLoading(true);
    setError(null);
    
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Camera setup
    const width = containerRef.current.clientWidth;
    const height = 400;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    
    // Clear container
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    containerRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    // Load 3D model based on file type
    const fileExtension = fileType.toLowerCase();
    
    if (fileExtension === 'stl') {
      const loader = new STLLoader();
      loader.load(
        url,
        (geometry) => {
          const material = new THREE.MeshPhongMaterial({ 
            color: 0x3f88c5, 
            specular: 0x111111, 
            shininess: 200 
          });
          const mesh = new THREE.Mesh(geometry, material);
          
          // Center the model
          geometry.computeBoundingBox();
          const center = new THREE.Vector3();
          geometry.boundingBox?.getCenter(center);
          mesh.position.sub(center);
          
          scene.add(mesh);
          
          // Set camera position based on model size
          if (geometry.boundingBox) {
            const box = geometry.boundingBox;
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            camera.position.z = maxDim * 2.5;
          }
          
          setIsLoading(false);
        },
        undefined,
        (error) => {
          console.error('Error loading STL file:', error);
          setError('Failed to load STL file');
          setIsLoading(false);
        }
      );
    } else {
      setError(`File type .${fileExtension} preview is not supported yet`);
      setIsLoading(false);
    }
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.clear();
      renderer.dispose();
    };
  }, [url, fileType]);
  
  return (
    <div className="w-full h-[400px] bg-gray-100 rounded-md overflow-hidden">
      {isLoading && (
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading model...</span>
        </div>
      )}
      
      {error && (
        <div className="flex items-center justify-center w-full h-full text-red-500">
          {error}
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
