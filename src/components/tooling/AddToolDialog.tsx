
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type Machine = {
  id: string;
  name: string;
};

type AddToolDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  machines: Machine[] | undefined;
};

export function AddToolDialog({ isOpen, setIsOpen, machines }: AddToolDialogProps) {
  const queryClient = useQueryClient();
  
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

  // Mutation to add a new tool
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
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
    onError: (error: Error) => {
      console.error("Mutation onError handler:", error);
      toast.error(`Error adding tool: ${error.message}`);
    },
  });

  const onSubmit = (values: ToolFormValues) => {
    console.log("Form submitted with values:", values);
    addToolMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
  );
}
