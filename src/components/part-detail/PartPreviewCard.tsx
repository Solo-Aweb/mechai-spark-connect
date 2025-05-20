
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelViewer } from "@/components/ModelViewer";
import { SvgPreview } from "@/components/SvgPreview";
import { Part } from "@/types/part";

interface PartPreviewCardProps {
  part: Part;
  is3DModel: (url: string | null) => boolean;
}

export const PartPreviewCard = ({ part, is3DModel }: PartPreviewCardProps) => {
  return (
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
  );
};
