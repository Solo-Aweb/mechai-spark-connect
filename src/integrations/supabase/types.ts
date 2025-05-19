export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      itineraries: {
        Row: {
          created_at: string
          id: string
          part_id: string
          steps: Json
          total_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          part_id: string
          steps: Json
          total_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          part_id?: string
          steps?: Json
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          axes: number
          created_at: string
          id: string
          name: string
          spindle_rpm: number
          type: string
          x_range: number
          y_range: number
          z_range: number
        }
        Insert: {
          axes: number
          created_at?: string
          id?: string
          name: string
          spindle_rpm: number
          type: string
          x_range: number
          y_range: number
          z_range: number
        }
        Update: {
          axes?: number
          created_at?: string
          id?: string
          name?: string
          spindle_rpm?: number
          type?: string
          x_range?: number
          y_range?: number
          z_range?: number
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          dimensions: Json
          id: string
          name: string
          stock_type: Database["public"]["Enums"]["material_stock_type"]
          unit_cost: number
        }
        Insert: {
          created_at?: string
          dimensions: Json
          id?: string
          name: string
          stock_type: Database["public"]["Enums"]["material_stock_type"]
          unit_cost: number
        }
        Update: {
          created_at?: string
          dimensions?: Json
          id?: string
          name?: string
          stock_type?: Database["public"]["Enums"]["material_stock_type"]
          unit_cost?: number
        }
        Relationships: []
      }
      parts: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          name: string
          svg_url: string | null
          upload_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          name: string
          svg_url?: string | null
          upload_date?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string
          svg_url?: string | null
          upload_date?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tooling: {
        Row: {
          created_at: string
          diameter: number
          id: string
          length: number
          life_remaining: number
          machine_id: string
          material: string
          tool_name: string
        }
        Insert: {
          created_at?: string
          diameter: number
          id?: string
          length: number
          life_remaining: number
          machine_id: string
          material: string
          tool_name: string
        }
        Update: {
          created_at?: string
          diameter?: number
          id?: string
          length?: number
          life_remaining?: number
          machine_id?: string
          material?: string
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tooling_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      material_stock_type: "bar" | "sheet" | "block"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      material_stock_type: ["bar", "sheet", "block"],
    },
  },
} as const
