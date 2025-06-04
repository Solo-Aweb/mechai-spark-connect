
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
import { Loader2, AlertCircle, Info, ShoppingCart, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
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

  const countParameterIssues = () => {
    return getSteps().filter(step => step.parameter_issue).length;
  };

  // Get all unique recommendations for purchasing
  const getPurchaseRecommendations = () => {
    const steps = getSteps();
    const recommendations = steps
      .filter(step => (step.unservable || step.parameter_issue) && step.recommendation)
      .map(step => ({
        machineType: step.required_machine_type || 'Unknown machine type',
        recommendation: step.recommendation || '',
        stepDescription: step.description,
        isParameterIssue: step.parameter_issue || false,
        inadequateParameter: step.inadequate_parameter || null,
        requiredParameter: step.required_parameter || null
      }));
      
    // Remove duplicate recommendations
    return recommendations.filter((recommendation, index, self) => 
      index === self.findIndex((r) => r.recommendation === recommendation.recommendation)
    );
  };

  // Render tool status for a step
  const renderToolStatus = (step: ItineraryStep) => {
    if (step.tool_name && !step.parameter_issue && !step.unservable) {
      return (
        <div>
          {step.tool_name}
          <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-200 ml-2">Available</Badge>
        </div>
      );
    }

    if (step.parameter_issue && step.tool_name) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {step.tool_name}
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-300 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Parameter Issue
            </Badge>
          </div>
          <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
            <div><strong>Issue:</strong> {step.inadequate_parameter}</div>
            <div><strong>Required:</strong> {step.required_parameter}</div>
            {step.recommendation && (
              <div className="mt-1">
                <strong>Recommendation:</strong> {step.recommendation}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (step.machine_id && !step.tooling_id) {
      return (
        <div className="space-y-1">
          <Badge variant="outline" className="bg-red-50 text-red-500 border-red-300 flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" /> Missing Tool
          </Badge>
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            The required tool is not available in your inventory.
            {step.recommendation && (
              <div className="mt-1">
                <strong>Recommendation:</strong> {step.recommendation}
              </div>
            )}
          </div>
        </div>
      );
    }

    return 'N/A';
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

  // Render mobile view of steps
  const renderMobileSteps = () => {
    return getSteps().map((step: ItineraryStep, index: number) => (
      <div 
        key={index} 
        className={`border rounded-md p-4 mb-4 ${
          step.unservable ? "bg-red-50 border-red-200" : 
          step.parameter_issue ? "bg-amber-50 border-amber-200" : ""
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">Step {index + 1}</span>
          {step.unservable ? (
            <Badge variant="destructive">Unservable</Badge>
          ) : step.parameter_issue ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-300">Parameter Issue</Badge>
          ) : (
            <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-200">Servable</Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Operation:</div>
          <div>
            {step.description || 'N/A'}
            {step.setup_description && (
              <div className="mt-2 bg-blue-50 p-2 rounded text-blue-800 text-xs border border-blue-200">
                <div className="font-bold mb-1">Setup:</div>
                {step.setup_description}
              </div>
            )}
          </div>
          
          <div className="font-medium">Machine:</div>
          <div>
            {step.machine_name || (step.unservable ? (
              <div className="space-y-1">
                <Badge variant="outline" className="bg-red-50 text-red-500 border-red-300 flex items-center gap-1 w-fit">
                  <AlertCircle className="h-3 w-3" /> Missing
                </Badge>
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  <strong>Required:</strong> {step.required_machine_type || "Unknown machine type"}
                  {step.recommendation && (
                    <div className="mt-1">
                      <strong>Recommendation:</strong> {step.recommendation}
                    </div>
                  )}
                </div>
              </div>
            ) : 'Unknown Machine')}
          </div>
          
          <div className="font-medium">Tool:</div>
          <div>{renderToolStatus(step)}</div>
          
          <div className="font-medium">Time (min):</div>
          <div>{step.time || 'N/A'}</div>
          
          <div className="font-medium">Cost:</div>
          <div>{formatCurrency(step.cost || 0)}</div>

          {step.fixture_requirements && (
            <>
              <div className="font-medium">Fixturing:</div>
              <div>{step.fixture_requirements}</div>
            </>
          )}
        </div>
      </div>
    ));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Machining Itinerary</CardTitle>
        <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span>Generated on {formatDate(itinerary.created_at)}</span>
          <span className="hidden sm:inline">•</span>
          <span>Total Cost: {formatCurrency(itinerary.total_cost)}</span>
          {countUnservableSteps() > 0 && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="text-red-500">
                {countUnservableSteps()} step{countUnservableSteps() !== 1 ? 's' : ''} require additional equipment
              </span>
            </>
          )}
          {countParameterIssues() > 0 && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="text-amber-600">
                {countParameterIssues()} step{countParameterIssues() !== 1 ? 's' : ''} have parameter issues
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile view - card-based layout
          <div className="space-y-4">
            {hasSteps() ? (
              renderMobileSteps()
            ) : (
              <div className="text-center text-gray-500 py-4">
                No steps available in the itinerary data
              </div>
            )}
          </div>
        ) : (
          // Desktop view - table layout
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Time (min)</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Fixturing</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasSteps() ? 
                  getSteps().map((step: ItineraryStep, index: number) => (
                    <TableRow key={index} className={
                      step.unservable ? "bg-red-50" : 
                      step.parameter_issue ? "bg-amber-50" : ""
                    }>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          {step.description || 'N/A'}
                        </div>
                        {step.setup_description && (
                          <div className="mt-2 bg-blue-50 p-2 rounded text-blue-800 text-xs border border-blue-200">
                            <div className="font-bold mb-1">Setup:</div>
                            {step.setup_description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {step.machine_name || (step.unservable ? (
                          <div className="space-y-1">
                            <Badge variant="outline" className="bg-red-50 text-red-500 border-red-300 flex items-center gap-1 w-fit">
                              <AlertCircle className="h-3 w-3" /> Missing
                            </Badge>
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 max-w-48">
                              <strong>Required:</strong> {step.required_machine_type || "Unknown machine type"}
                              {step.recommendation && (
                                <div className="mt-1">
                                  <strong>Recommendation:</strong> {step.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : 'Unknown Machine')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          {renderToolStatus(step)}
                        </div>
                      </TableCell>
                      <TableCell>{step.time || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(step.cost || 0)}</TableCell>
                      <TableCell>{step.fixture_requirements || 'Standard'}</TableCell>
                      <TableCell>
                        {step.unservable ? (
                          <Badge variant="destructive">Unservable</Badge>
                        ) : step.parameter_issue ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-300">Parameter Issue</Badge>
                        ) : (
                          <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-200">Servable</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500">
                        No steps available in the itinerary data
                      </TableCell>
                    </TableRow>
                  )
                }
              </TableBody>
            </Table>
          </div>
        )}
        
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

        {countParameterIssues() > 0 && (
          <Alert className="mt-4" variant="default" className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {countParameterIssues()} machining step{countParameterIssues() !== 1 ? 's' : ''} have tools with inadequate parameters.
              Review the parameter recommendations for optimal machining results.
            </AlertDescription>
          </Alert>
        )}

        {recommendations.length > 0 && (
          <div className="mt-6 border p-4 rounded-md bg-amber-50">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
              <ShoppingCart className="h-5 w-5 text-amber-600" /> 
              Equipment & Parameter Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="border-b pb-2 last:border-0">
                  <p className="font-medium text-amber-800">For: {rec.stepDescription}</p>
                  {rec.isParameterIssue ? (
                    <div className="space-y-1">
                      <p><strong>Parameter Issue:</strong> {rec.inadequateParameter}</p>
                      <p><strong>Required Parameter:</strong> {rec.requiredParameter}</p>
                      <p><strong>Recommendation:</strong> {rec.recommendation}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p><strong>Required:</strong> {rec.machineType}</p>
                      <p><strong>Recommendation:</strong> {rec.recommendation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
