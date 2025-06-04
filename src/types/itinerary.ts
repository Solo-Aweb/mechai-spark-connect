
export interface ItineraryStep {
  description: string;
  machine_id?: string | null;
  machine_name?: string | null;
  tooling_id?: string | null;
  tool_name?: string | null;
  time?: number;
  cost?: number;
  hourly_rate?: number;
  tool_wear_cost?: number;
  setup_cost?: number;
  unservable?: boolean;
  parameter_issue?: boolean;
  inadequate_parameter?: string | null;
  required_parameter?: string | null;
  required_machine_type?: string | null;
  required_tool_type?: string | null;
  recommendation?: string | null;
  fixture_requirements?: string | null;
  setup_description?: string | null;
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

export interface ItineraryFromSupabase {
  id: string;
  part_id: string;
  steps: string | ItinerarySteps | ItineraryStep[];
  total_cost: number;
  created_at: string;
}
