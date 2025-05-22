
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
import { toast } from "@/components/ui/sonner";
import { Plus } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";

// Define the Machine type based on the database schema
type Machine = {
  id: string;
  name: string;
  type: string;
  axes: number;
  spindle_rpm: number;
  x_range: number;
  y_range: number;
  z_range: number;
  hourly_rate: number;
  setup_cost: number;
  operating_cost: number;
  created_at: string;
};

// Form schema for adding a new machine
const machineFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  axes: z.coerce.number().int().positive("Must be a positive integer"),
  spindle_rpm: z.coerce.number().int().positive("Must be a positive integer"),
  x_range: z.coerce.number().positive("Must be a positive number"),
  y_range: z.coerce.number().positive("Must be a positive number"),
  z_range: z.coerce.number().positive("Must be a positive number"),
  hourly_rate: z.coerce.number().min(0, "Hourly rate cannot be negative"),
  setup_cost: z.coerce.number().min(0, "Setup cost cannot be negative"),
  operating_cost: z.coerce.number().min(0, "Operating cost cannot be negative"),
});

type MachineFormValues = z.infer<typeof machineFormSchema>;

export default function MachinesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Define the query to fetch machines
  const { data: machines, isLoading, error } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data as Machine[];
    },
  });

  // Fix the mutation to ensure all required fields are provided
  const addMachineMutation = useMutation({
    mutationFn: async (newMachine: MachineFormValues) => {
      // Ensure all required fields are explicitly set
      const machineData = {
        name: newMachine.name,
        type: newMachine.type,
        axes: newMachine.axes,
        spindle_rpm: newMachine.spindle_rpm,
        x_range: newMachine.x_range,
        y_range: newMachine.y_range,
        z_range: newMachine.z_range,
        hourly_rate: newMachine.hourly_rate,
        setup_cost: newMachine.setup_cost,
        operating_cost: newMachine.operating_cost
      };
      
      const { data, error } = await supabase
        .from("machines")
        .insert([machineData])
        .select();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Machine added successfully");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
    onError: (error: Error) => {
      toast.error(`Error adding machine: ${error.message}`);
    },
  });

  // Initialize the form
  const form = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema),
    defaultValues: {
      name: "",
      type: "",
      axes: 3,
      spindle_rpm: 10000,
      x_range: 0,
      y_range: 0,
      z_range: 0,
      hourly_rate: 0,
      setup_cost: 0,
      operating_cost: 0,
    },
  });

  const onSubmit = (values: MachineFormValues) => {
    addMachineMutation.mutate(values);
  };

  if (error) {
    return (
      <AppLayout>
        <div className="text-red-500">Error loading machines: {error.toString()}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Machines</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" size={16} />
              Add Machine
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Machine</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter machine name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mill, Lathe, Router" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="axes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Axes</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="spindle_rpm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spindle RPM</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="x_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>X Range (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="y_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Y Range (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="z_range"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Z Range (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h3 className="text-lg font-medium mt-4">Cost Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="hourly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Base hourly cost for the machine
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="setup_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setup Cost ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          One-time cost for setup
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="operating_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Cost ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Additional cost per operation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={addMachineMutation.isPending}
                    className="w-full"
                  >
                    {addMachineMutation.isPending ? "Adding..." : "Add Machine"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse">Loading machines...</div>
        </div>
      ) : (
        <Table>
          <TableCaption>List of available CNC machines</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Axes</TableHead>
              <TableHead>Spindle RPM</TableHead>
              <TableHead>X Range (mm)</TableHead>
              <TableHead>Y Range (mm)</TableHead>
              <TableHead>Z Range (mm)</TableHead>
              <TableHead>Hourly Rate ($)</TableHead>
              <TableHead>Setup Cost ($)</TableHead>
              <TableHead>Operating Cost ($)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines && machines.length > 0 ? (
              machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">{machine.name}</TableCell>
                  <TableCell>{machine.type}</TableCell>
                  <TableCell>{machine.axes}</TableCell>
                  <TableCell>{machine.spindle_rpm}</TableCell>
                  <TableCell>{machine.x_range}</TableCell>
                  <TableCell>{machine.y_range}</TableCell>
                  <TableCell>{machine.z_range}</TableCell>
                  <TableCell>{machine.hourly_rate || 'N/A'}</TableCell>
                  <TableCell>{machine.setup_cost || 'N/A'}</TableCell>
                  <TableCell>{machine.operating_cost || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center">
                  No machines found. Add a new machine to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </AppLayout>
  );
}
