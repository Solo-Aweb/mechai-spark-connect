
import { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as pdfjsLib from 'pdfjs-dist';

// Explicitly set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
}

export const PdfViewer = ({ url }: PdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1);

  // Load the PDF document
  useEffect(() => {
    if (!url) {
      setError('No PDF URL provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Clean up any previous document
    if (pdfDocument) {
      pdfDocument.destroy();
    }

    const loadPdfDocument = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
        setIsLoading(false);
      }
    };

    loadPdfDocument();

    // Cleanup function
    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
        setPdfDocument(null);
      }
    };
  }, [url]);

  // Render current page whenever it changes or when the document/scale changes
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current || !containerRef.current) return;

      try {
        setIsLoading(true);
        const page = await pdfDocument.getPage(currentPage);
        
        // Get the container width for responsive sizing
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        // Get the original viewport dimensions
        const originalViewport = page.getViewport({ scale: 1 });
        
        // Calculate scale to fit width with some padding
        const widthScale = (containerWidth - 40) / originalViewport.width;
        const heightScale = (containerHeight - 40) / originalViewport.height;
        
        // Choose the smaller scale to ensure PDF fits in container
        const fitScale = Math.min(widthScale, heightScale, 1);
        
        // Apply user-defined zoom on top of fit scale
        const adjustedScale = scale * fitScale;
        
        // Create viewport with adjusted scale
        const scaledViewport = page.getViewport({ scale: adjustedScale });
        
        // Set canvas dimensions
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) {
          setError('Canvas 2D context not available');
          setIsLoading(false);
          return;
        }
        
        // Set explicit dimensions on the canvas
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
        
        // Render PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        setIsLoading(false);
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Failed to render PDF page');
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, scale]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (pdfDocument) {
        // Force re-render when container resizes
        setScale(prevScale => prevScale);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDocument]);

  // Navigation handlers
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Zoom handlers
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* PDF Controls */}
      {totalPages > 0 && (
        <div className="p-2 bg-gray-100 flex items-center justify-between border-b">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousPage} 
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextPage} 
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              -
            </Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              +
            </Button>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-grow relative overflow-auto">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading PDF...</span>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        
        <div 
          ref={containerRef} 
          className="w-full h-full flex items-center justify-center p-4 overflow-auto"
        >
          <canvas 
            ref={canvasRef} 
            className="mx-auto shadow-lg" 
          />
        </div>
      </div>
    </div>
  );
};
