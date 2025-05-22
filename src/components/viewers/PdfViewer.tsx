
import { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Ensure PDF.js worker is properly set up
// We need to set this explicitly - the automatic worker loading often fails
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PdfViewerProps {
  url: string; // public Supabase URL
}

export const PdfViewer = ({ url }: PdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState(1);
  
  // Fixed dimensions for the canvas
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Load PDF with Supabase download to bypass CORS/attachment issues
  useEffect(() => {
    if (!url) {
      setError('No PDF URL provided');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const loadPdf = async () => {
      try {
        console.log("Loading PDF from URL:", url);
        
        // Extract bucket and path
        const match = url.match(
          /https:\/\/[^/]+\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
        );
        if (!match) {
          console.error("Invalid URL format:", url);
          throw new Error('Invalid Supabase storage URL');
        }
        const bucket = match[1];
        const path = match[2].split('?')[0];
        
        console.log("Bucket:", bucket, "Path:", path);

        const { data: blob, error: dlErr } = await supabase
          .storage
          .from(bucket)
          .download(path);
          
        if (dlErr || !blob) {
          console.error("Download error:", dlErr);
          throw new Error(dlErr?.message || 'Download failed');
        }
        
        console.log("File downloaded successfully, size:", blob.size);

        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        
        console.log("PDF loading task created");
        
        const pdf = await loadingTask.promise;
        console.log("PDF loaded successfully, pages:", pdf.numPages);
        
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err: any) {
        console.error('PDF load error:', err);
        setError(err.message || 'Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPdf();

    return () => {
      // Cleanup
      if (pdfDoc) {
        pdfDoc.destroy().catch(err => console.error('Error destroying PDF document:', err));
        setPdfDoc(null);
      }
    };
  }, [url]);

  // Render page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) {
      console.log("No PDF document or canvas ref available");
      return;
    }
    
    setIsLoading(true);
    let renderTask: any = null;
    
    const renderPage = async () => {
      try {
        console.log(`Rendering page ${currentPage} of ${totalPages}`);
        const page = await pdfDoc.getPage(currentPage);
        
        // Calculate scaling to fit in our fixed dimensions while maintaining aspect ratio
        const viewport = page.getViewport({ scale: 1 });
        console.log("Original viewport size:", viewport.width, "x", viewport.height);
        
        const scaleX = CANVAS_WIDTH / viewport.width;
        const scaleY = CANVAS_HEIGHT / viewport.height;
        const finalScale = Math.min(scaleX, scaleY) * scale;
        
        console.log("Using scale factor:", finalScale);
        
        const scaledViewport = page.getViewport({ scale: finalScale });
        console.log("Scaled viewport size:", scaledViewport.width, "x", scaledViewport.height);
        
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error("Canvas reference lost during rendering");
          return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error("Failed to get 2D context from canvas");
          throw new Error('2D context not available');
        }
        
        // Set canvas dimensions explicitly
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        // Set the display size to match actual dimensions
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
        
        console.log("Canvas dimensions set:", canvas.width, "x", canvas.height);

        // Clear the canvas before rendering
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        console.log("Starting PDF render");
        renderTask = page.render({
          canvasContext: ctx,
          viewport: scaledViewport
        });
        
        await renderTask.promise;
        console.log("PDF page rendered successfully");
      } catch (err: any) {
        console.error('PDF render error:', err);
        setError(err.message || 'Failed to render PDF');
      } finally {
        setIsLoading(false);
      }
    };
    
    renderPage();

    return () => {
      if (renderTask?.cancel) {
        console.log("Canceling render task during cleanup");
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, totalPages]);

  // Controls
  const prev = () => setCurrentPage(p => Math.max(1, p - 1));
  const next = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

  return (
    <div className="w-full h-full flex flex-col">
      {totalPages > 0 && (
        <div className="p-2 bg-gray-100 flex items-center justify-between border-b">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={prev} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={next} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>-</Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn}>+</Button>
          </div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="flex-grow relative overflow-auto p-4 flex justify-center items-center bg-gray-50" 
        style={{ minHeight: 300 }}
      >
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
        <canvas 
          ref={canvasRef} 
          className="shadow-lg bg-white" 
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
};
