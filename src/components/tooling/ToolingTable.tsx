
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";

type Tool = {
  id: string;
  tool_name: string;
  machine_id: string;
  tool_type_id: string | null;
  material: string;
  diameter: number;
  length: number;
  life_remaining: number;
  params: Record<string, any> | null;
  created_at: string;
  machines: { name: string; type: string } | null;
  tool_types?: { name: string } | null;
};

type ToolingTableProps = {
  tools: Tool[] | undefined;
  isLoadingTools: boolean;
  selectedMachineId: string | null;
  onEditTool: (tool: Tool) => void;
};

export function ToolingTable({ tools, isLoadingTools, selectedMachineId, onEditTool }: ToolingTableProps) {
  if (isLoadingTools) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse">Loading tools...</div>
      </div>
    );
  }

  const formatParameters = (params: Record<string, any> | null) => {
    if (!params || Object.keys(params).length === 0) {
      return "None";
    }
    
    return Object.entries(params)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  return (
    <Table>
      <TableCaption>List of available tools</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Tool Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Machine</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Diameter (mm)</TableHead>
          <TableHead>Length (mm)</TableHead>
          <TableHead>Life Remaining</TableHead>
          <TableHead>Parameters</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tools && tools.length > 0 ? (
          tools.map((tool) => (
            <TableRow key={tool.id}>
              <TableCell className="font-medium">{tool.tool_name}</TableCell>
              <TableCell>
                {tool.tool_types?.name ? (
                  <Badge variant="secondary">{tool.tool_types.name}</Badge>
                ) : (
                  <Badge variant="outline">Unspecified</Badge>
                )}
              </TableCell>
              <TableCell>
                {tool.machines?.name || "Unknown Machine"}
                {tool.machines?.type && (
                  <div className="text-xs text-gray-500">({tool.machines.type})</div>
                )}
              </TableCell>
              <TableCell>{tool.material}</TableCell>
              <TableCell>{tool.diameter}</TableCell>
              <TableCell>{tool.length}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    tool.life_remaining > 50 ? 'bg-green-500' : 
                    tool.life_remaining > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  {tool.life_remaining}%
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="text-xs text-gray-600 truncate" title={formatParameters(tool.params)}>
                  {formatParameters(tool.params)}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditTool(tool)}
                >
                  <Edit size={16} className="mr-1" />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={9} className="text-center">
              {selectedMachineId
                ? "No tools found for the selected machine. Add a new tool to get started."
                : "No tools found. Add a new tool to get started."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
