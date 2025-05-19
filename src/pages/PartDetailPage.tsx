
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { ArrowLeft, Loader2, Download, Trash2 } from 'lucide-react';
import { ModelViewer } from '@/components/ModelViewer';
import { SvgPreview } from '@/components/SvgPreview';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Part {
  id: string;
  name: string;
  file_url: string | null;
  svg_url: string | null;
  upload_date: string;
}

const PartDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPartDetails();
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
      toast("Error", {
        description: 'Could not load part details'
      });
      navigate('/app/parts');
    } finally {
      setLoading(false);
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
      
      toast("Success", {
        description: 'Part deleted successfully'
      });
      
      navigate('/app/parts');
    } catch (error) {
      console.error('Error deleting part:', error);
      toast("Error", {
        description: 'Could not delete part'
      });
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
                {part.file_url && is3DModel(part.file_url) ? (
                  <ModelViewer 
                    url={part.file_url} 
                    fileType={part.file_url.split('.').pop()?.toLowerCase() || ''}
                  />
                ) : part.svg_url ? (
                  <SvgPreview url={part.svg_url} altText={`${part.name} preview`} />
                ) : (
                  <div className="flex items-center justify-center p-10 bg-gray-50 rounded-md">
                    <p className="text-gray-400">No preview available</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
