
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist/build/pdf.worker.js';

interface PdfViewerProps {
  url: string;
}

export const PdfViewer = ({ url }: PdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !url) {
      setError('Canvas not available');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        // Get the original viewport dimensions
        const viewport = page.getViewport({ scale: 1 });
        
        // Determine the scale to fit within the container width
        const containerWidth = containerRef.current.clientWidth;
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        // Set canvas dimensions
        const canvas = canvasRef.current;
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.display = 'block';
        
        const context = canvas.getContext('2d');
        if (!context) {
          setError('Canvas 2D context not available');
          setIsLoading(false);
          return;
        }
        
        // Render PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        console.log('PDF rendered to canvas');
        
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error rendering PDF:', error);
        setError('Failed to render PDF file');
        setIsLoading(false);
      }
    };

    loadPdf();
    
    // No specific cleanup needed
  }, [url]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading PDF file...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          className="mx-auto" 
          style={{ display: !isLoading && !error ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
};
