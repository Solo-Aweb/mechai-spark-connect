
import React from 'react';
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

// Form schema for editing a tool
const toolFormSchema = z.object({
  tool_name: z.string().min(1, "Tool name is required"),
  machine_id: z.string().min(1, "Machine selection is required"),
  tool_type_id: z.string().min(1, "Tool type selection is required"),
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
  created_at: string;
  machines: { name: string; type: string } | null;
};

type EditToolDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  tool: Tool | null;
  machines: Machine[] | undefined;
};

export function EditToolDialog({ isOpen, setIsOpen, tool, machines }: EditToolDialogProps) {
  const queryClient = useQueryClient();
  const [selectedMachineType, setSelectedMachineType] = useState<string>("");
  const [selectedToolType, setSelectedToolType] = useState<ToolType | null>(null);
  
  // Initialize the form with tool data
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      tool_name: "",
      machine_id: "",
      tool_type_id: "",
      life_remaining: 100,
      cost: 0,
      replacement_cost: 0,
      params: {},
    },
  });

  // Enhanced query to fetch tool types with better error handling
  const { data: toolTypes, isLoading: isLoadingToolTypes, error: toolTypesError } = useQuery({
    queryKey: ["tool-types", selectedMachineType],
    queryFn: async () => {
      try {
        console.log("EditDialog - Fetching tool types for machine type:", selectedMachineType);
        
        if (!selectedMachineType) {
          return [];
        }

        const { data, error } = await supabase
          .from("tool_types")
          .select("*")
          .eq("machine_type", selectedMachineType)
          .order("name");

        if (error) {
          console.error("EditDialog - Error fetching tool types:", error);
          throw new Error(error.message);
        }
        
        console.log("EditDialog - Tool types data:", data);
        
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
        
        console.log("EditDialog - Transformed tool types:", transformedData);
        return transformedData;
      } catch (error) {
        console.error("EditDialog - Tool types query error:", error);
        throw error;
      }
    },
    enabled: !!selectedMachineType,
    retry: 1,
  });

  // Reset form when tool changes
  React.useEffect(() => {
    if (tool) {
      form.reset({
        tool_name: tool.tool_name,
        machine_id: tool.machine_id,
        tool_type_id: tool.tool_type_id || "",
        life_remaining: tool.life_remaining,
        cost: tool.cost || 0,
        replacement_cost: tool.replacement_cost || 0,
        params: tool.params || {},
      });

      // Set machine type based on the tool's machine
      if (tool.machines) {
        setSelectedMachineType(tool.machines.type);
      }
    }
  }, [form, tool]);

  // Update machine type when machine selection changes
  useEffect(() => {
    const machineId = form.watch("machine_id");
    if (machineId && machines) {
      const selectedMachine = machines.find(m => m.id === machineId);
      if (selectedMachine) {
        setSelectedMachineType(selectedMachine.type);
        // Reset tool type selection when machine changes (unless it's the initial load)
        if (tool && machineId !== tool.machine_id) {
          form.setValue("tool_type_id", "");
          setSelectedToolType(null);
        }
      }
    }
  }, [form.watch("machine_id"), machines, form, tool]);

  // Update selected tool type when tool type selection changes
  useEffect(() => {
    const toolTypeId = form.watch("tool_type_id");
    if (toolTypeId && toolTypes) {
      const selectedType = toolTypes.find(t => t.id === toolTypeId);
      setSelectedToolType(selectedType || null);
    }
  }, [form.watch("tool_type_id"), toolTypes]);

  // Mutation to update a tool
  const updateToolMutation = useMutation({
    mutationFn: async (values: ToolFormValues) => {
      if (!tool) throw new Error("No tool selected for update");
      
      const { data, error } = await supabase
        .from("tooling")
        .update({
          tool_name: values.tool_name,
          machine_id: values.machine_id,
          tool_type_id: values.tool_type_id,
          material: tool.material, // Keep existing material value
          diameter: tool.diameter, // Keep existing diameter value
          length: tool.length, // Keep existing length value
          life_remaining: values.life_remaining,
          cost: values.cost,
          replacement_cost: values.replacement_cost,
          params: values.params || {},
        })
        .eq("id", tool.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Tool updated successfully");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error: Error) => {
      toast.error(`Error updating tool: ${error.message}`);
    },
  });

  const onSubmit = (values: ToolFormValues) => {
    updateToolMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen && !!tool} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
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
                            {isLoadingToolTypes 
                              ? "Loading..." 
                              : `No tool types available for ${selectedMachineType}.`
                            }
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

            {selectedToolType && selectedToolType.param_schema && (
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
                disabled={updateToolMutation.isPending}
                className="w-full"
              >
                {updateToolMutation.isPending ? "Updating..." : "Update Tool"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
