
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
};

// Form schema for adding a new tool
const toolFormSchema = z.object({
  tool_name: z.string().min(1, "Tool name is required"),
  machine_id: z.string().min(1, "Machine selection is required"),
  material: z.string().min(1, "Material is required"),
  diameter: z.coerce.number().positive("Diameter must be positive"),
  length: z.coerce.number().positive("Length must be positive"),
  life_remaining: z.coerce.number().min(0, "Life remaining cannot be negative"),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

// Define the Machine type for dropdown selection
type Machine = {
  id: string;
  name: string;
};

export default function ToolingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  // Mutation to add a new tool - Enhanced error handling
  const addToolMutation = useMutation({
    mutationFn: async (values: ToolFormValues) => {
      try {
        console.log("Adding new tool with values:", values);
        // Ensure all required fields are explicitly set
        const toolData = {
          tool_name: values.tool_name,
          machine_id: values.machine_id,
          material: values.material,
          diameter: values.diameter,
          length: values.length,
          life_remaining: values.life_remaining,
        };
        
        const { data, error } = await supabase
          .from("tooling")
          .insert([toolData])
          .select();

        if (error) {
          console.error("Error adding tool:", error);
          throw new Error(error.message);
        }
        
        console.log("Tool added successfully:", data);
        return data;
      } catch (error) {
        console.error("Mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Tool added successfully");
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error: Error) => {
      console.error("Mutation onError handler:", error);
      toast.error(`Error adding tool: ${error.message}`);
    },
  });

  // Initialize the form
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      tool_name: "",
      machine_id: "",
      material: "",
      diameter: 0,
      length: 0,
      life_remaining: 100,
    },
  });

  const onSubmit = (values: ToolFormValues) => {
    console.log("Form submitted with values:", values);
    addToolMutation.mutate(values);
  };

  // Log initial render
  useEffect(() => {
    console.log("ToolingPage mounted");
    return () => {
      console.log("ToolingPage unmounted");
    };
  }, []);

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tools</h1>
        <div className="flex gap-4">
          <Select
            value={selectedMachineId || ""}
            onValueChange={(value) => setSelectedMachineId(value || null)}
            disabled={isLoadingMachines || !machines || machines.length === 0}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by machine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Machines</SelectItem>
              {machines?.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" size={16} />
                Add Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Tool</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tool_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tool Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tool name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="machine_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Machine</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a machine" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {machines?.map((machine) => (
                              <SelectItem key={machine.id} value={machine.id}>
                                {machine.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., HSS, Carbide" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="diameter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Diameter (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="life_remaining"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Life Remaining (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={addToolMutation.isPending}
                      className="w-full"
                    >
                      {addToolMutation.isPending ? "Adding..." : "Add Tool"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error display section */}
      {(isToolsError || isMachinesError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md flex items-center gap-3">
          <AlertCircle size={20} />
          <p>
            {error || "There was an error loading data. Please try refreshing the page."}
          </p>
        </div>
      )}

      {isLoadingTools ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse">Loading tools...</div>
        </div>
      ) : (
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {selectedMachineId
                    ? "No tools found for the selected machine. Add a new tool to get started."
                    : "No tools found. Add a new tool to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </AppLayout>
  );
}
