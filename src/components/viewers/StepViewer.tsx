
import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useStepModel } from '@/hooks/useStepModel';
import { ThreeRenderer } from './ThreeRenderer';

interface StepViewerProps {
  url: string;
}

export const StepViewer = ({ url }: StepViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mesh, isLoading, error } = useStepModel(url);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading STEP model...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      {mesh && !isLoading && <ThreeRenderer mesh={mesh} />}
      
      {!mesh && !isLoading && !error && (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <p className="text-gray-400">No model available to display</p>
        </div>
      )}
    </div>
  );
};
