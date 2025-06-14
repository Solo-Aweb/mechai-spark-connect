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
import { Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Json } from "@/integrations/supabase/types";
import { ErrorDisplay } from "@/components/tooling/ErrorDisplay";

// Define the Material type based on the database schema
type Material = {
  id: string;
  name: string;
  stock_type: "bar" | "sheet" | "block";
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    thickness?: number;
  };
  unit_cost: number;
  user_id: string;
  created_at: string;
};

// Form schema for adding a new material
const materialFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  stock_type: z.enum(["bar", "sheet", "block"]),
  unit_cost: z.coerce.number().min(0, "Unit cost cannot be negative"),
  dimensions: z.object({
    length: z.coerce.number().optional(),
    width: z.coerce.number().optional(),
    height: z.coerce.number().optional(),
    diameter: z.coerce.number().optional(),
    thickness: z.coerce.number().optional(),
  }),
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

export default function MaterialsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Query to fetch materials with enhanced error handling
  const { data: materials, isLoading, isError: isMaterialsError } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      try {
        console.log("Fetching materials");
        
        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("User not authenticated");
          setError("Please log in to view your materials.");
          return [];
        }

        const { data, error } = await supabase
          .from("materials")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching materials:", error);
          toast.error("Failed to fetch materials");
          setError("Failed to load materials. Please try again later.");
          throw new Error(error.message);
        }
        return data as Material[];
      } catch (error) {
        console.error("Unexpected error fetching materials:", error);
        setError("An unexpected error occurred while loading materials.");
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fix the mutation to ensure all required fields are provided
  const addMaterialMutation = useMutation({
    mutationFn: async (values: MaterialFormValues) => {
      try {
        // Get the authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Fix to ensure all required fields are properly set
        const materialData = {
          name: values.name,
          stock_type: values.stock_type,
          unit_cost: values.unit_cost,
          dimensions: values.dimensions as Json,
          user_id: user.id
        };
        
        const { data, error } = await supabase
          .from("materials")
          .insert([materialData])
          .select();

        if (error) {
          console.error("Error adding material:", error);
          setError(`Error adding material: ${error.message}`);
          throw new Error(error.message);
        }
        return data;
      } catch (error) {
        if (error instanceof Error) {
          setError(`Error adding material: ${error.message}`);
        } else {
          setError("An unexpected error occurred");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Material added successfully");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (error: Error) => {
      toast.error(`Error adding material: ${error.message}`);
    },
  });

  // Initialize the form with default values
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: "",
      stock_type: "bar",
      unit_cost: 0,
      dimensions: {},
    },
  });

  // Watch the stock type to dynamically change the form fields
  const stockType = form.watch("stock_type");

  const onSubmit = (values: MaterialFormValues) => {
    // Clean up dimensions based on stock type
    const dimensions = { ...values.dimensions };
    if (stockType === "bar") {
      delete dimensions.width;
      delete dimensions.thickness;
    } else if (stockType === "sheet") {
      delete dimensions.height;
      delete dimensions.diameter;
    } else if (stockType === "block") {
      delete dimensions.diameter;
      delete dimensions.thickness;
    }

    const finalValues = {
      ...values,
      dimensions,
    };

    addMaterialMutation.mutate(finalValues);
  };

  // Function to render the dimensions fields based on the stock type
  const renderDimensionFields = () => {
    switch (stockType) {
      case "bar":
        return (
          <>
            <FormField
              control={form.control}
              name="dimensions.length"
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
            <FormField
              control={form.control}
              name="dimensions.diameter"
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
          </>
        );
      case "sheet":
        return (
          <>
            <FormField
              control={form.control}
              name="dimensions.length"
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
            <FormField
              control={form.control}
              name="dimensions.width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (mm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dimensions.thickness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thickness (mm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case "block":
        return (
          <>
            <FormField
              control={form.control}
              name="dimensions.length"
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
            <FormField
              control={form.control}
              name="dimensions.width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (mm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dimensions.height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (mm)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Function to format the dimensions for display in the table
  const formatDimensions = (material: Material) => {
    const dim = material.dimensions;
    
    switch (material.stock_type) {
      case "bar":
        return `L: ${dim.length || '-'} mm, Ø: ${dim.diameter || '-'} mm`;
      case "sheet":
        return `L: ${dim.length || '-'} mm, W: ${dim.width || '-'} mm, T: ${dim.thickness || '-'} mm`;
      case "block":
        return `L: ${dim.length || '-'} mm, W: ${dim.width || '-'} mm, H: ${dim.height || '-'} mm`;
      default:
        return "Unknown dimensions";
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  return (
    <AppLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Materials</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" size={16} />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Aluminum 6061, Steel 1018" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stock_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stock type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="sheet">Sheet</SelectItem>
                          <SelectItem value="block">Block</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  {renderDimensionFields()}
                </div>
                <FormField
                  control={form.control}
                  name="unit_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={addMaterialMutation.isPending}
                    className="w-full"
                  >
                    {addMaterialMutation.isPending ? "Adding..." : "Add Material"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <ErrorDisplay 
        error={error}
        isToolsError={false}
        isMachinesError={false}
        clearError={clearError}
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse">Loading materials...</div>
        </div>
      ) : (
        <Table>
          <TableCaption>List of available materials</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stock Type</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Unit Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials && materials.length > 0 ? (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell className="capitalize">{material.stock_type}</TableCell>
                  <TableCell>{formatDimensions(material)}</TableCell>
                  <TableCell>${material.unit_cost.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No materials found. Add a new material to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </AppLayout>
  );
}
