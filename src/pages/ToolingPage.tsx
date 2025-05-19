
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { toast } from "@/components/ui/sonner";
import { ToolingHeader } from "@/components/tooling/ToolingHeader";
import { ToolingTable } from "@/components/tooling/ToolingTable";
import { AddToolDialog } from "@/components/tooling/AddToolDialog";
import { ErrorDisplay } from "@/components/tooling/ErrorDisplay";

// Define the Tool type based on the database schema
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

// Define the Machine type for dropdown selection
type Machine = {
  id: string;
  name: string;
};

export default function ToolingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Query to fetch tools - Enhanced error handling
  const { data: tools, isLoading: isLoadingTools, isError: isToolsError } = useQuery({
    queryKey: ["tools", selectedMachineId],
    queryFn: async () => {
      try {
        console.log("Fetching tools with machineId:", selectedMachineId);
        let query = supabase
          .from("tooling")
          .select("*, machines(name)")
          .order("created_at", { ascending: false });
  
        if (selectedMachineId) {
          query = query.eq("machine_id", selectedMachineId);
        }
  
        const { data, error } = await query;
  
        if (error) {
          console.error("Error fetching tools:", error);
          toast.error("Failed to fetch tools");
          setError("Failed to load tools. Please try again later.");
          return [];
        }
        
        console.log("Tools data fetched:", data);
        return data as (Tool & { machines: { name: string } })[];
      } catch (error) {
        console.error("Unexpected error fetching tools:", error);
        toast.error("An unexpected error occurred");
        setError("An unexpected error occurred while loading tools.");
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Query to fetch machines for the dropdown - Enhanced error handling
  const { 
    data: machines, 
    isLoading: isLoadingMachines,
    isError: isMachinesError 
  } = useQuery({
    queryKey: ["machines-dropdown"],
    queryFn: async () => {
      try {
        console.log("Fetching machines for dropdown");
        const { data, error } = await supabase
          .from("machines")
          .select("id, name")
          .order("name");
  
        if (error) {
          console.error("Error fetching machines:", error);
          toast.error("Failed to fetch machines");
          return [];
        }
        
        console.log("Machines data fetched:", data);
        return data as Machine[];
      } catch (error) {
        console.error("Unexpected error fetching machines:", error);
        toast.error("An unexpected error occurred");
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Log initial render
  useEffect(() => {
    console.log("ToolingPage mounted");
    return () => {
      console.log("ToolingPage unmounted");
    };
  }, []);

  return (
    <AppLayout>
      <ToolingHeader 
        machines={machines}
        isLoadingMachines={isLoadingMachines}
        selectedMachineId={selectedMachineId}
        setSelectedMachineId={setSelectedMachineId}
        setIsDialogOpen={setIsDialogOpen}
      />

      <ErrorDisplay 
        error={error}
        isToolsError={isToolsError}
        isMachinesError={isMachinesError}
      />

      <ToolingTable 
        tools={tools}
        isLoadingTools={isLoadingTools}
        selectedMachineId={selectedMachineId}
      />

      <AddToolDialog 
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        machines={machines}
      />
    </AppLayout>
  );
}
