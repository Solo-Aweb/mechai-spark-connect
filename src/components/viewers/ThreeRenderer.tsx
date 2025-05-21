
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { setupThreeScene, setupRenderer, setupCamera, centerMesh } from '@/utils/threeUtils';
import { useOrbitControls } from '@/hooks/useOrbitControls';

interface ThreeRendererProps {
  mesh: THREE.Mesh;
}

export const ThreeRenderer = ({ mesh }: ThreeRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [rendererState, setRendererState] = useState<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
  }>({ renderer: null, scene: null, camera: null });

  // Set up the Three.js scene
  useEffect(() => {
    if (!containerRef.current || !mesh) return;

    // Clean up container
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Setup scene
    const scene = setupThreeScene();
    
    // Setup renderer
    const { renderer, width, height } = setupRenderer(containerRef.current);
    
    // Setup camera
    const camera = setupCamera(width, height);
    
    // Center the model
    centerMesh(mesh);
    
    // Add mesh to scene
    scene.add(mesh);
    
    setRendererState({ renderer, scene, camera });
    setIsReady(true);

    // Return cleanup function
    return () => {
      if (renderer) renderer.dispose();
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material && mesh.material instanceof THREE.Material) mesh.material.dispose();
      if (scene) scene.clear();
    };
  }, [mesh]);

  // Add orbit controls
  const [isMouseDown, setIsMouseDown] = useState(false);
  const { animate } = useOrbitControls({
    renderer: rendererState.renderer as THREE.WebGLRenderer,
    camera: rendererState.camera as THREE.Camera,
    mesh: mesh
  });

  // Animation loop
  useEffect(() => {
    if (!isReady || !rendererState.renderer || !rendererState.scene || !rendererState.camera) return;

    const animationLoop = () => {
      const animationId = requestAnimationFrame(animationLoop);
      
      // Add slight rotation when not being manipulated
      animate(isMouseDown);
      
      rendererState.renderer!.render(rendererState.scene!, rendererState.camera!);
      
      return animationId;
    };
    
    const animationId = animationLoop();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isReady, rendererState, isMouseDown, animate]);

  return <div ref={containerRef} className="w-full h-full" />;
};
