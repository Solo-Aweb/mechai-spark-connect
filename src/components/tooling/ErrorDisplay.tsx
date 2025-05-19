
import { AlertCircle } from "lucide-react";

type ErrorDisplayProps = {
  error: string | null;
  isToolsError: boolean;
  isMachinesError: boolean;
};

export function ErrorDisplay({ error, isToolsError, isMachinesError }: ErrorDisplayProps) {
  if (!isToolsError && !isMachinesError && !error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md flex items-center gap-3">
      <AlertCircle size={20} />
      <p>
        {error || "There was an error loading data. Please try refreshing the page."}
      </p>
    </div>
  );
}
