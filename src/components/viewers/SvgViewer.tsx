
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
      // For direct SVG, we'll create an iframe to display it
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
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
