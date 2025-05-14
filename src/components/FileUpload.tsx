
import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface FileUploadProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void;
  accept?: string;
  maxSize?: number;
}

export const FileUpload = ({ 
  onUploadComplete, 
  accept = '.stl,.step,.dxf', 
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `models/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('parts')
        .upload(filePath, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('parts')
        .getPublicUrl(filePath);
      
      toast("Upload complete", {
        description: "File has been uploaded successfully"
      });
      
      onUploadComplete(publicUrl, file.name);
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

  return (
    <div className="grid w-full gap-4">
      <div>
        <Label htmlFor="file">Upload 3D Model</Label>
        <div className="mt-2">
          <Input
            id="file"
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Supported formats: STL, STEP, DXF. Max size: {Math.round(maxSize / (1024 * 1024))}MB
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
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
