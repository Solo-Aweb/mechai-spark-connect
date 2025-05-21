
import { RefObject, useEffect } from 'react';
import * as THREE from 'three';

interface OrbitControlsProps {
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  mesh: THREE.Mesh;
}

export const useOrbitControls = ({ renderer, camera, mesh }: OrbitControlsProps) => {
  useEffect(() => {
    if (!renderer || !camera || !mesh) return;
    
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
    
    // Clean up function
    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
    };
  }, [renderer, camera, mesh]);

  // Return animation function that adds slight rotation when not being manipulated
  return {
    animate: (isMouseDown: boolean) => {
      if (!isMouseDown) {
        mesh.rotation.y += 0.001;
      }
    }
  };
};
