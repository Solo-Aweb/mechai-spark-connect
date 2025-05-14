import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { ModelViewer } from '@/components/ModelViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Part {
  id: string;
  name: string;
  file_url: string | null;
  upload_date: string;
}

interface Machine {
  id: string;
  name: string;
  type: string;
}

interface Tool {
  id: string;
  tool_name: string;
  machine_id: string;
}

interface Material {
  id: string;
  name: string;
  stock_type: string;
}

interface ItineraryStep {
  step_number: number;
  description: string;
  machine_id: string;
  tooling_id: string;
  estimated_time: number;
  cost: number;
  machine_name?: string;
  tool_name?: string;
  is_unservable?: boolean;
}

interface Itinerary {
  id: string;
  created_at: string;
  part_id: string;
  steps: {
    steps: ItineraryStep[];
  };
  total_cost: number;
}

const PartDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [part, setPart] = useState<Part | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [fileType, setFileType] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (id) {
      fetchPartData();
      fetchInventory();
      fetchItinerary();
    }
  }, [id]);

  const fetchPartData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPart(data);
      
      if (data.file_url) {
        // Extract file extension from URL or filename
        const urlParts = data.file_url.split('.');
        const extension = urlParts[urlParts.length - 1].toLowerCase();
        setFileType(extension);
      }
    } catch (error) {
      console.error('Error fetching part:', error);
      toast("Error", {
        description: 'Could not load part details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      // Fetch machines
      const { data: machinesData, error: machinesError } = await supabase
        .from('machines')
        .select('*');

      if (machinesError) throw machinesError;
      setMachines(machinesData || []);

      // Fetch tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('tooling')
        .select('*');

      if (toolsError) throw toolsError;
      setTools(toolsData || []);

      // Fetch materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*');

      if (materialsError) throw materialsError;
      setMaterials(materialsData || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast("Warning", {
        description: 'Could not load some inventory data',
      });
    }
  };

  const fetchItinerary = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('part_id', id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        // Ensure correct typing for the steps object
        const itineraryData: Itinerary = {
          ...data[0],
          steps: typeof data[0].steps === 'string' 
            ? JSON.parse(data[0].steps) 
            : data[0].steps
        };
        
        setItinerary(itineraryData);
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
    }
  };

  const generateItinerary = async () => {
    if (!part) return;
    
    try {
      setGeneratingItinerary(true);
      toast("Generating Itinerary", {
        description: 'This may take a moment...',
      });

      // Call the edge function
      const { data: authData } = await supabase.auth.getSession();
      const authToken = authData.session?.access_token;

      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`https://dhppkyaaedwpalnrwvmd.supabase.co/functions/v1/generate-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ partId: id }),
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(errorDetails.error || 'Failed to generate itinerary');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      toast("Success", {
        description: 'Itinerary generated successfully',
      });
      
      await fetchItinerary();
      setActiveTab('itinerary');
    } catch (error: any) {
      console.error('Error generating itinerary:', error);
      toast("Error", {
        description: error.message || 'Could not generate itinerary',
        variant: 'destructive',
      });
    } finally {
      setGeneratingItinerary(false);
    }
  };

  const getMachineName = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    return machine?.name || 'Unknown Machine';
  };
  
  const getToolName = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    return tool?.tool_name || 'Unknown Tool';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!part) {
    return (
      <AppLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold">Part not found</h2>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{part?.name}</h1>
          <Button 
            onClick={generateItinerary} 
            disabled={generatingItinerary || !part?.file_url}
          >
            {generatingItinerary ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Itinerary'
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="preview" disabled={!part?.file_url}>3D Preview</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="itinerary" disabled={!itinerary}>Itinerary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Part Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-lg">{part?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Upload Date</p>
                    <p className="text-lg">
                      {new Date(part?.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">File</p>
                    <p className="text-lg">
                      {part?.file_url ? (
                        <a 
                          href={part?.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View File
                        </a>
                      ) : (
                        <span className="text-gray-500">No file uploaded</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview">
            {part?.file_url ? (
              <Card>
                <CardHeader>
                  <CardTitle>3D Model Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ModelViewer url={part.file_url} fileType={fileType} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p>No 3D model available for this part</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Machines</CardTitle>
              </CardHeader>
              <CardContent>
                {machines.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {machines.map((machine) => (
                      <div key={machine.id} className="border rounded-md p-4">
                        <p className="font-medium">{machine.name}</p>
                        <p className="text-sm text-gray-500">Type: {machine.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4">No machines available</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Available Tools</CardTitle>
              </CardHeader>
              <CardContent>
                {tools.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tools.map((tool) => (
                      <div key={tool.id} className="border rounded-md p-3">
                        <p className="font-medium">{tool.tool_name}</p>
                        <p className="text-sm text-gray-500">
                          For: {getMachineName(tool.machine_id)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4">No tools available</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Available Materials</CardTitle>
              </CardHeader>
              <CardContent>
                {materials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {materials.map((material) => (
                      <div key={material.id} className="border rounded-md p-3">
                        <p className="font-medium">{material.name}</p>
                        <p className="text-sm text-gray-500">Type: {material.stock_type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4">No materials available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="itinerary">
            {itinerary ? (
              <Card>
                <CardHeader>
                  <CardTitle>Machining Itinerary</CardTitle>
                  <CardDescription>
                    Created on {new Date(itinerary.created_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Machining Steps</h3>
                    {itinerary.steps && itinerary.steps.steps ? (
                      <div className="space-y-4">
                        {itinerary.steps.steps.map((step, index) => (
                          <div key={index} className="border rounded-md p-4 bg-gray-50">
                            <div className="flex justify-between items-center">
                              <h4 className="font-bold">Step {step.step_number || index + 1}</h4>
                              {step.is_unservable && (
                                <Badge variant="destructive">Unservable Operation</Badge>
                              )}
                            </div>
                            <p className="mt-2">{step.description}</p>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                              <div>
                                <p className="text-sm text-gray-500">Machine</p>
                                <p>{getMachineName(step.machine_id)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Tool</p>
                                <p>{getToolName(step.tooling_id)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Estimated Time</p>
                                <p>{step.estimated_time} minutes</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Cost</p>
                                <p>${step.cost.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No steps available in the itinerary</p>
                    )}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Total Cost</h3>
                      <p className="text-xl font-bold">${itinerary.total_cost.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p>No itinerary generated yet. Click "Generate Itinerary" to create one.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PartDetailPage;
