
import { useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useStepModel } from '@/hooks/useStepModel';
import { ThreeRenderer } from './ThreeRenderer';

interface StepViewerProps {
  url: string;
}

export const StepViewer = ({ url }: StepViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mesh, isLoading, error } = useStepModel(url);

  // Format error message for better user experience
  const getErrorMessage = () => {
    if (!error) return null;
    
    const errorString = String(error);
    
    if (errorString.includes('WebAssembly')) {
      return "Failed to load WebAssembly module. This browser may not support WebAssembly or the module failed to download.";
    } else if (errorString.includes('MIME type')) {
      return "Server configuration issue: WebAssembly module has incorrect MIME type.";
    } else if (errorString.includes('opencascade.wasm.wasm')) {
      return "Failed to load WebAssembly dependencies. This is likely a build configuration issue.";
    } else {
      return typeof error === 'object' ? JSON.stringify(error) : String(error);
    }
  };

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading STEP model...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white bg-opacity-80 p-4">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-500 text-center font-medium">Failed to load STEP model</p>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Check that the STEP file is valid and compatible with the viewer.
          </p>
          <p className="text-gray-400 text-xs mt-2 text-center max-w-md overflow-auto">
            Technical details: {getErrorMessage()}
          </p>
        </div>
      )}
      
      {mesh && !isLoading && (
        <ThreeRenderer mesh={mesh} />
      )}
      
      {!mesh && !isLoading && !error && (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <p className="text-gray-400">No model available to display</p>
        </div>
      )}
      
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
};
