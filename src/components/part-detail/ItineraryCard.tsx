
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/utils/formatters";
import { ItineraryStep, Itinerary } from "@/types/itinerary";
import { Loader2 } from "lucide-react";

interface ItineraryCardProps {
  itinerary: Itinerary | null;
  loadingItinerary: boolean;
  itineraryError: string | null;
}

export const ItineraryCard = ({ 
  itinerary, 
  loadingItinerary, 
  itineraryError 
}: ItineraryCardProps) => {
  // Helper function to extract steps from the itinerary
  const getSteps = () => {
    if (!itinerary || !itinerary.steps) return [];
    return itinerary.steps.steps || [];
  };

  const hasSteps = () => {
    const steps = getSteps();
    return steps.length > 0;
  };

  if (loadingItinerary) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }
  
  if (!itinerary) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Machining Itinerary</CardTitle>
        <CardDescription>
          Generated on {formatDate(itinerary.created_at)} • 
          Total Cost: ${itinerary.total_cost.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Step</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Operation</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Machine</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Tool</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Time (min)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Cost ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {hasSteps() ? 
                getSteps().map((step: ItineraryStep, index: number) => (
                  <tr key={index} className={step.unservable ? "bg-red-50" : ""}>
                    <td className="px-4 py-3 text-sm">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">{step.description || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{step.machine_id || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{step.tooling_id || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{step.time || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{step.cost ? `$${step.cost.toFixed(2)}` : 'N/A'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-sm text-center text-gray-500">
                      No steps available in the itinerary data
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
        
        {itineraryError && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>
              {itineraryError}
            </AlertDescription>
          </Alert>
        )}

        {getSteps().some((step: ItineraryStep) => step.unservable) && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>
              Some operations cannot be serviced with the available machines and tooling.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
