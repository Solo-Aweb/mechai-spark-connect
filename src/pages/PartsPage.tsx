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
import { File, Plus, Loader2, Box, FileUp, Image } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ModelViewer } from '@/components/ModelViewer';
import { SvgPreview } from '@/components/SvgPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Part {
  id: string;
  name: string;
  file_url: string | null;
  svg_url: string | null;
  upload_date: string;
}

const PartsPage = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [partName, setPartName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileType, setPreviewFileType] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const navigate = useNavigate();

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
      toast("Error", {
        description: 'Could not load parts'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName) {
      toast("Error", {
        description: 'Part name is required'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('parts')
        .insert([
          {
            name: partName,
            file_url: fileUrl || null,
            svg_url: svgUrl || null,
            user_id: user.id, // Add the user ID to associate with the part
          },
        ])
        .select();

      if (error) throw error;

      toast("Success", {
        description: 'Part created successfully'
      });
      setPartName('');
      setFileUrl('');
      setSvgUrl(null);
      setIsDialogOpen(false);
      await fetchParts();
    } catch (error: any) {
      console.error('Error creating part:', error);
      toast("Error", {
        description: `Could not create part: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploadComplete = (url: string, fileName: string, svgFileUrl?: string) => {
    setFileUrl(url);
    setSvgUrl(svgFileUrl || null);
    
    // Extract file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    setPreviewFileUrl(fileExtension === 'svg' || svgFileUrl ? (svgFileUrl || url) : url);
    setPreviewFileType(fileExtension);
    setActiveTab('preview');
    
    // Auto-populate part name from file name
    if (!partName) {
      setPartName(fileName.replace(`.${fileExtension}`, ''));
    }
    
    toast("File uploaded", {
      description: fileExtension === 'pdf' ? 
        'PDF processed and converted to SVG for preview' : 
        'You can now preview the file',
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

  // Determine file type icon based on URL or extension
  const getFileTypeIcon = (part: Part) => {
    if (part.svg_url) {
      return <Image className="mr-1 h-4 w-4 text-blue-500" />;
    } else if (part.file_url) {
      const fileExt = part.file_url.split('.').pop()?.toLowerCase();
      if (['stl', 'step'].includes(fileExt || '')) {
        return <FileUp className="mr-1 h-4 w-4 text-blue-500" />;
      }
    }
    return <File className="mr-1 h-4 w-4 text-gray-500" />;
  };

  const getFileTypeLabel = (part: Part) => {
    if (part.svg_url) {
      return "2D Drawing";
    } else if (part.file_url) {
      const fileExt = part.file_url.split('.').pop()?.toLowerCase();
      if (['stl', 'step'].includes(fileExt || '')) {
        return "3D Model";
      }
    }
    return "No file";
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
                    Create a new part by providing a name and uploading a model file or drawing.
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
                          accept=".stl,.step,.dxf,.pdf,.svg"
                        />
                      </div>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="preview" className="py-4">
                  {previewFileUrl && (
                    <div className="space-y-4">
                      {['stl', 'step'].includes(previewFileType) ? (
                        <ModelViewer url={previewFileUrl} fileType={previewFileType} />
                      ) : (
                        <SvgPreview url={previewFileUrl} altText="Drawing preview" />
                      )}
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
                    <TableHead>File Type</TableHead>
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
                          <div className="flex items-center">
                            {getFileTypeIcon(part)}
                            <span className={part.file_url || part.svg_url ? "text-blue-500" : "text-gray-500"}>
                              {getFileTypeLabel(part)}
                            </span>
                          </div>
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
                        <p>No parts found. Add your first part to get started.</p>
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
