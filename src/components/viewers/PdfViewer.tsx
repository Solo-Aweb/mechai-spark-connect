
import { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';

// Set worker path for PDF.js
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

  // Render current page whenever it changes or when the document/container changes
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current || !containerRef.current) return;

      try {
        setIsLoading(true);
        const page = await pdfDocument.getPage(currentPage);
        
        // Get the container width for responsive sizing
        const containerWidth = containerRef.current.clientWidth;
        
        // Get the original viewport dimensions
        const viewport = page.getViewport({ scale: 1 });
        
        // Calculate scale to fit width
        const calculatedScale = containerWidth / viewport.width;
        const adjustedScale = scale * calculatedScale;
        
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
      } catch (err) {
        console.error('Error rendering page:', err);
        setError('Failed to render PDF page');
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDocument, currentPage, containerRef, scale]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && pdfDocument) {
        // Trigger re-render by setting a small change to scale
        setScale(prev => prev + 0.001);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDocument]);

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
            style={{ display: !isLoading && !error ? 'block' : 'none' }}
          />
        </div>
      </div>
    </div>
  );
};
