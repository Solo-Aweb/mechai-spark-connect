
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileViewer } from "@/components/FileViewer";
import { SvgPreview } from "@/components/SvgPreview";
import { Part } from "@/types/part";

interface PartPreviewCardProps {
  part: Part;
  is3DModel: (url: string | null) => boolean;
}

export const PartPreviewCard = ({ part, is3DModel }: PartPreviewCardProps) => {
  const getFileType = (url: string | null): string => {
    if (!url) return '';
    return url.split('.').pop()?.toLowerCase() || '';
  };

  const fileType = getFileType(part.file_url);
  const supportedFormats = ['stl', 'step', 'dxf', 'svg', 'pdf'];
  const isSupported = fileType && supportedFormats.includes(fileType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-2">
        {part.svg_url ? (
          <SvgPreview url={part.svg_url} altText={`${part.name} preview`} />
        ) : part.file_url && isSupported ? (
          <FileViewer 
            url={part.file_url} 
            fileType={fileType}
          />
        ) : (
          <div className="flex items-center justify-center p-10 bg-gray-50 rounded-md">
            <p className="text-gray-400">
              {part.file_url 
                ? `Unsupported format: ${fileType}` 
                : "No preview available"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
