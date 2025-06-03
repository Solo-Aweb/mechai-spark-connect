
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Machine = {
  id: string;
  name: string;
  type: string;
};

type ToolingHeaderProps = {
  machines: Machine[] | undefined;
  isLoadingMachines: boolean;
  selectedMachineId: string | null;
  setSelectedMachineId: (id: string | null) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
};

export function ToolingHeader({
  machines,
  isLoadingMachines,
  selectedMachineId,
  setSelectedMachineId,
  setIsDialogOpen,
}: ToolingHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Tools</h1>
      <div className="flex gap-4">
        <Select
          value={selectedMachineId || "all"}
          onValueChange={(value) => setSelectedMachineId(value === "all" ? null : value)}
          disabled={isLoadingMachines || !machines || machines.length === 0}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by machine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Machines</SelectItem>
            {machines?.map((machine) => (
              <SelectItem key={machine.id} value={machine.id}>
                {machine.name} ({machine.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2" size={16} />
          Add Tool
        </Button>
      </div>
    </div>
  );
}
