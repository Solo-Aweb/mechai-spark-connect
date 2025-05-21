
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

  // Extract file path from URL for DXF files
  const extractFilePath = (url: string): string => {
    // This is a simplistic approach - you might need a more robust method
    // to extract the correct path depending on your URL structure
    const matches = url.match(/\/([^/?#]+)(?:[?#]|$)/);
    return matches && matches[1] ? matches[1] : url;
  };

  switch (normalizedType) {
    case 'stl':
      return <StlViewer url={url} />;
    case 'step':
      return <StepViewer url={url} />;
    case 'dxf':
      return <DxfViewer filePath={extractFilePath(url)} />;
    case 'svg':
      return <SvgViewer url={url} />;
    case 'pdf':
      return <PdfViewer url={url} />;
    default:
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <p className="text-gray-400">Unsupported format: {fileType}</p>
        </div>
      );
  }
};
