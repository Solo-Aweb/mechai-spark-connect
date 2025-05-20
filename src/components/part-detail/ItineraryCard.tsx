
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatDate, formatCurrency, formatTime } from "@/utils/formatters";
import { ItineraryStep, Itinerary } from "@/types/itinerary";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
          Total Cost: {formatCurrency(itinerary.total_cost)}
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
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasSteps() ? 
                getSteps().map((step: ItineraryStep, index: number) => (
                  <TableRow key={index} className={step.unservable ? "bg-red-50" : ""}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{step.description || 'N/A'}</TableCell>
                    <TableCell>{step.machine_name || 'Unknown Machine'}</TableCell>
                    <TableCell>{step.tool_name || 'Unknown Tool'}</TableCell>
                    <TableCell>{step.time || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(step.cost || 0)}</TableCell>
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
      <CardFooter className="flex flex-col items-start">
        <div className="w-full space-y-4">
          <h4 className="font-medium text-foreground">Cost Calculation Parameters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Machine Hourly Rate</label>
              <Input 
                type="number" 
                placeholder="$25.00" 
                className="w-full" 
                defaultValue="25"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tool Wear Cost (per operation)</label>
              <Input 
                type="number" 
                placeholder="$5.00" 
                className="w-full" 
                defaultValue="5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Setup Cost</label>
              <Input 
                type="number" 
                placeholder="$10.00" 
                className="w-full" 
                defaultValue="10"
              />
            </div>
          </div>
          
          <div className="space-y-2 w-full">
            <label className="text-sm font-medium">Calculation Formula</label>
            <Textarea 
              readOnly 
              className="font-mono text-sm bg-muted"
              value={`For each step:
Machine cost = Hourly rate × (Time in minutes ÷ 60)
Total step cost = Machine cost + Tool wear cost + Setup cost

Example for step 1 (${getSteps()[0]?.time || 30} minutes):
$25/hr × (${getSteps()[0]?.time || 30} min ÷ 60) = $${((25 * (getSteps()[0]?.time || 30)) / 60).toFixed(2)}
$${((25 * (getSteps()[0]?.time || 30)) / 60).toFixed(2)} + $5 + $10 = $${(((25 * (getSteps()[0]?.time || 30)) / 60) + 5 + 10).toFixed(2)}

Total cost is the sum of all individual step costs: ${formatCurrency(itinerary.total_cost)}`}
            />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
