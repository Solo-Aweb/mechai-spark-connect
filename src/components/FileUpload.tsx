
import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, FileUp, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface FileUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string, svgUrl?: string) => void;
  accept?: string;
  maxSize?: number;
}

export const FileUpload = ({ 
  onUploadComplete, 
  accept = '.stl,.step,.dxf,.pdf,.svg', 
  maxSize = 50 * 1024 * 1024  // 50MB default
}: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size
      if (selectedFile.size > maxSize) {
        toast("File too large", {
          description: `File size should be less than ${Math.round(maxSize / (1024 * 1024))}MB`
        });
        return;
      }

      // Check file extension
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      const acceptedExtensions = accept.split(',').map(ext => ext.trim().replace('.', '').toLowerCase());
      
      if (!fileExtension || !acceptedExtensions.includes(fileExtension)) {
        toast("Invalid file type", {
          description: `Allowed file types: ${accept}`
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast("No file selected", {
        description: "Please select a file to upload"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a unique file name with timestamp
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `models/${fileName}`;
      
      // Determine the bucket based on file type
      const is3DModel = ['stl', 'step'].includes(fileExt || '');
      const is2DDrawing = ['dxf', 'pdf', 'svg'].includes(fileExt || '');
      const bucketName = is3DModel ? 'parts' : 'svg_files';
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      // For PDF files, we need to convert to SVG
      if (fileExt === 'pdf') {
        // First, create the part record to get an ID
        const { data: partData, error: partError } = await supabase
          .from('parts')
          .insert([
            {
              name: file.name.replace(`.${fileExt}`, ''),
              file_url: publicUrl
            }
          ])
          .select();
        
        if (partError) throw partError;
        
        const partId = partData[0].id;
        
        // Call the edge function to convert PDF to SVG
        toast("Processing PDF", {
          description: "Converting PDF to SVG for preview..."
        });
        
        const { data: conversionData, error: conversionError } = await supabase.functions
          .invoke('pdfToSvg', {
            body: { 
              pdfUrl: publicUrl, 
              fileName: file.name,
              partId: partId
            }
          });
        
        if (conversionError) throw conversionError;
        
        toast("Upload complete", {
          description: "File has been uploaded and processed successfully"
        });
        
        onUploadComplete(publicUrl, file.name, conversionData?.svgUrl);
      } 
      // For SVG and DXF files, we can use them directly
      else if (fileExt === 'svg' || fileExt === 'dxf') {
        // Create part record with svg_url set to the uploaded file URL
        const { error: partError } = await supabase
          .from('parts')
          .insert([
            {
              name: file.name.replace(`.${fileExt}`, ''),
              file_url: fileExt === 'dxf' ? publicUrl : null,
              svg_url: publicUrl
            }
          ]);
        
        if (partError) throw partError;
        
        toast("Upload complete", {
          description: "File has been uploaded successfully"
        });
        
        onUploadComplete(publicUrl, file.name, publicUrl);
      } 
      // For 3D model files
      else {
        toast("Upload complete", {
          description: "File has been uploaded successfully"
        });
        
        onUploadComplete(publicUrl, file.name);
      }
      
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast("Upload failed", {
        description: "There was a problem uploading your file"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Determine file type icon
  const getFileIcon = () => {
    if (!file) return <Upload className="mr-2 h-4 w-4" />;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (['stl', 'step'].includes(fileExt || '')) {
      return <FileUp className="mr-2 h-4 w-4" />;
    } else {
      return <Image className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <div className="grid w-full gap-4">
      <div>
        <Label htmlFor="file">Upload Model or Drawing</Label>
        <div className="mt-2">
          <Input
            id="file"
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported formats: STL, STEP, DXF, PDF, SVG. Max size: {Math.round(maxSize / (1024 * 1024))}MB
          </p>
        </div>
      </div>
      
      <div>
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              {getFileIcon()}
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
