// Auto-generated from the Supabase project schema via MCP `generate_typescript_types`.
// Regenerate when migrations change:
//   bunx supabase gen types typescript --project-id ezfvurrngphgwppnskus > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_events: {
        Row: {
          id: string;
          workspace_id: string;
          actor_user_id: string;
          actor_email: string;
          entity_type: "workspace" | "shareholder" | "document" | "compliance_obligation";
          entity_id: string | null;
          action: string;
          description: string;
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          actor_user_id: string;
          actor_email: string;
          entity_type: "workspace" | "shareholder" | "document" | "compliance_obligation";
          entity_id?: string | null;
          action: string;
          description: string;
          payload?: Json | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "audit_events_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_obligations: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          regulatory_body: string;
          category: Database["public"]["Enums"]["compliance_category"];
          start_date: string | null;
          due_date: string;
          recurrence: Database["public"]["Enums"]["compliance_recurrence"];
          official_url: string | null;
          reminder_days_before: number;
          notes: string | null;
          completed_at: string | null;
          previous_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          regulatory_body: string;
          category: Database["public"]["Enums"]["compliance_category"];
          start_date?: string | null;
          due_date: string;
          recurrence?: Database["public"]["Enums"]["compliance_recurrence"];
          official_url?: string | null;
          reminder_days_before?: number;
          notes?: string | null;
          completed_at?: string | null;
          previous_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          regulatory_body?: string;
          category?: Database["public"]["Enums"]["compliance_category"];
          start_date?: string | null;
          due_date?: string;
          recurrence?: Database["public"]["Enums"]["compliance_recurrence"];
          official_url?: string | null;
          reminder_days_before?: number;
          notes?: string | null;
          completed_at?: string | null;
          previous_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_obligations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          mime_type: string | null;
          name: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          mime_type?: string | null;
          name: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          mime_type?: string | null;
          name?: string;
          size_bytes?: number;
          storage_path?: string;
          uploaded_by?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      esop_pools: {
        Row: {
          id: string;
          workspace_id: string;
          total_pool_shares: number | string;
          strike_price_reference_sar: number | string | null;
          pool_creation_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          total_pool_shares: number | string;
          strike_price_reference_sar?: number | string | null;
          pool_creation_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          total_pool_shares?: number | string;
          strike_price_reference_sar?: number | string | null;
          pool_creation_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esop_pools_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      esop_grants: {
        Row: {
          id: string;
          pool_id: string;
          workspace_id: string;
          employee_name: string;
          employee_email: string;
          department: Database["public"]["Enums"]["esop_department"];
          options_count: number | string;
          strike_price_sar: number | string;
          grant_date: string;
          vesting_type: Database["public"]["Enums"]["esop_vesting_type"];
          vesting_start_date: string | null;
          vesting_end_date: string | null;
          cliff_months: number;
          vesting_frequency: Database["public"]["Enums"]["esop_vesting_frequency"] | null;
          status: Database["public"]["Enums"]["esop_grant_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          pool_id: string;
          workspace_id: string;
          employee_name: string;
          employee_email: string;
          department: Database["public"]["Enums"]["esop_department"];
          options_count: number | string;
          strike_price_sar: number | string;
          grant_date: string;
          vesting_type: Database["public"]["Enums"]["esop_vesting_type"];
          vesting_start_date?: string | null;
          vesting_end_date?: string | null;
          cliff_months?: number;
          vesting_frequency?: Database["public"]["Enums"]["esop_vesting_frequency"] | null;
          status?: Database["public"]["Enums"]["esop_grant_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          pool_id?: string;
          workspace_id?: string;
          employee_name?: string;
          employee_email?: string;
          department?: Database["public"]["Enums"]["esop_department"];
          options_count?: number | string;
          strike_price_sar?: number | string;
          grant_date?: string;
          vesting_type?: Database["public"]["Enums"]["esop_vesting_type"];
          vesting_start_date?: string | null;
          vesting_end_date?: string | null;
          cliff_months?: number;
          vesting_frequency?: Database["public"]["Enums"]["esop_vesting_frequency"] | null;
          status?: Database["public"]["Enums"]["esop_grant_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "esop_grants_pool_id_fkey";
            columns: ["pool_id"];
            isOneToOne: false;
            referencedRelation: "esop_pools";
            referencedColumns: ["id"];
          },
        ];
      };
      shareholders: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          email: string | null;
          entity_or_individual: Database["public"]["Enums"]["entity_or_individual"];
          entry_date: string;
          id: string;
          instrument_data: Json;
          instrument_type: Database["public"]["Enums"]["instrument_type"];
          name: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          email?: string | null;
          entity_or_individual: Database["public"]["Enums"]["entity_or_individual"];
          entry_date: string;
          id?: string;
          instrument_data: Json;
          instrument_type: Database["public"]["Enums"]["instrument_type"];
          name: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          email?: string | null;
          entity_or_individual?: Database["public"]["Enums"]["entity_or_individual"];
          entry_date?: string;
          id?: string;
          instrument_data?: Json;
          instrument_type?: Database["public"]["Enums"]["instrument_type"];
          name?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shareholders_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["workspace_role"];
          added_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          added_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          invited_email: string;
          role: Database["public"]["Enums"]["workspace_role"];
          token: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          invited_email: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          token: string;
          invited_by: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          invited_email?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          token?: string;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      valuation_sessions: {
        Row: {
          id: string;
          workspace_id: string;
          label: string;
          methodology: Database["public"]["Enums"]["valuation_methodology"];
          inputs: Json;
          result_low_sar: number | string | null;
          result_mid_sar: number | string | null;
          result_high_sar: number | string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          label: string;
          methodology: Database["public"]["Enums"]["valuation_methodology"];
          inputs: Json;
          result_low_sar?: number | string | null;
          result_mid_sar?: number | string | null;
          result_high_sar?: number | string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          label?: string;
          methodology?: Database["public"]["Enums"]["valuation_methodology"];
          inputs?: Json;
          result_low_sar?: number | string | null;
          result_mid_sar?: number | string | null;
          result_high_sar?: number | string | null;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "valuation_sessions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      traction_metrics: {
        Row: {
          id: string;
          workspace_id: string;
          month: string;
          mrr_sar: number | string | null;
          customer_count: number | null;
          gross_margin_pct: number | string | null;
          cash_runway_months: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          month: string;
          mrr_sar?: number | string | null;
          customer_count?: number | null;
          gross_margin_pct?: number | string | null;
          cash_runway_months?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          month?: string;
          mrr_sar?: number | string | null;
          customer_count?: number | null;
          gross_margin_pct?: number | string | null;
          cash_runway_months?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "traction_metrics_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          city: string;
          country: string;
          created_at: string;
          entity_status: Database["public"]["Enums"]["entity_status"];
          founded_year: number | null;
          funding_stage: string;
          id: string;
          legal_entity: string | null;
          name: string;
          one_liner: string;
          owner_user_id: string;
          sector: string;
          updated_at: string;
          website_url: string | null;
          show_mrr_publicly: boolean;
          show_customer_count_publicly: boolean;
          show_gross_margin_publicly: boolean;
          show_cash_runway_publicly: boolean;
          public_profile_published: boolean;
          slug: string | null;
        };
        Insert: {
          city: string;
          country: string;
          created_at?: string;
          entity_status: Database["public"]["Enums"]["entity_status"];
          founded_year?: number | null;
          funding_stage: string;
          id?: string;
          legal_entity?: string | null;
          name: string;
          one_liner: string;
          owner_user_id: string;
          sector: string;
          updated_at?: string;
          website_url?: string | null;
          show_mrr_publicly?: boolean;
          show_customer_count_publicly?: boolean;
          show_gross_margin_publicly?: boolean;
          show_cash_runway_publicly?: boolean;
          public_profile_published?: boolean;
          slug?: string | null;
        };
        Update: {
          city?: string;
          country?: string;
          created_at?: string;
          entity_status?: Database["public"]["Enums"]["entity_status"];
          founded_year?: number | null;
          funding_stage?: string;
          id?: string;
          legal_entity?: string | null;
          name?: string;
          one_liner?: string;
          owner_user_id?: string;
          sector?: string;
          updated_at?: string;
          website_url?: string | null;
          show_mrr_publicly?: boolean;
          show_customer_count_publicly?: boolean;
          show_gross_margin_publicly?: boolean;
          show_cash_runway_publicly?: boolean;
          public_profile_published?: boolean;
          slug?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      compliance_category: "tax" | "commercial" | "regulatory" | "administrative";
      compliance_recurrence: "one_time" | "monthly" | "quarterly" | "annual";
      entity_or_individual: "entity" | "individual";
      entity_status: "incorporated" | "product_only";
      esop_department:
        | "engineering"
        | "product"
        | "sales"
        | "operations"
        | "design"
        | "legal"
        | "finance"
        | "other";
      esop_grant_status: "active" | "fully_vested" | "terminated";
      esop_vesting_frequency: "monthly" | "quarterly" | "annual";
      esop_vesting_type: "immediate" | "graded";
      instrument_type: "ordinary" | "isafe" | "safe" | "convertible_note";
      isafe_conversion_status: "unconverted" | "converted";
      valuation_methodology: "revenue_multiple" | "scorecard" | "berkus" | "dcf";
      workspace_role: "owner" | "admin" | "viewer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export const Constants = {
  public: {
    Enums: {
      entity_or_individual: ["entity", "individual"],
      entity_status: ["incorporated", "product_only"],
      instrument_type: ["ordinary", "isafe"],
      isafe_conversion_status: ["unconverted", "converted"],
    },
  },
} as const;
