
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Download, Trash2, FileCog } from 'lucide-react';
import { ModelViewer } from '@/components/ModelViewer';
import { SvgPreview } from '@/components/SvgPreview';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Json } from '@/integrations/supabase/types';

interface Part {
  id: string;
  name: string;
  file_url: string | null;
  svg_url: string | null;
  upload_date: string;
}

interface ItineraryStep {
  description: string;
  machine_id: string | null;
  tooling_id: string | null;
  time: number;
  cost: number;
  unservable?: boolean;
}

interface ItinerarySteps {
  steps: ItineraryStep[];
  total_cost: number;
}

interface Itinerary {
  id: string;
  part_id: string;
  steps: ItinerarySteps;
  total_cost: number;
  created_at: string;
}

// Interface matching the actual shape of data from Supabase
interface ItineraryFromSupabase {
  id: string;
  part_id: string;
  steps: Json;
  total_cost: number;
  created_at: string;
}

const PartDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPartDetails();
      fetchLatestItinerary();
    }
  }, [id]);

  const fetchPartDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPart(data);
    } catch (error) {
      console.error('Error fetching part details:', error);
      toast.error('Could not load part details');
      navigate('/app/parts');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestItinerary = async () => {
    if (!id) return;
    
    try {
      setLoadingItinerary(true);
      setItineraryError(null);
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('part_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // No rows returned
          console.error('Error fetching itinerary:', error);
        }
        setItinerary(null);
      } else {
        console.log('Itinerary data received:', data);
        // Transform the data to match the Itinerary interface
        const supabaseData = data as ItineraryFromSupabase;
        let stepsData: ItinerarySteps;
        
        // Parse the steps data which could be in different formats
        if (typeof supabaseData.steps === 'string') {
          try {
            stepsData = JSON.parse(supabaseData.steps);
          } catch (e) {
            console.error('Failed to parse steps string:', e);
            stepsData = { steps: [], total_cost: 0 };
          }
        } else if (typeof supabaseData.steps === 'object') {
          // Handle the case where steps is already an object
          const stepsObj = supabaseData.steps as any;
          
          if (Array.isArray(stepsObj)) {
            // If steps is directly an array of steps
            stepsData = {
              steps: stepsObj.map(step => ({
                description: step.description || 'Unknown',
                machine_id: step.machine_id,
                tooling_id: step.tooling_id,
                time: step.time || 0,
                cost: step.cost || 0,
                unservable: step.unservable || false
              })),
              total_cost: stepsObj.reduce((sum, step) => sum + (step.cost || 0), 0)
            };
          } else if (stepsObj && stepsObj.steps && Array.isArray(stepsObj.steps)) {
            // If steps is an object with a steps property that is an array
            stepsData = {
              steps: stepsObj.steps.map(step => ({
                description: step.description || 'Unknown',
                machine_id: step.machine_id,
                tooling_id: step.tooling_id,
                time: step.time || 0,
                cost: step.cost || 0,
                unservable: step.unservable || false
              })),
              total_cost: stepsObj.total_cost || stepsObj.steps.reduce((sum, step) => sum + (step.cost || 0), 0)
            };
          } else {
            // Default to empty steps if structure is unexpected
            console.error('Unexpected steps data structure:', stepsObj);
            stepsData = { steps: [], total_cost: 0 };
          }
        } else {
          // Default case if steps is neither string nor object
          console.error('Steps data is neither string nor object:', supabaseData.steps);
          stepsData = { steps: [], total_cost: 0 };
        }
        
        // Create properly formatted itinerary
        const formattedItinerary: Itinerary = {
          id: supabaseData.id,
          part_id: supabaseData.part_id,
          steps: stepsData,
          total_cost: supabaseData.total_cost,
          created_at: supabaseData.created_at
        };
        
        console.log('Transformed itinerary:', formattedItinerary);
        setItinerary(formattedItinerary);
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      setItineraryError('Failed to fetch itinerary data');
    } finally {
      setLoadingItinerary(false);
    }
  };

  const handleDelete = async () => {
    if (!part) return;
    
    try {
      setDeleting(true);
      
      // Delete the file from storage
      if (part.file_url) {
        const filePathMatch = part.file_url.match(/\/([^/?#]+)(?:[?#]|$)/);
        if (filePathMatch && filePathMatch[1]) {
          const filePath = `models/${filePathMatch[1]}`;
          const { error: fileError } = await supabase.storage
            .from('parts')
            .remove([filePath]);
          
          if (fileError) console.error('Error deleting file:', fileError);
        }
      }
      
      // Delete the SVG from storage if it exists
      if (part.svg_url) {
        const svgPathMatch = part.svg_url.match(/\/([^/?#]+)(?:[?#]|$)/);
        if (svgPathMatch && svgPathMatch[1]) {
          const svgPath = `models/${svgPathMatch[1]}`;
          const { error: svgError } = await supabase.storage
            .from('svg_files')
            .remove([svgPath]);
          
          if (svgError) console.error('Error deleting SVG:', svgError);
        }
      }
      
      // Delete the part record
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', part.id);
      
      if (error) throw error;
      
      toast.success('Part deleted successfully');
      
      navigate('/app/parts');
    } catch (error) {
      console.error('Error deleting part:', error);
      toast.error('Could not delete part');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determine if the file is a 3D model based on file extension
  const is3DModel = (url: string | null) => {
    if (!url) return false;
    const ext = url.split('.').pop()?.toLowerCase() || '';
    return ['stl', 'step'].includes(ext);
  };

  const extractFileName = (url: string | null) => {
    if (!url) return '';
    const pathMatch = url.match(/\/([^/?#]+)(?:[?#]|$)/);
    return pathMatch ? pathMatch[1] : 'file';
  };

  const generateItinerary = async () => {
    if (!part || !part.id) {
      toast.error('Part information is missing');
      return;
    }
    
    try {
      setGeneratingItinerary(true);
      setItineraryError(null);
      const { data: tokenData } = await supabase.auth.getSession();
      const token = tokenData?.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      const response = await fetch(
        'https://dhppkyaaedwpalnrwvmd.supabase.co/functions/v1/generate-itinerary',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ partId: part.id }),
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error response from generate-itinerary:', result);
        throw new Error(result.error || result.details?.message || 'Failed to generate itinerary');
      }
      
      toast.success('Itinerary generated successfully');
      
      // Refresh the itinerary data
      fetchLatestItinerary();
      
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setItineraryError(error instanceof Error ? error.message : 'Failed to generate itinerary');
      toast.error(error instanceof Error ? error.message : 'Failed to generate itinerary');
    } finally {
      setGeneratingItinerary(false);
    }
  };
  
  // Helper function to extract steps from the itinerary
  const getSteps = () => {
    if (!itinerary || !itinerary.steps) return [];
    return itinerary.steps.steps || [];
  };

  const hasSteps = () => {
    const steps = getSteps();
    return steps.length > 0;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/app/parts')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Parts
          </Button>
          
          {part && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  <Trash2 className="mr-2 h-4 w-4" /> 
                  {deleting ? 'Deleting...' : 'Delete Part'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the part
                    and any associated files.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : part ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{part.name}</CardTitle>
                <CardDescription>
                  Uploaded on {formatDate(part.upload_date)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">ID:</div>
                    <div className="col-span-2 font-mono text-sm">{part.id}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="font-medium">Upload Date:</div>
                    <div className="col-span-2">{formatDate(part.upload_date)}</div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      onClick={generateItinerary} 
                      disabled={generatingItinerary}
                      className="w-full"
                    >
                      {generatingItinerary ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Itinerary...
                        </>
                      ) : (
                        <>
                          <FileCog className="mr-2 h-4 w-4" />
                          Generate Machining Itinerary
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {part.file_url && (
                  <Button 
                    variant="outline"
                    onClick={() => handleDownload(part.file_url!, extractFileName(part.file_url))}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download File
                  </Button>
                )}
                {part.svg_url && (
                  <Button 
                    variant="outline"
                    onClick={() => handleDownload(part.svg_url!, extractFileName(part.svg_url))}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download SVG
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                {part.svg_url ? (
                  <SvgPreview url={part.svg_url} altText={`${part.name} preview`} />
                ) : part.file_url && is3DModel(part.file_url) ? (
                  <ModelViewer 
                    url={part.file_url} 
                    fileType={part.file_url.split('.').pop()?.toLowerCase() || ''}
                  />
                ) : (
                  <div className="flex items-center justify-center p-10 bg-gray-50 rounded-md">
                    <p className="text-gray-400">No preview available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {loadingItinerary ? (
              <Card className="md:col-span-2">
                <CardContent className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </CardContent>
              </Card>
            ) : itinerary ? (
              <Card className="md:col-span-2">
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
            ) : null}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Part not found</h2>
                <p className="text-gray-500">The part you are looking for does not exist or has been deleted.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default PartDetailPage;
