
import { formatDate } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileCog, Loader2 } from "lucide-react";
import { Part } from "@/types/part";

interface PartInfoCardProps {
  part: Part;
  generatingItinerary: boolean;
  generateItinerary: () => Promise<void>;
  handleDownload: (url: string, filename: string) => void;
  extractFileName: (url: string | null) => string;
}

export const PartInfoCard = ({
  part,
  generatingItinerary,
  generateItinerary,
  handleDownload,
  extractFileName
}: PartInfoCardProps) => {
  return (
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
  );
};
