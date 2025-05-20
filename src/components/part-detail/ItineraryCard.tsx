
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { formatDate } from "@/utils/formatters";
import { ItineraryStep, Itinerary } from "@/types/itinerary";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Time (min)</TableHead>
                <TableHead>Cost ($)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasSteps() ? 
                getSteps().map((step: ItineraryStep, index: number) => (
                  <TableRow key={index} className={step.unservable ? "bg-red-50" : ""}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{step.description || 'N/A'}</TableCell>
                    <TableCell>{step.machine_name || step.machine_id || 'N/A'}</TableCell>
                    <TableCell>{step.tool_name || step.tooling_id || 'N/A'}</TableCell>
                    <TableCell>{step.time || 'N/A'}</TableCell>
                    <TableCell>{step.cost ? `$${step.cost.toFixed(2)}` : 'N/A'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      No steps available in the itinerary data
                    </TableCell>
                  </TableRow>
                )
              }
            </TableBody>
          </Table>
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
      <CardFooter>
        <div className="w-full space-y-2 text-sm text-muted-foreground">
          <h4 className="font-medium text-foreground">How costs are calculated:</h4>
          <p>
            Each machining step cost is based on the machine usage time and tool wear.
            The formula typically includes:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Machine hourly rate × operation time</li>
            <li>Tool wear cost per operation</li>
            <li>Setup and material handling costs</li>
          </ul>
          <p>
            Total cost is the sum of all individual step costs. Costs may vary based on 
            machine availability and complexity of operations.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};
