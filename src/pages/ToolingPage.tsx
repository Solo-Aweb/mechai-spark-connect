
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { toast } from "@/components/ui/sonner";
import { ToolingHeader } from "@/components/tooling/ToolingHeader";
import { ToolingTable } from "@/components/tooling/ToolingTable";
import { AddToolDialog } from "@/components/tooling/AddToolDialog";
import { EditToolDialog } from "@/components/tooling/EditToolDialog";
import { ErrorDisplay } from "@/components/tooling/ErrorDisplay";

// Define the Tool type based on the database schema
type Tool = {
  id: string;
  tool_name: string;
  machine_id: string;
  tool_type_id: string | null;
  material: string;
  diameter: number;
  length: number;
  life_remaining: number;
  cost: number | null;
  replacement_cost: number | null;
  params: Record<string, any> | null;
  user_id: string;
  created_at: string;
  machines: { name: string; type: string } | null;
  tool_types?: { name: string } | null;
};

// Define the Machine type for dropdown selection
type Machine = {
  id: string;
  name: string;
  type: string;
  user_id: string | null;
};

export default function ToolingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Query to fetch tools - Enhanced to include tool types
  const { data: tools, isLoading: isLoadingTools, isError: isToolsError, refetch: refetchTools } = useQuery({
    queryKey: ["tools", selectedMachineId],
    queryFn: async () => {
      try {
        console.log("Fetching tools with machineId:", selectedMachineId);
        
        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("User not authenticated");
          setError("Please log in to view your tools.");
          return [];
        }

        let query = supabase
          .from("tooling")
          .select(`
            *, 
            machines(name, type),
            tool_types(name)
          `)
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
        return data as Tool[];
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

  // Query to fetch machines for the dropdown - Enhanced to include machine type
  const { 
    data: machines, 
    isLoading: isLoadingMachines,
    isError: isMachinesError,
    refetch: refetchMachines
  } = useQuery({
    queryKey: ["machines-dropdown"],
    queryFn: async () => {
      try {
        console.log("Fetching machines for dropdown");
        
        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("User not authenticated");
          return [];
        }

        const { data, error } = await supabase
          .from("machines")
          .select("id, name, type, user_id")
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

  // Refetch data after auth session changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      refetchTools();
      refetchMachines();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [refetchTools, refetchMachines]);

  // Log initial render
  useEffect(() => {
    console.log("ToolingPage mounted");
    return () => {
      console.log("ToolingPage unmounted");
    };
  }, []);

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Handle edit tool
  const handleEditTool = (tool: Tool) => {
    setSelectedTool(tool);
    setIsEditDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tools</h1>
        </div>

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
          clearError={clearError}
        />

        <ToolingTable 
          tools={tools}
          isLoadingTools={isLoadingTools}
          selectedMachineId={selectedMachineId}
          onEditTool={handleEditTool}
        />

        <AddToolDialog 
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          machines={machines}
        />

        <EditToolDialog
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          tool={selectedTool}
          machines={machines}
        />
      </div>
    </AppLayout>
  );
}
