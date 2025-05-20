
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { FileTypeViewer } from './viewers/FileTypeViewer';

interface FileViewerProps {
  url: string;
  fileType: string;
}

export const FileViewer = ({ url, fileType }: FileViewerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supportedFormats = ['stl', 'step', 'dxf', 'svg', 'pdf'];
  const isSupported = fileType && supportedFormats.includes(fileType.toLowerCase());
  
  if (!isSupported) {
    return (
      <div className="w-full bg-gray-100 rounded-md overflow-hidden" style={{ height: '400px' }}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Unsupported file format: {fileType}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full bg-gray-100 rounded-md overflow-hidden relative" style={{ height: '400px' }}>
      {/* Error state (handled by child components) */}
      <FileTypeViewer url={url} fileType={fileType} />
    </div>
  );
};
