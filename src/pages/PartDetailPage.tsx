
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, File } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Part {
  id: string;
  name: string;
  file_url: string | null;
  upload_date: string;
  created_at: string;
}

interface Machine {
  id: string;
  name: string;
  type: string;
  axes: number;
}

interface Tooling {
  id: string;
  tool_name: string;
  material: string;
  diameter: number;
  length: number;
}

interface Material {
  id: string;
  name: string;
  stock_type: string;
  dimensions: any;
  unit_cost: number;
}

interface ItineraryStep {
  step_number: number;
  description: string;
  machine_id: string;
  machine_name?: string;
  tooling_id: string;
  tooling_name?: string;
  estimated_time: number;
  cost: number;
  unservable?: boolean;
}

interface Itinerary {
  id: string;
  part_id: string;
  steps: {
    steps: ItineraryStep[];
  };
  total_cost: number;
  created_at: string;
}

const PartDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [part, setPart] = useState<Part | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tooling, setTooling] = useState<Tooling[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPartData = async () => {
      if (!id) return;

      try {
        // Fetch part details
        const { data: partData, error: partError } = await supabase
          .from("parts")
          .select("*")
          .eq("id", id)
          .single();

        if (partError) throw partError;
        setPart(partData);

        // Fetch machines
        const { data: machineData, error: machineError } = await supabase
          .from("machines")
          .select("*");

        if (machineError) throw machineError;
        setMachines(machineData);

        // Fetch tooling
        const { data: toolingData, error: toolingError } = await supabase
          .from("tooling")
          .select("*");

        if (toolingError) throw toolingError;
        setTooling(toolingData);

        // Fetch materials
        const { data: materialData, error: materialError } = await supabase
          .from("materials")
          .select("*");

        if (materialError) throw materialError;
        setMaterials(materialData);

        // Fetch existing itinerary if any
        const { data: itineraryData, error: itineraryError } = await supabase
          .from("itineraries")
          .select("*")
          .eq("part_id", id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!itineraryError && itineraryData?.length > 0) {
          setItinerary(itineraryData[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch part details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPartData();
  }, [id, toast]);

  const generateItinerary = async () => {
    if (!id || generating) return;

    setGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(
        "https://dhppkyaaedwpalnrwvmd.functions.supabase.co/functions/v1/generate-itinerary",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ partId: id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate itinerary");
      }

      setItinerary(data.itinerary);
      toast({
        title: "Success",
        description: "Itinerary generated successfully",
      });

    } catch (error) {
      console.error("Error generating itinerary:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate itinerary",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const enrichItinerarySteps = (itinerary: Itinerary | null) => {
    if (!itinerary || !itinerary.steps || !itinerary.steps.steps) return [];
    
    return itinerary.steps.steps.map(step => {
      const machine = machines.find(m => m.id === step.machine_id);
      const tool = tooling.find(t => t.id === step.tooling_id);
      
      return {
        ...step,
        machine_name: machine?.name || "Unknown machine",
        tooling_name: tool?.tool_name || "Unknown tool"
      };
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!part) {
    return (
      <AppLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Part not found</h2>
          <Button onClick={() => navigate('/app/parts')} className="mt-4">
            Back to Parts
          </Button>
        </div>
      </AppLayout>
    );
  }

  const enrichedSteps = enrichItinerarySteps(itinerary);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Part Details</h1>
          <Button onClick={() => navigate('/app/parts')} variant="outline">
            Back to Parts
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{part.name}</CardTitle>
            <CardDescription>
              Uploaded on {formatDate(part.upload_date)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-medium">Part ID:</p>
                <p className="text-sm text-muted-foreground">{part.id}</p>
              </div>
              {part.file_url && (
                <div className="space-y-2">
                  <p className="font-medium">File:</p>
                  <div className="flex items-center">
                    <File className="mr-2" size={16} />
                    <a 
                      href={part.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View File
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Inventory Summary</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Machines ({machines.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Axes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.length > 0 ? (
                      machines.map((machine) => (
                        <TableRow key={machine.id}>
                          <TableCell>{machine.name}</TableCell>
                          <TableCell>{machine.type}</TableCell>
                          <TableCell>{machine.axes}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          No machines available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Tooling ({tooling.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Dimensions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tooling.length > 0 ? (
                      tooling.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell>{tool.tool_name}</TableCell>
                          <TableCell>{tool.material}</TableCell>
                          <TableCell>
                            {tool.diameter}mm x {tool.length}mm
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          No tooling available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Materials ({materials.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.length > 0 ? (
                      materials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell>{material.name}</TableCell>
                          <TableCell>{material.stock_type}</TableCell>
                          <TableCell>${material.unit_cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          No materials available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="itinerary">
            <Card>
              <CardHeader>
                <CardTitle>Machining Itinerary</CardTitle>
                <CardDescription>
                  {itinerary 
                    ? `Generated on ${formatDate(itinerary.created_at)} - Total Cost: $${itinerary.total_cost.toFixed(2)}`
                    : 'Generate an optimized machining plan for this part'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {itinerary ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Step</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Machine</TableHead>
                        <TableHead>Tool</TableHead>
                        <TableHead>Time (min)</TableHead>
                        <TableHead>Cost ($)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedSteps.length > 0 ? (
                        enrichedSteps.map((step) => (
                          <TableRow key={step.step_number} className={step.unservable ? "bg-red-50" : ""}>
                            <TableCell>{step.step_number}</TableCell>
                            <TableCell>{step.description}</TableCell>
                            <TableCell>{step.machine_name}</TableCell>
                            <TableCell>{step.tooling_name}</TableCell>
                            <TableCell>{step.estimated_time}</TableCell>
                            <TableCell>${step.cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            No steps in the itinerary
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="mb-4">No itinerary has been generated for this part yet.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button 
                  onClick={generateItinerary} 
                  disabled={generating}
                  className="w-full md:w-auto"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : itinerary ? 'Regenerate Itinerary' : 'Generate Itinerary'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PartDetailPage;
