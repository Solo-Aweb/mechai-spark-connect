
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { Plus, Edit } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MachineTypeSelect } from "@/components/machines/MachineTypeSelect";
import { EditMachineDialog } from "@/components/machines/EditMachineDialog";

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
  hourly_rate: number | null;
  setup_cost: number | null;
  operating_cost: number | null;
  user_id: string | null;
  created_at: string;
};

// Form schema for adding a new machine
const machineFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  axes: z.coerce.number().min(1, "Must have at least 1 axis"),
  spindle_rpm: z.coerce.number().min(1, "Spindle RPM must be positive"),
  x_range: z.coerce.number().min(0, "X range cannot be negative"),
  y_range: z.coerce.number().min(0, "Y range cannot be negative"),
  z_range: z.coerce.number().min(0, "Z range cannot be negative"),
  hourly_rate: z.coerce.number().min(0, "Hourly rate cannot be negative"),
  setup_cost: z.coerce.number().min(0, "Setup cost cannot be negative"),
  operating_cost: z.coerce.number().min(0, "Operating cost cannot be negative"),
});

type MachineFormValues = z.infer<typeof machineFormSchema>;

export default function MachinesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const queryClient = useQueryClient();

  // Query to fetch machines
  const { data: machines, isLoading } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch machines");
        throw new Error(error.message);
      }
      return data as Machine[];
    },
  });

  // Mutation to add a new machine
  const addMachineMutation = useMutation({
    mutationFn: async (values: MachineFormValues) => {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const machineData = {
        name: values.name,
        type: values.type,
        axes: values.axes,
        spindle_rpm: values.spindle_rpm,
        x_range: values.x_range,
        y_range: values.y_range,
        z_range: values.z_range,
        hourly_rate: values.hourly_rate,
        setup_cost: values.setup_cost,
        operating_cost: values.operating_cost,
        user_id: user.id,
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
      form.reset();
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
      spindle_rpm: 0,
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

  const handleEditMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsEditDialogOpen(true);
  };

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
                        <Input placeholder="e.g., Haas VF-2" {...field} />
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
                        <MachineTypeSelect onValueChange={field.onChange} value={field.value} />
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
                        <FormLabel>Axes</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" {...field} />
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
          <TableCaption>List of available machines</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Axes</TableHead>
              <TableHead>Spindle RPM</TableHead>
              <TableHead>Work Envelope (mm)</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines && machines.length > 0 ? (
              machines.map((machine) => (
                <TableRow key={machine.id}>
                  <TableCell className="font-medium">{machine.name}</TableCell>
                  <TableCell className="capitalize">{machine.type}</TableCell>
                  <TableCell>{machine.axes}</TableCell>
                  <TableCell>{machine.spindle_rpm.toLocaleString()}</TableCell>
                  <TableCell>
                    {machine.x_range} × {machine.y_range} × {machine.z_range}
                  </TableCell>
                  <TableCell>
                    ${machine.hourly_rate?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMachine(machine)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No machines found. Add a new machine to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <EditMachineDialog
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
        machine={selectedMachine}
      />
    </AppLayout>
  );
}
