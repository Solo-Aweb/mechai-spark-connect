import React from 'react';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

// Form schema for editing a machine
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
  created_at: string;
};

type EditMachineDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  machine: Machine | null;
};

export function EditMachineDialog({ isOpen, setIsOpen, machine }: EditMachineDialogProps) {
  const queryClient = useQueryClient();
  
  // Initialize the form with machine data
  const form = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema),
    defaultValues: machine ? {
      name: machine.name,
      type: machine.type,
      axes: machine.axes,
      spindle_rpm: machine.spindle_rpm,
      x_range: machine.x_range,
      y_range: machine.y_range,
      z_range: machine.z_range,
      hourly_rate: machine.hourly_rate || 0,
      setup_cost: machine.setup_cost || 0,
      operating_cost: machine.operating_cost || 0,
    } : {
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

  // Reset form when machine changes
  React.useEffect(() => {
    if (machine) {
      form.reset({
        name: machine.name,
        type: machine.type,
        axes: machine.axes,
        spindle_rpm: machine.spindle_rpm,
        x_range: machine.x_range,
        y_range: machine.y_range,
        z_range: machine.z_range,
        hourly_rate: machine.hourly_rate || 0,
        setup_cost: machine.setup_cost || 0,
        operating_cost: machine.operating_cost || 0,
      });
    }
  }, [form, machine]);

  // Mutation to update a machine
  const updateMachineMutation = useMutation({
    mutationFn: async (values: MachineFormValues) => {
      if (!machine) throw new Error("No machine selected for update");
      
      const { data, error } = await supabase
        .from("machines")
        .update({
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
        })
        .eq("id", machine.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Machine updated successfully");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["machines"] });
    },
    onError: (error: Error) => {
      toast.error(`Error updating machine: ${error.message}`);
    },
  });

  const onSubmit = (values: MachineFormValues) => {
    updateMachineMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen && !!machine} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Machine</DialogTitle>
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
                disabled={updateMachineMutation.isPending}
                className="w-full"
              >
                {updateMachineMutation.isPending ? "Updating..." : "Update Machine"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
