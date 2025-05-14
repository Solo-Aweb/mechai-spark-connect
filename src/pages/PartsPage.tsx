
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import { File, Plus, Loader2, Box } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/FileUpload';
import { ModelViewer } from '@/components/ModelViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Part {
  id: string;
  name: string;
  file_url: string | null;
  upload_date: string;
}

const PartsPage = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [partName, setPartName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileType, setPreviewFileType] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
      toast({
        title: 'Error',
        description: 'Could not load parts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName) {
      toast({
        title: 'Error',
        description: 'Part name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('parts')
        .insert([
          {
            name: partName,
            file_url: fileUrl || null,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Part created successfully',
      });
      setPartName('');
      setFileUrl('');
      setIsDialogOpen(false);
      await fetchParts();
    } catch (error) {
      console.error('Error creating part:', error);
      toast({
        title: 'Error',
        description: 'Could not create part',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploadComplete = (url: string, fileName: string) => {
    setFileUrl(url);
    
    // Extract file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    setPreviewFileUrl(url);
    setPreviewFileType(fileExtension);
    setActiveTab('preview');
    
    toast({
      title: 'File uploaded',
      description: 'You can now preview the model',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const viewPartDetails = (partId: string) => {
    navigate(`/app/parts/${partId}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Parts</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Part
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <DialogHeader>
                  <DialogTitle>Add New Part</DialogTitle>
                  <DialogDescription>
                    Create a new part by providing a name and uploading a model file.
                  </DialogDescription>
                  <TabsList className="grid grid-cols-2 mt-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="preview" disabled={!previewFileUrl}>Preview</TabsTrigger>
                  </TabsList>
                </DialogHeader>

                <TabsContent value="details" className="space-y-4 py-4">
                  <form id="add-part-form" onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={partName}
                          onChange={(e) => setPartName(e.target.value)}
                          className="col-span-3"
                        />
                      </div>

                      <div className="col-span-4">
                        <FileUpload 
                          onUploadComplete={handleFileUploadComplete}
                          accept=".stl,.step,.dxf"
                        />
                      </div>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="preview" className="py-4">
                  {previewFileUrl && (
                    <div className="space-y-4">
                      <ModelViewer url={previewFileUrl} fileType={previewFileType} />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  form="add-part-form"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Part'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Parts</CardTitle>
            <CardDescription>
              View and manage your machine parts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parts.length > 0 ? (
                    parts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">{part.name}</TableCell>
                        <TableCell>{formatDate(part.upload_date)}</TableCell>
                        <TableCell>
                          {part.file_url ? (
                            <div className="flex items-center">
                              <Box className="mr-1 h-4 w-4 text-blue-500" />
                              <span className="text-blue-500">3D Model</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">No file</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewPartDetails(part.id)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10">
                        No parts found. Add your first part to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PartsPage;
