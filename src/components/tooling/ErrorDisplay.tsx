
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ErrorDisplayProps = {
  error: string | null;
  isToolsError: boolean;
  isMachinesError: boolean;
  clearError?: () => void;
};

export function ErrorDisplay({ error, isToolsError, isMachinesError, clearError }: ErrorDisplayProps) {
  if (!isToolsError && !isMachinesError && !error) return null;
  
  return (
    <Alert variant="destructive" className="mb-6 flex justify-between items-start">
      <div className="flex gap-2 items-start">
        <AlertCircle className="h-5 w-5" />
        <AlertDescription>
          {error || "There was an error loading data. Please try refreshing the page."}
        </AlertDescription>
      </div>
      {clearError && (
        <button 
          onClick={clearError} 
          className="text-red-700 hover:text-red-900 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </Alert>
  );
}
