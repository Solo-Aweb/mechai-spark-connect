
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
import { Edit } from "lucide-react";

type Tool = {
  id: string;
  tool_name: string;
  machine_id: string;
  material: string;
  diameter: number;
  length: number;
  life_remaining: number;
  created_at: string;
  machines: { name: string } | null;
};

type ToolingTableProps = {
  tools: (Tool & { machines: { name: string } })[] | undefined;
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

  return (
    <Table>
      <TableCaption>List of available tools</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Tool Name</TableHead>
          <TableHead>Machine</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Diameter (mm)</TableHead>
          <TableHead>Length (mm)</TableHead>
          <TableHead>Life Remaining (%)</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tools && tools.length > 0 ? (
          tools.map((tool) => (
            <TableRow key={tool.id}>
              <TableCell className="font-medium">{tool.tool_name}</TableCell>
              <TableCell>{tool.machines?.name || "Unknown Machine"}</TableCell>
              <TableCell>{tool.material}</TableCell>
              <TableCell>{tool.diameter}</TableCell>
              <TableCell>{tool.length}</TableCell>
              <TableCell>{tool.life_remaining}%</TableCell>
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
            <TableCell colSpan={7} className="text-center">
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
