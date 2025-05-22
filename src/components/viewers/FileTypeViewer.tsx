
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
  const normalizedType = fileType.toLowerCase();

  return (
    <div className="w-full h-full">
      {normalizedType === 'stl' && <StlViewer url={url} />}
      {normalizedType === 'step' && <StepViewer url={url} />}
      {normalizedType === 'dxf' && <DxfViewer url={url} />}
      {normalizedType === 'svg' && <SvgViewer url={url} />}
      {normalizedType === 'pdf' && <PdfViewer url={url} />}
      {!( ['stl','step','dxf','svg','pdf'].includes(normalizedType) ) && (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <p className="text-gray-400">Unsupported format: {fileType}</p>
        </div>
      )}
    </div>
  );
};
