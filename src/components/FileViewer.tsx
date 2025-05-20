
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
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
  
  return (
    <>
      {modelError ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-red-500">{modelError}</p>
        </div>
      ) : (
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          style={{ width: '100%', height: '400px' }}
        >
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <STLModel 
            url={url} 
            onError={(err) => setModelError(`Failed to load 3D model: ${err}`)}
          />
          <OrbitControls enableDamping autoRotate={false} />
        </Canvas>
      )}
    </>
  );
};

// STL model component using Three.js and react-three-fiber
const STLModel = ({ url, onError }: { url: string, onError: (err: string) => void }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  
  useEffect(() => {
    const loader = new STLLoader();
    
    loader.load(
      url,
      (loadedGeometry) => {
        // Center the model
        loadedGeometry.computeBoundingBox();
        if (loadedGeometry.boundingBox) {
          const center = new THREE.Vector3();
          loadedGeometry.boundingBox.getCenter(center);
          loadedGeometry.translate(-center.x, -center.y, -center.z);
        }
        
        setGeometry(loadedGeometry);
      },
      undefined,
      (error) => {
        console.error('Error loading STL:', error);
        onError('Failed to load STL file');
      }
    );
  }, [url, onError]);
  
  if (!geometry) return null;
  
  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial 
        color={0x3f88c5}
        specular={0x111111}
        shininess={200}
      />
    </mesh>
  );
};
