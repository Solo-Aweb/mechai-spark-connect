
import { useState } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Plus, Filter } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Define the Tool and Machine types based on the database schema
type Tool = {
  id: string;
  tool_name: string;
  diameter: number;
  length: number;
  material: string;
  life_remaining: number;
  machine_id: string;
  created_at: string;
  machine?: Machine;
};

type Machine = {
  id: string;
  name: string;
  type: string;
};

// Form schema for adding a new tool
const toolFormSchema = z.object({
  tool_name: z.string().min(1, "Tool name is required"),
  diameter: z.coerce.number().positive("Must be a positive number"),
  length: z.coerce.number().positive("Must be a positive number"),
  material: z.string().min(1, "Material is required"),
  life_remaining: z.coerce.number().min(0, "Cannot be negative"),
  machine_id: z.string().min(1, "Machine is required"),
});

type ToolFormValues = z.infer<typeof toolFormSchema>;

export default function ToolingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query to fetch machines for the dropdown
  const { data: machines, isLoading: machinesLoading } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("id, name, type")
        .order("name");

      if (error) {
        throw new Error(error.message);
      }
      return data as Machine[];
    },
  });

  // Query to fetch tools with their associated machine names
  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ["tools", selectedMachine],
    queryFn: async () => {
      let query = supabase
        .from("tooling")
        .select(`*, machine:machine_id(id, name)`);

      if (selectedMachine) {
        query = query.eq("machine_id", selectedMachine);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data as Tool[];
    },
  });

  // Mutation to add a new tool
  const addToolMutation = useMutation({
    mutationFn: async (newTool: ToolFormValues) => {
      const { data, error } = await supabase.from("tooling").insert([newTool]).select();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Tool added successfully");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error: Error) => {
      toast.error(`Error adding tool: ${error.message}`);
    },
  });

  // Initialize the form
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      tool_name: "",
      diameter: 0,
      length: 0,
      material: "",
      life_remaining: 100,
      machine_id: "",
    },
  });

  const onSubmit = (values: ToolFormValues) => {
    addToolMutation.mutate(values);
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tooling</h1>
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
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Carbide, HSS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="machine_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a machine" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {machinesLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading machines...
                            </SelectItem>
                          ) : (
                            machines &&
                            machines.map((machine) => (
                              <SelectItem key={machine.id} value={machine.id}>
                                {machine.name} ({machine.type})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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

      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={16} />
          <span>Filter by machine:</span>
          <Select value={selectedMachine || ""} onValueChange={(value) => setSelectedMachine(value || null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Machines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Machines</SelectItem>
              {machines && machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {toolsLoading ? (
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
              <TableHead>Diameter (mm)</TableHead>
              <TableHead>Length (mm)</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Life Remaining (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools && tools.length > 0 ? (
              tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium">{tool.tool_name}</TableCell>
                  <TableCell>{tool.machine?.name || 'Unknown'}</TableCell>
                  <TableCell>{tool.diameter}</TableCell>
                  <TableCell>{tool.length}</TableCell>
                  <TableCell>{tool.material}</TableCell>
                  <TableCell>{tool.life_remaining}%</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {selectedMachine
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
