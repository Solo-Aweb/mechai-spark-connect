
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import DxfParser from 'dxf-parser';
import * as pdfjsLib from 'pdfjs-dist';
import { Canvg } from 'canvg';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FileViewerProps {
  url: string;
  fileType: string;
}

export const FileViewer = ({ url, fileType }: FileViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;
    
    setIsLoading(true);
    setError(null);

    const previewFile = async () => {
      try {
        switch (fileType.toLowerCase()) {
          case 'stl':
            // STL files are handled by the ModelRenderer component below
            setIsLoading(false);
            break;
          case 'step':
            // We'd normally use opencascade.js here, but for now we'll show a message
            setError('STEP files preview is coming soon');
            setIsLoading(false);
            break;
          case 'dxf':
            await previewDXF(url);
            break;
          case 'svg':
            await previewSVG(url);
            break;
          case 'pdf':
            await previewPDF(url);
            break;
          default:
            setError(`Unsupported format: ${fileType}`);
            setIsLoading(false);
        }
      } catch (err) {
        console.error(`Error previewing ${fileType} file:`, err);
        setError(`Failed to load ${fileType.toUpperCase()} file`);
        setIsLoading(false);
      }
    };

    previewFile();
    
    // Clean up
    return () => {
      // Any cleanup code here
    };
  }, [url, fileType]);

  const previewDXF = async (url: string) => {
    if (!containerRef.current) return;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch DXF file: ${response.statusText}`);
      }
      
      const dxfContent = await response.text();
      const parser = new DxfParser();
      const dxfData = parser.parseSync(dxfContent);
      
      // Create an SVG representation of the DXF data
      const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('width', '100%');
      svgElement.setAttribute('height', '100%');
      svgElement.style.backgroundColor = '#f0f0f0';
      
      // Extract bounds from DXF
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      // Process entities
      dxfData.entities.forEach((entity: any) => {
        if (entity.type === 'LINE') {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', entity.vertices[0].x.toString());
          line.setAttribute('y1', entity.vertices[0].y.toString());
          line.setAttribute('x2', entity.vertices[1].x.toString());
          line.setAttribute('y2', entity.vertices[1].y.toString());
          line.setAttribute('stroke', 'black');
          line.setAttribute('stroke-width', '1');
          
          svgElement.appendChild(line);
          
          // Update bounds
          minX = Math.min(minX, entity.vertices[0].x, entity.vertices[1].x);
          minY = Math.min(minY, entity.vertices[0].y, entity.vertices[1].y);
          maxX = Math.max(maxX, entity.vertices[0].x, entity.vertices[1].x);
          maxY = Math.max(maxY, entity.vertices[0].y, entity.vertices[1].y);
        }
      });
      
      // Set viewBox for proper scaling
      if (minX !== Infinity && minY !== Infinity && maxX !== -Infinity && maxY !== -Infinity) {
        const width = maxX - minX;
        const height = maxY - minY;
        const padding = Math.max(width, height) * 0.05; // 5% padding
        svgElement.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`);
      }
      
      // Clear container and append SVG
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(svgElement);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing DXF:', error);
      setError('Failed to parse DXF file');
      setIsLoading(false);
    }
  };

  const previewSVG = async (url: string) => {
    if (!containerRef.current) return;
    
    try {
      // For direct SVG, we'll create an iframe to display it
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.height = '400px';
      iframe.style.border = 'none';
      iframe.onload = () => setIsLoading(false);
      iframe.onerror = () => {
        setError('Failed to load SVG file');
        setIsLoading(false);
      };
      
      // Clear container and append iframe
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(iframe);
      
    } catch (error) {
      console.error('Error displaying SVG:', error);
      setError('Failed to display SVG file');
      setIsLoading(false);
    }
  };

  const previewPDF = async (url: string) => {
    if (!containerRef.current || !canvasRef.current) {
      setError('Canvas not available');
      setIsLoading(false);
      return;
    }
    
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      
      // Get the first page
      const page = await pdf.getPage(1);
      
      // Determine the scale to fit within the container width
      const containerWidth = containerRef.current.clientWidth;
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        setError('Canvas 2D context not available');
        setIsLoading(false);
        return;
      }
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      canvas.style.display = 'block';
      
      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };
      
      await page.render(renderContext).promise;
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error rendering PDF:', error);
      setError('Failed to render PDF file');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-gray-100 rounded-md overflow-hidden relative" style={{ height: '400px' }}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading preview...</span>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      {/* Container for 2D file previews */}
      <div 
        ref={containerRef} 
        className="w-full h-full" 
        style={{ display: fileType === 'stl' ? 'none' : 'block' }}
      />
      
      {/* Canvas for PDF rendering */}
      <canvas 
        ref={canvasRef} 
        className="mx-auto" 
        style={{ display: fileType === 'pdf' && !isLoading && !error ? 'block' : 'none' }}
      />
      
      {/* 3D model renderer for STL files */}
      {fileType === 'stl' && !error && (
        <ModelRenderer url={url} />
      )}
    </div>
  );
};

// Separate component for 3D model rendering
const ModelRenderer = ({ url }: { url: string }) => {
  const [modelError, setModelError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
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
    
    // Load STL model
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
        if (geometry.boundingBox) {
          geometry.boundingBox.getCenter(center);
          mesh.position.sub(center);
        }
        
        scene.add(mesh);
        
        // Set up orbit controls manually
        let isMouseDown = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        const handleMouseDown = (e) => {
          isMouseDown = true;
          previousMousePosition = {
            x: e.clientX,
            y: e.clientY
          };
        };
        
        const handleMouseMove = (e) => {
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
        
        const handleWheel = (e) => {
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
            mesh.rotation.y += 0.001;
          }
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        // Cleanup function
        return () => {
          renderer.domElement.removeEventListener('mousedown', handleMouseDown);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          renderer.domElement.removeEventListener('wheel', handleWheel);
          
          renderer.dispose();
          geometry.dispose();
          material.dispose();
        };
      },
      undefined,
      (error) => {
        console.error('Error loading STL:', error);
        setModelError('Failed to load STL model');
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Dispose of Three.js resources
      renderer.dispose();
      scene.clear();
    };
  }, [url]);
  
  return (
    <div ref={containerRef} className="w-full h-full">
      {modelError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
          <p className="text-red-500">{modelError}</p>
        </div>
      )}
    </div>
  );
};
