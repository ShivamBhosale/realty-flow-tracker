export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contact_interactions: {
        Row: {
          completed_at: string | null
          contact_id: string
          created_at: string
          follow_up_date: string | null
          id: string
          interaction_type: string
          notes: string | null
          scheduled_at: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          interaction_type: string
          notes?: string | null
          scheduled_at?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          interaction_type?: string
          notes?: string | null
          scheduled_at?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_source: Database["public"]["Enums"]["lead_source"] | null
          notes: string | null
          phone: string | null
          preferred_areas: string[] | null
          state: string | null
          status: Database["public"]["Enums"]["contact_status"]
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          notes?: string | null
          phone?: string | null
          preferred_areas?: string[] | null
          state?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          notes?: string | null
          phone?: string | null
          preferred_areas?: string[] | null
          state?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          active_listings: number | null
          appointments_attended: number | null
          appointments_set: number | null
          buyers_signed: number | null
          calls_made: number | null
          closed_deals: number | null
          contacts_reached: number | null
          created_at: string
          date: string
          id: string
          listing_presentations: number | null
          listings_taken: number | null
          pending_contracts: number | null
          updated_at: string
          user_id: string
          volume_closed: number | null
        }
        Insert: {
          active_listings?: number | null
          appointments_attended?: number | null
          appointments_set?: number | null
          buyers_signed?: number | null
          calls_made?: number | null
          closed_deals?: number | null
          contacts_reached?: number | null
          created_at?: string
          date: string
          id?: string
          listing_presentations?: number | null
          listings_taken?: number | null
          pending_contracts?: number | null
          updated_at?: string
          user_id: string
          volume_closed?: number | null
        }
        Update: {
          active_listings?: number | null
          appointments_attended?: number | null
          appointments_set?: number | null
          buyers_signed?: number | null
          calls_made?: number | null
          closed_deals?: number | null
          contacts_reached?: number | null
          created_at?: string
          date?: string
          id?: string
          listing_presentations?: number | null
          listings_taken?: number | null
          pending_contracts?: number | null
          updated_at?: string
          user_id?: string
          volume_closed?: number | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          annual_income_goal: number
          average_commission_per_deal: number
          created_at: string
          deals_needed: number | null
          id: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          annual_income_goal: number
          average_commission_per_deal: number
          created_at?: string
          deals_needed?: number | null
          id?: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          annual_income_goal?: number
          average_commission_per_deal?: number
          created_at?: string
          deals_needed?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contact_status:
        | "new"
        | "contacted"
        | "qualified"
        | "interested"
        | "not_interested"
        | "do_not_call"
      contact_type: "buyer" | "seller" | "investor" | "referral_partner"
      lead_source:
        | "referral"
        | "website"
        | "social_media"
        | "cold_call"
        | "open_house"
        | "advertisement"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contact_status: [
        "new",
        "contacted",
        "qualified",
        "interested",
        "not_interested",
        "do_not_call",
      ],
      contact_type: ["buyer", "seller", "investor", "referral_partner"],
      lead_source: [
        "referral",
        "website",
        "social_media",
        "cold_call",
        "open_house",
        "advertisement",
        "other",
      ],
    },
  },
} as const
