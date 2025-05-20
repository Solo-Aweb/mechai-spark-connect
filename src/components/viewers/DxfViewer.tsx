
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import DxfParser from 'dxf-parser';

interface DxfViewerProps {
  url: string;
}

export const DxfViewer = ({ url }: DxfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;
    
    setIsLoading(true);
    setError(null);

    const loadDxf = async () => {
      try {
        // Use fetch with a specific header to prevent download behavior
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch DXF file: ${response.statusText}`);
        }
        
        const dxfContent = await response.text();
        const parser = new DxfParser();
        const dxfData = parser.parseSync(dxfContent);
        
        console.log('DXF data parsed:', dxfData);
        
        // Create an SVG representation of the DXF data
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('width', '100%');
        svgElement.setAttribute('height', '100%');
        svgElement.style.backgroundColor = '#f0f0f0';
        
        // Extract bounds from DXF
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        // Process entities
        dxfData.entities.forEach((entity: any) => {
          if (entity.type === 'LINE') {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', entity.vertices[0].x.toString());
            line.setAttribute('y1', entity.vertices[0].y.toString());
            line.setAttribute('x2', entity.vertices[1].x.toString());
            line.setAttribute('y2', entity.vertices[1].y.toString());
            line.setAttribute('stroke', 'black');
            line.setAttribute('stroke-width', '1');
            
            svgElement.appendChild(line);
            
            // Update bounds
            minX = Math.min(minX, entity.vertices[0].x, entity.vertices[1].x);
            minY = Math.min(minY, entity.vertices[0].y, entity.vertices[1].y);
            maxX = Math.max(maxX, entity.vertices[0].x, entity.vertices[1].x);
            maxY = Math.max(maxY, entity.vertices[0].y, entity.vertices[1].y);
          } else if (entity.type === 'POLYLINE' || entity.type === 'LWPOLYLINE') {
            const points = entity.vertices.map((v: any) => `${v.x},${v.y}`).join(' ');
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('points', points);
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke', 'black');
            polyline.setAttribute('stroke-width', '1');
            
            svgElement.appendChild(polyline);
            
            // Update bounds
            entity.vertices.forEach((v: any) => {
              minX = Math.min(minX, v.x);
              minY = Math.min(minY, v.y);
              maxX = Math.max(maxX, v.x);
              maxY = Math.max(maxY, v.y);
            });
          } else if (entity.type === 'CIRCLE') {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', entity.center.x.toString());
            circle.setAttribute('cy', entity.center.y.toString());
            circle.setAttribute('r', entity.radius.toString());
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', 'black');
            circle.setAttribute('stroke-width', '1');
            
            svgElement.appendChild(circle);
            
            // Update bounds
            minX = Math.min(minX, entity.center.x - entity.radius);
            minY = Math.min(minY, entity.center.y - entity.radius);
            maxX = Math.max(maxX, entity.center.x + entity.radius);
            maxY = Math.max(maxY, entity.center.y + entity.radius);
          } else if (entity.type === 'ARC') {
            // Convert arc to SVG path
            const startAngle = entity.startAngle;
            const endAngle = entity.endAngle;
            
            // Calculate start and end points
            const startX = entity.center.x + entity.radius * Math.cos(startAngle);
            const startY = entity.center.y + entity.radius * Math.sin(startAngle);
            const endX = entity.center.x + entity.radius * Math.cos(endAngle);
            const endY = entity.center.y + entity.radius * Math.sin(endAngle);
            
            // Determine if arc is larger than 180 degrees
            const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
            
            // Create path data
            const pathData = `M ${startX} ${startY} A ${entity.radius} ${entity.radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'black');
            path.setAttribute('stroke-width', '1');
            
            svgElement.appendChild(path);
            
            // Update bounds
            minX = Math.min(minX, entity.center.x - entity.radius);
            minY = Math.min(minY, entity.center.y - entity.radius);
            maxX = Math.max(maxX, entity.center.x + entity.radius);
            maxY = Math.max(maxY, entity.center.y + entity.radius);
          }
        });
        
        // Set viewBox for proper scaling
        if (minX !== Infinity && minY !== Infinity && maxX !== -Infinity && maxY !== -Infinity) {
          const width = maxX - minX;
          const height = maxY - minY;
          const padding = Math.max(width, height) * 0.05; // 5% padding
          svgElement.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`);
        }
        
        // Clear container and append SVG
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(svgElement);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing DXF:', error);
        setError('Failed to parse DXF file');
        setIsLoading(false);
      }
    };

    loadDxf();

    // No specific cleanup needed here
  }, [url]);

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
