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
      entity_or_individual: "entity" | "individual";
      entity_status: "incorporated" | "product_only";
      instrument_type: "ordinary" | "isafe";
      isafe_conversion_status: "unconverted" | "converted";
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
