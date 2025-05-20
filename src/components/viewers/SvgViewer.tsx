
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface SvgViewerProps {
  url: string;
}

export const SvgViewer = ({ url }: SvgViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Create an object element instead of an iframe to display the SVG
      const object = document.createElement('object');
      object.data = url;
      object.type = 'image/svg+xml';
      object.style.width = '100%';
      object.style.height = '100%';
      
      object.onload = () => setIsLoading(false);
      object.onerror = () => {
        setError('Failed to load SVG file');
        setIsLoading(false);
      };
      
      // Clear container and append object
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
      containerRef.current.appendChild(object);
      
    } catch (error) {
      console.error('Error displaying SVG:', error);
      setError('Failed to display SVG file');
      setIsLoading(false);
    }
    
    // No specific cleanup needed
  }, [url]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading SVG file...</span>
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
