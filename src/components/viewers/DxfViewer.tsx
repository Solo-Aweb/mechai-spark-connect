import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import DxfParser from 'dxf-parser';
import { supabase } from '../lib/supabaseClient'; // ensure your Supabase client is configured

interface DxfViewerProps {
  /**
   * The storage path of the DXF file in Supabase (e.g. 'parts/myDrawing.dxf')
   */
  filePath: string;
}

export const DxfViewer = ({ filePath }: DxfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !filePath) return;
    setIsLoading(true);
    setError(null);

    const loadDxf = async () => {
      try {
        // Download raw DXF bytes from Supabase Storage
        const { data: fileBlob, error: downloadError } = await supabase
          .storage
          .from('parts')
          .download(filePath);
        if (downloadError || !fileBlob) {
          throw new Error(downloadError?.message || 'Failed to download DXF file');
        }

        // Read text and parse
        const dxfContent = await fileBlob.text();
        const parser = new DxfParser();
        const dxfData = parser.parse(dxfContent);
        console.log('DXF data parsed:', dxfData);

        // Build SVG
        const svgNS = 'http://www.w3.org/2000/svg';
        const svgElement = document.createElementNS(svgNS, 'svg');
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        svgElement.style.backgroundColor = '#f0f0f0';

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        dxfData.entities.forEach((entity: any) => {
          switch (entity.type) {
            case 'LINE': {
              const [v1, v2] = entity.vertices;
              const line = document.createElementNS(svgNS, 'line');
              line.setAttribute('x1', v1.x.toString());
              line.setAttribute('y1', v1.y.toString());
              line.setAttribute('x2', v2.x.toString());
              line.setAttribute('y2', v2.y.toString());
              line.setAttribute('stroke', 'black');
              line.setAttribute('stroke-width', '1');
              svgElement.appendChild(line);
              [v1, v2].forEach(v => {
                minX = Math.min(minX, v.x);
                minY = Math.min(minY, v.y);
                maxX = Math.max(maxX, v.x);
                maxY = Math.max(maxY, v.y);
              });
              break;
            }

            case 'LWPOLYLINE':
            case 'POLYLINE': {
              const points = entity.vertices.map((v: any) => `${v.x},${v.y}`).join(' ');
              const poly = document.createElementNS(svgNS, 'polyline');
              poly.setAttribute('points', points);
              poly.setAttribute('fill', 'none');
              poly.setAttribute('stroke', 'black');
              poly.setAttribute('stroke-width', '1');
              svgElement.appendChild(poly);
              entity.vertices.forEach((v: any) => {
                minX = Math.min(minX, v.x);
                minY = Math.min(minY, v.y);
                maxX = Math.max(maxX, v.x);
                maxY = Math.max(maxY, v.y);
              });
              break;
            }

            case 'CIRCLE': {
              const { center, radius } = entity;
              const circle = document.createElementNS(svgNS, 'circle');
              circle.setAttribute('cx', center.x.toString());
              circle.setAttribute('cy', center.y.toString());
              circle.setAttribute('r', radius.toString());
              circle.setAttribute('fill', 'none');
              circle.setAttribute('stroke', 'black');
              circle.setAttribute('stroke-width', '1');
              svgElement.appendChild(circle);
              minX = Math.min(minX, center.x - radius);
              minY = Math.min(minY, center.y - radius);
              maxX = Math.max(maxX, center.x + radius);
              maxY = Math.max(maxY, center.y + radius);
              break;
            }

            case 'ARC': {
              const { center, radius, startAngle, endAngle } = entity;
              const startX = center.x + radius * Math.cos(startAngle);
              const startY = center.y + radius * Math.sin(startAngle);
              const endX = center.x + radius * Math.cos(endAngle);
              const endY = center.y + radius * Math.sin(endAngle);
              const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? '1' : '0';
              const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
              const path = document.createElementNS(svgNS, 'path');
              path.setAttribute('d', d);
              path.setAttribute('fill', 'none');
              path.setAttribute('stroke', 'black');
              path.setAttribute('stroke-width', '1');
              svgElement.appendChild(path);
              minX = Math.min(minX, center.x - radius);
              minY = Math.min(minY, center.y - radius);
              maxX = Math.max(maxX, center.x + radius);
              maxY = Math.max(maxY, center.y + radius);
              break;
            }

            default:
              // skip unsupported entity types
          }
        });

        if (minX < maxX && minY < maxY) {
          const width = maxX - minX;
          const height = maxY - minY;
          const pad = Math.max(width, height) * 0.05;
          svgElement.setAttribute('viewBox', `${minX - pad} ${minY - pad} ${width + pad * 2} ${height + pad * 2}`);
        }

        const container = containerRef.current!;
        container.innerHTML = '';
        container.appendChild(svgElement);
        setIsLoading(false);
      } catch (err: any) {
        console.error('DXF parse error:', err);
        setError(err.message || 'Failed to parse DXF');
        setIsLoading(false);
      }
    };

    loadDxf();
  }, [filePath]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading DXF file...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white bg-opacity-70">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

