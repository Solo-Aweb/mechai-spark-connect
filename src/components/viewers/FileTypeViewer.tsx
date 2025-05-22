
import { StepViewer } from './StepViewer';
import { StlViewer } from './StlViewer';
import { DxfViewer } from './DxfViewer';
import { SvgViewer } from './SvgViewer';
import { PdfViewer } from './PdfViewer';

interface FileTypeViewerProps {
  url: string;
  fileType: string;
}

export const FileTypeViewer = ({ url, fileType }: FileTypeViewerProps) => {
  // Normalize file type
  const normalizedType = fileType.toLowerCase();

  // Force the viewer to take up all available space
  return (
    <div className="w-full h-full">
      {(() => {
        switch (normalizedType) {
          case 'stl':
            return <StlViewer url={url} />;
          case 'step':
            return <StepViewer url={url} />;
          case 'dxf':
            return <DxfViewer url={url} />;
          case 'svg':
            return <SvgViewer url={url} />;
          case 'pdf':
            return <PdfViewer url={url} />;
          default:
            return (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <p className="text-gray-400">Unsupported format: {fileType}</p>
              </div>
            );
        }
      })()}
    </div>
  );
}
