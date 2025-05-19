
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SvgPreviewProps {
  url: string | null;
  altText?: string;
  className?: string;
}

export const SvgPreview = ({ url, altText = "SVG Preview", className = "" }: SvgPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!url) {
    return (
      <Card className={`flex items-center justify-center p-4 ${className}`} style={{ minHeight: '200px' }}>
        <p className="text-gray-400">No preview available</p>
      </Card>
    );
  }

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError("Failed to load SVG preview");
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        <iframe
          src={url}
          title={altText}
          className="w-full border-0"
          style={{ height: '300px', display: loading ? 'none' : 'block' }}
          onLoad={handleLoad}
          onError={handleError}
        />
      </CardContent>
    </Card>
  );
};
