
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import OpenCascadeInstance from '@/lib/openCascadeLoader';
import { toast } from 'sonner';

export interface StepModelResult {
  mesh: THREE.Mesh | null;
  isLoading: boolean;
  error: string | null;
}

export const useStepModel = (url: string): StepModelResult => {
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
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

        // Try to load OpenCascade with improved error handling
        try {
          // Load OpenCascade using our loader
          const occ = await OpenCascadeInstance();
          console.log('OpenCascade loaded successfully');

          if (!mounted) return;

          // Read the STEP file
          const shape = occ.readSTEP(buffer);
          console.log('STEP file parsed successfully');

          // Convert to Three.js mesh
          const threeMesh = occ.toThreejsMesh(shape);
          console.log('Converted to Three.js mesh');
          
          // Create material and complete mesh
          const material = new THREE.MeshPhongMaterial({
            color: 0x3f88c5,
            specular: 0x111111,
            shininess: 200
          });

          // Create the final mesh with geometry from OpenCascade
          const stepMesh = new THREE.Mesh(threeMesh.geometry, material);
          if (mounted) {
            setMesh(stepMesh);
            setIsLoading(false);
            setError(null);
          }
        } catch (occError) {
          console.error('Error initializing OpenCascade:', occError);
          if (mounted) {
            setError(`Failed to initialize 3D model viewer: ${occError instanceof Error ? occError.message : String(occError)}`);
            setIsLoading(false);
            toast.error('Failed to initialize 3D model viewer');
          }
        }
      } catch (error: any) {
        console.error('Error loading STEP file:', error);
        if (mounted) {
          setError(error?.message || 'Failed to load STEP model. See console for details.');
          setIsLoading(false);
          toast.error('Failed to load STEP model');
        }
      }
    };

    loadStep();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [url]);

  return { mesh, isLoading, error };
};
