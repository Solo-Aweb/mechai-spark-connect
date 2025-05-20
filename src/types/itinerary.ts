
import { Json } from "@/integrations/supabase/types";

export interface ItineraryStep {
  description: string;
  machine_id: string | null;
  tooling_id: string | null;
  time: number;
  cost: number;
  unservable?: boolean;
  machine_name?: string;
  tool_name?: string;
  hourly_rate?: number;
  tool_wear_cost?: number;
  setup_cost?: number;
}

export interface ItinerarySteps {
  steps: ItineraryStep[];
  total_cost: number;
}

export interface Itinerary {
  id: string;
  part_id: string;
  steps: ItinerarySteps;
  total_cost: number;
  created_at: string;
}

// Interface matching the actual shape of data from Supabase
export interface ItineraryFromSupabase {
  id: string;
  part_id: string;
  steps: Json;
  total_cost: number;
  created_at: string;
}
