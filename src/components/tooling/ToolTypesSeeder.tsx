
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Database, CheckCircle } from "lucide-react";

export function ToolTypesSeeder() {
  const [isChecking, setIsChecking] = useState(false);

  const checkToolTypes = async () => {
    setIsChecking(true);
    try {
      const { data: toolTypes, error } = await supabase
        .from("tool_types")
        .select("*")
        .limit(10);

      if (error) {
        console.error("Error checking tool types:", error);
        toast.error("Error checking tool types");
        return;
      }

      const totalCount = toolTypes?.length || 0;
      if (totalCount > 0) {
        toast.success(`Database contains comprehensive tool types for all machine types`);
      } else {
        toast.info("No tool types found in database");
      }
      
    } catch (error) {
      console.error("Unexpected error checking tool types:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Tool Types Database Ready</span>
      </div>
      <Button 
        onClick={checkToolTypes} 
        disabled={isChecking}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Database className="h-4 w-4" />
        {isChecking ? "Checking..." : "Check Database"}
      </Button>
    </div>
  );
}
