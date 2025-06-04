
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { TOOL_TYPES_CONFIG } from "@/config/toolTypes";
import { Database } from "lucide-react";

export function ToolTypesSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);

  const seedToolTypes = async () => {
    setIsSeeding(true);
    try {
      // First, check if tool types already exist
      const { data: existingToolTypes } = await supabase
        .from("tool_types")
        .select("*")
        .limit(1);

      if (existingToolTypes && existingToolTypes.length > 0) {
        toast.info("Tool types already exist in the database");
        setIsSeeding(false);
        return;
      }

      // Prepare tool types for insertion
      const toolTypesToInsert = [];
      
      for (const [machineType, tools] of Object.entries(TOOL_TYPES_CONFIG)) {
        for (const tool of tools) {
          toolTypesToInsert.push({
            name: tool.name,
            machine_type: machineType,
            param_schema: tool.param_schema
          });
        }
      }

      console.log(`Preparing to seed ${toolTypesToInsert.length} tool types...`);

      // Insert tool types in batches
      const batchSize = 50;
      for (let i = 0; i < toolTypesToInsert.length; i += batchSize) {
        const batch = toolTypesToInsert.slice(i, i + batchSize);
        const { error } = await supabase
          .from("tool_types")
          .insert(batch);

        if (error) {
          console.error("Error inserting batch:", error);
          throw new Error(error.message);
        }
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}`);
      }

      toast.success(`Successfully seeded ${toolTypesToInsert.length} tool types`);
    } catch (error) {
      console.error("Error seeding tool types:", error);
      toast.error(`Error seeding tool types: ${error.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button 
      onClick={seedToolTypes} 
      disabled={isSeeding}
      variant="default"
      size="sm"
      className="flex items-center gap-2"
    >
      <Database className="h-4 w-4" />
      {isSeeding ? "Seeding Tool Types..." : "Seed Tool Types"}
    </Button>
  );
}
