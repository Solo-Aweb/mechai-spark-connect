
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PartInfoCard } from '@/components/part-detail/PartInfoCard';
import { PartPreviewCard } from '@/components/part-detail/PartPreviewCard';
import { ItineraryCard } from '@/components/part-detail/ItineraryCard';
import { DeletePartDialog } from '@/components/part-detail/DeletePartDialog';
import { Part } from '@/types/part';
import { Itinerary, ItineraryFromSupabase, ItinerarySteps } from '@/types/itinerary';
import { is3DModel } from '@/utils/formatters';

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
                unservable: step.unservable || false,
                required_machine_type: step.required_machine_type || null,
                recommendation: step.recommendation || null,
                fixture_requirements: step.fixture_requirements || null,
                setup_description: step.setup_description || null
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
                unservable: step.unservable || false,
                required_machine_type: step.required_machine_type || null,
                recommendation: step.recommendation || null,
                fixture_requirements: step.fixture_requirements || null,
                setup_description: step.setup_description || null
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
        
        // Fetch machine and tool names for each step
        const enhancedSteps = await Promise.all(
          stepsData.steps.map(async (step) => {
            let machineData = null;
            let toolData = null;
            
            // Fetch machine details if machine_id exists
            if (step.machine_id) {
              const { data: machine } = await supabase
                .from('machines')
                .select('name')
                .eq('id', step.machine_id)
                .single();
                
              if (machine) {
                machineData = machine;
              }
            }
            
            // Fetch tool details if tooling_id exists
            if (step.tooling_id) {
              const { data: tool } = await supabase
                .from('tooling')
                .select('tool_name')
                .eq('id', step.tooling_id)
                .single();
                
              if (tool) {
                toolData = tool;
              }
            }
            
            return {
              ...step,
              machine_name: machineData?.name || step.machine_name || step.machine_id,
              tool_name: toolData?.tool_name || step.tool_name || step.tooling_id,
              hourly_rate: 25, // Example default value
              tool_wear_cost: 5, // Example default value
              setup_cost: 10, // Example default value
              required_machine_type: step.required_machine_type || (step.unservable ? "Required machine type not specified" : null),
              recommendation: step.recommendation || null,
              fixture_requirements: step.fixture_requirements || null,
              setup_description: step.setup_description || null
            };
          })
        );
        
        // Create properly formatted itinerary with enhanced steps
        const formattedItinerary: Itinerary = {
          id: supabaseData.id,
          part_id: supabaseData.part_id,
          steps: {
            steps: enhancedSteps,
            total_cost: stepsData.total_cost
          },
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

  // Extract fileName from URL
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/app/parts')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Parts
          </Button>
          
          {part && (
            <DeletePartDialog 
              part={part} 
              deleting={deleting} 
              onDelete={handleDelete} 
            />
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : part ? (
          <div className="grid gap-6 md:grid-cols-2">
            <PartInfoCard
              part={part}
              generatingItinerary={generatingItinerary}
              generateItinerary={generateItinerary}
              handleDownload={handleDownload}
              extractFileName={extractFileName}
            />

            <PartPreviewCard
              part={part}
              is3DModel={is3DModel}
            />

            <div className="md:col-span-2">
              <ItineraryCard
                itinerary={itinerary}
                loadingItinerary={loadingItinerary}
                itineraryError={itineraryError}
              />
            </div>
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
