
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
import { Loader2, AlertCircle, Info, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const countUnservableSteps = () => {
    return getSteps().filter(step => step.unservable).length;
  };

  // Get all unique recommendations for purchasing
  const getPurchaseRecommendations = () => {
    const steps = getSteps();
    const recommendations = steps
      .filter(step => step.unservable && step.recommendation)
      .map(step => ({
        machineType: step.required_machine_type || 'Unknown machine type',
        recommendation: step.recommendation || '',
        stepDescription: step.description
      }));
      
    // Remove duplicate recommendations
    return recommendations.filter((recommendation, index, self) => 
      index === self.findIndex((r) => r.recommendation === recommendation.recommendation)
    );
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

  const recommendations = getPurchaseRecommendations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Machining Itinerary</CardTitle>
        <CardDescription>
          Generated on {formatDate(itinerary.created_at)} • 
          Total Cost: {formatCurrency(itinerary.total_cost)} •
          {countUnservableSteps() > 0 && (
            <span className="text-red-500 ml-1">
              {countUnservableSteps()} step{countUnservableSteps() !== 1 ? 's' : ''} require additional equipment
            </span>
          )}
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasSteps() ? 
                getSteps().map((step: ItineraryStep, index: number) => (
                  <TableRow key={index} className={step.unservable ? "bg-red-50" : ""}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{step.description || 'N/A'}</TableCell>
                    <TableCell>
                      {step.machine_name || (step.unservable ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-red-50 text-red-500 border-red-300 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Missing
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p><strong>Required:</strong> {step.required_machine_type || "Unknown machine type"}</p>
                              {step.recommendation && <p className="mt-1"><strong>Recommendation:</strong> {step.recommendation}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : 'Unknown Machine')}
                    </TableCell>
                    <TableCell>
                      {step.tool_name || (step.machine_id && !step.tooling_id ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-300 flex items-center gap-1">
                                <Info className="h-3 w-3" /> Missing
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The appropriate tool is not available for this operation.</p>
                              {step.recommendation && <p className="mt-1"><strong>Recommendation:</strong> {step.recommendation}</p>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : 'N/A')}
                    </TableCell>
                    <TableCell>{step.time || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(step.cost || 0)}</TableCell>
                    <TableCell>
                      {step.unservable ? (
                        <Badge variant="destructive">Unservable</Badge>
                      ) : (
                        <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-200">Servable</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
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

        {countUnservableSteps() > 0 && (
          <Alert className="mt-4" variant="destructive">
            <AlertDescription>
              {countUnservableSteps()} machining step{countUnservableSteps() !== 1 ? 's' : ''} cannot be serviced with the available machines and tooling.
              Review the recommendations in the table for purchasing suggestions.
            </AlertDescription>
          </Alert>
        )}

        {recommendations.length > 0 && (
          <div className="mt-6 border p-4 rounded-md bg-amber-50">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
              <ShoppingCart className="h-5 w-5 text-amber-600" /> 
              Purchasing Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="border-b pb-2 last:border-0">
                  <p className="font-medium text-amber-800">For: {rec.stepDescription}</p>
                  <p><strong>Required:</strong> {rec.machineType}</p>
                  <p><strong>Recommendation:</strong> {rec.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
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
