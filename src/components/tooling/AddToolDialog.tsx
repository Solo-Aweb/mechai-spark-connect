import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DynamicParameterFields } from "./DynamicParameterFields";
import { useState, useEffect } from "react";

// Form schema for adding a new tool
const toolFormSchema = z.object({
  tool_name: z.string().min(1, "Tool name is required"),
  machine_id: z.string().min(1, "Machine selection is required"),
  tool_type_id: z.string().min(1, "Tool type selection is required"),
  material: z.string().min(1, "Material is required"),
  diameter: z.coerce.number().positive("Diameter must be positive"),
  length: z.coerce.number().positive("Length must be positive"),
  life_remaining: z.coerce.number().min(0, "Life remaining cannot be negative"),
  cost: z.coerce.number().min(0, "Tool cost cannot be negative"),
  replacement_cost: z.coerce.number().min(0, "Replacement cost cannot be negative"),
  params: z.record(z.any()).optional(),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

type Machine = {
  id: string;
  name: string;
  type: string;
  hourly_rate?: number;
};

type ToolType = {
  id: string;
  name: string;
  machine_type: string;
  param_schema: {
    fields: Array<{
      key: string;
      label: string;
      type: "number" | "text";
    }>;
  };
};

type AddToolDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  machines: Machine[] | undefined;
};

export function AddToolDialog({ isOpen, setIsOpen, machines }: AddToolDialogProps) {
  const queryClient = useQueryClient();
  const [selectedMachineType, setSelectedMachineType] = useState<string>("");
  const [selectedToolType, setSelectedToolType] = useState<ToolType | null>(null);
  
  // Initialize the form
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      tool_name: "",
      machine_id: "",
      tool_type_id: "",
      material: "",
      diameter: 0,
      length: 0,
      life_remaining: 100,
      cost: 0,
      replacement_cost: 0,
      params: {},
    },
  });

  // Query to fetch tool types
  const { data: toolTypes, isLoading: isLoadingToolTypes, error: toolTypesError } = useQuery({
    queryKey: ["tool-types", selectedMachineType],
    queryFn: async () => {
      try {
        console.log("AddDialog - Fetching tool types for machine type:", selectedMachineType);
        
        let query = supabase
          .from("tool_types")
          .select("*")
          .order("name");

        if (selectedMachineType) {
          query = query.eq("machine_type", selectedMachineType);
        }

        const { data, error } = await query;

        console.log("AddDialog - Tool types data:", data);
        console.log("AddDialog - Selected machine type:", selectedMachineType);

        if (error) {
          console.error("AddDialog - Error fetching tool types:", error);
          throw new Error(error.message);
        }
        
        // Transform the data to match our ToolType interface
        const transformedData = data?.map(item => ({
          id: item.id,
          name: item.name,
          machine_type: item.machine_type,
          param_schema: item.param_schema as {
            fields: Array<{
              key: string;
              label: string;
              type: "number" | "text";
            }>;
          }
        })) || [];
        
        console.log("AddDialog - Transformed tool types:", transformedData);
        return transformedData;
      } catch (error) {
        console.error("AddDialog - Tool types query error:", error);
        throw error;
      }
    },
    enabled: !!selectedMachineType,
  });

  // Update machine type when machine selection changes
  useEffect(() => {
    const machineId = form.watch("machine_id");
    console.log("AddDialog - Machine ID changed:", machineId);
    if (machineId && machines) {
      const selectedMachine = machines.find(m => m.id === machineId);
      console.log("AddDialog - Selected machine:", selectedMachine);
      if (selectedMachine) {
        console.log("AddDialog - Setting machine type to:", selectedMachine.type);
        setSelectedMachineType(selectedMachine.type);
        // Reset tool type selection when machine changes
        form.setValue("tool_type_id", "");
        setSelectedToolType(null);
      }
    }
  }, [form.watch("machine_id"), machines, form]);

  // Update selected tool type when tool type selection changes
  useEffect(() => {
    const toolTypeId = form.watch("tool_type_id");
    if (toolTypeId && toolTypes) {
      const selectedType = toolTypes.find(t => t.id === toolTypeId);
      setSelectedToolType(selectedType || null);
      // Reset params when tool type changes
      form.setValue("params", {});
    }
  }, [form.watch("tool_type_id"), toolTypes, form]);

  // Mutation to add a new tool
  const addToolMutation = useMutation({
    mutationFn: async (values: ToolFormValues) => {
      try {
        console.log("AddDialog - Adding new tool with values:", values);
        
        const toolData = {
          tool_name: values.tool_name,
          machine_id: values.machine_id,
          tool_type_id: values.tool_type_id,
          material: values.material,
          diameter: values.diameter,
          length: values.length,
          life_remaining: values.life_remaining,
          cost: values.cost,
          replacement_cost: values.replacement_cost,
          params: values.params || {},
        };
        
        const { data, error } = await supabase
          .from("tooling")
          .insert([toolData])
          .select();

        if (error) {
          console.error("AddDialog - Error adding tool:", error);
          throw new Error(error.message);
        }
        
        console.log("AddDialog - Tool added successfully:", data);
        return data;
      } catch (error) {
        console.error("AddDialog - Mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Tool added successfully");
      setIsOpen(false);
      form.reset();
      setSelectedMachineType("");
      setSelectedToolType(null);
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error: Error) => {
      console.error("AddDialog - Mutation onError handler:", error);
      toast.error(`Error adding tool: ${error.message}`);
    },
  });

  const onSubmit = (values: ToolFormValues) => {
    console.log("AddDialog - Form submitted with values:", values);
    addToolMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                          {machine.name} ({machine.type}) {machine.hourly_rate ? `- $${machine.hourly_rate}/hr` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedMachineType && (
              <FormField
                control={form.control}
                name="tool_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isLoadingToolTypes 
                              ? "Loading tool types..." 
                              : toolTypes?.length === 0 
                                ? `No tool types found for ${selectedMachineType}` 
                                : "Select a tool type"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {toolTypes && toolTypes.length > 0 ? (
                          toolTypes.map((toolType) => (
                            <SelectItem key={toolType.id} value={toolType.id}>
                              {toolType.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-options" disabled>
                            No tool types available for {selectedMachineType}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {toolTypesError && (
                      <FormDescription className="text-destructive">
                        Error loading tool types: {toolTypesError.message}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {selectedToolType && (
              <DynamicParameterFields
                control={form.control}
                paramSchema={selectedToolType.param_schema}
                params={form.watch("params") || {}}
              />
            )}
            
            <h3 className="text-lg font-medium mt-6">Cost Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Initial purchase cost
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="replacement_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Replacement Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Cost to replace when worn out
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
  );
}
