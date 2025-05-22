
import { useEffect, useRef, useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Pin worker to exact installed version
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.15.349/pdf.worker.min.js`;

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
        // Extract bucket and path
        const match = url.match(
          /https:\/\/[^/]+\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
        );
        if (!match) throw new Error('Invalid Supabase storage URL');
        const bucket = match[1];
        const path = match[2].split('?')[0];

        const { data: blob, error: dlErr } = await supabase
          .storage
          .from(bucket)
          .download(path);
        if (dlErr || !blob) throw new Error(dlErr?.message || 'Download failed');

        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
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
      pdfDoc?.destroy();
      setPdfDoc(null);
    };
  }, [url]);

  // Render page
  useEffect(() => {
    let renderTask: any = null;
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
      setIsLoading(true);
      try {
        const page = await pdfDoc.getPage(currentPage);
        // Fit to container
        const cont = containerRef.current;
        const vp = page.getViewport({ scale: 1 });
        const widthScale = (cont.clientWidth - 40) / vp.width;
        const heightScale = (cont.clientHeight - 40) / vp.height;
        const fitScale = Math.min(widthScale, heightScale, 1);
        const finalScale = scale * fitScale;
        const scaledVp = page.getViewport({ scale: finalScale });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2D context not available');
        canvas.width = scaledVp.width;
        canvas.height = scaledVp.height;
        canvas.style.width = `${scaledVp.width}px`;
        canvas.style.height = `${scaledVp.height}px`;

        renderTask = page.render({ canvasContext: ctx, viewport: scaledVp });
        await renderTask.promise;
      } catch (err: any) {
        console.error('PDF render error:', err);
        setError(err.message || 'Failed to render PDF');
      } finally {
        setIsLoading(false);
      }
    };
    renderPage();

    return () => {
      renderTask?.cancel?.();
    };
  }, [pdfDoc, currentPage, scale]);

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
      <div ref={containerRef} className="flex-grow relative overflow-auto p-4" style={{ minHeight: 300 }}>
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
        <canvas ref={canvasRef} className="mx-auto shadow-lg" />
      </div>
    </div>
  );
};
