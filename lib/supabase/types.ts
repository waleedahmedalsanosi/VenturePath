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
      acquisition_models: {
        Row: {
          id: string;
          workspace_id: string;
          label: string;
          acquisition_price_sar: number;
          debt_sar: number;
          net_proceeds_sar: number;
          connection_listing_id: string | null;
          created_by: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          label?: string;
          acquisition_price_sar: number;
          debt_sar?: number;
          net_proceeds_sar: number;
          connection_listing_id?: string | null;
          created_by: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          label?: string;
          acquisition_price_sar?: number;
          debt_sar?: number;
          net_proceeds_sar?: number;
          connection_listing_id?: string | null;
          created_by?: string;
          created_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "acquisition_models_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      acquisition_model_results: {
        Row: {
          id: string;
          model_id: string;
          shareholder_id: string;
          shareholder_name: string;
          shares: number;
          payout_sar: number;
          multiple_x: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          model_id: string;
          shareholder_id: string;
          shareholder_name: string;
          shares: number;
          payout_sar: number;
          multiple_x?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          model_id?: string;
          shareholder_id?: string;
          shareholder_name?: string;
          shares?: number;
          payout_sar?: number;
          multiple_x?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "acquisition_model_results_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "acquisition_models";
            referencedColumns: ["id"];
          },
        ];
      };
      financing_rounds: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          status: "draft" | "open" | "closed";
          instrument_type: "isafe" | "safe" | "convertible_note" | "ordinary";
          pre_money_valuation_sar: number | string | null;
          target_raise_sar: number | string | null;
          actual_raise_sar: number | string | null;
          fd_shares_pre_round: number | string | null;
          lead_investor: string | null;
          close_date: string | null;
          board_resolution_id: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          status?: "draft" | "open" | "closed";
          instrument_type?: "isafe" | "safe" | "convertible_note" | "ordinary";
          pre_money_valuation_sar?: number | string | null;
          target_raise_sar?: number | string | null;
          actual_raise_sar?: number | string | null;
          fd_shares_pre_round?: number | string | null;
          lead_investor?: string | null;
          close_date?: string | null;
          board_resolution_id?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          status?: "draft" | "open" | "closed";
          instrument_type?: "isafe" | "safe" | "convertible_note" | "ordinary";
          pre_money_valuation_sar?: number | string | null;
          target_raise_sar?: number | string | null;
          actual_raise_sar?: number | string | null;
          fd_shares_pre_round?: number | string | null;
          lead_investor?: string | null;
          close_date?: string | null;
          board_resolution_id?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "financing_rounds_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      board_meetings: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          meeting_at: string;
          format: Database["public"]["Enums"]["meeting_format"];
          location: string | null;
          agenda: string | null;
          status: Database["public"]["Enums"]["meeting_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          meeting_at: string;
          format?: Database["public"]["Enums"]["meeting_format"];
          location?: string | null;
          agenda?: string | null;
          status?: Database["public"]["Enums"]["meeting_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          meeting_at?: string;
          format?: Database["public"]["Enums"]["meeting_format"];
          location?: string | null;
          agenda?: string | null;
          status?: Database["public"]["Enums"]["meeting_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "board_meetings_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      resolutions: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          template: Database["public"]["Enums"]["resolution_template"];
          body: string;
          status: Database["public"]["Enums"]["resolution_status"];
          meeting_id: string | null;
          decided_at: string | null;
          decided_by: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          template?: Database["public"]["Enums"]["resolution_template"];
          body: string;
          status?: Database["public"]["Enums"]["resolution_status"];
          meeting_id?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          title?: string;
          template?: Database["public"]["Enums"]["resolution_template"];
          body?: string;
          status?: Database["public"]["Enums"]["resolution_status"];
          meeting_id?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "resolutions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_events: {
        Row: {
          id: string;
          workspace_id: string;
          actor_user_id: string;
          actor_email: string;
          entity_type: "workspace" | "shareholder" | "document" | "compliance_obligation" | "share_listing" | "rofr_notification" | "connection_listing" | "connection_inquiry" | "financing_round";
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
          entity_type: "workspace" | "shareholder" | "document" | "compliance_obligation" | "share_listing" | "rofr_notification" | "connection_listing" | "connection_inquiry" | "financing_round";
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
          category_id: string | null;
          visibility: Database["public"]["Enums"]["document_visibility"];
          data_room_tier: Database["public"]["Enums"]["data_room_tier"];
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
          category_id?: string | null;
          visibility?: Database["public"]["Enums"]["document_visibility"];
          data_room_tier?: Database["public"]["Enums"]["data_room_tier"];
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
          category_id?: string | null;
          visibility?: Database["public"]["Enums"]["document_visibility"];
          data_room_tier?: Database["public"]["Enums"]["data_room_tier"];
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
          funding_round_id: string | null;
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
          funding_round_id?: string | null;
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
          funding_round_id?: string | null;
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
      investor_pipeline: {
        Row: {
          id: string;
          workspace_id: string;
          round_id: string;
          name: string;
          email: string | null;
          firm: string | null;
          status: "prospect" | "contacted" | "in_discussion" | "term_sheet" | "passed" | "invested";
          notes: string | null;
          last_contacted_at: string | null;
          ticket_size_sar: number | null;
          is_hot: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          round_id: string;
          name: string;
          email?: string | null;
          firm?: string | null;
          status?: "prospect" | "contacted" | "in_discussion" | "term_sheet" | "passed" | "invested";
          notes?: string | null;
          last_contacted_at?: string | null;
          ticket_size_sar?: number | null;
          is_hot?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          round_id?: string;
          name?: string;
          email?: string | null;
          firm?: string | null;
          status?: "prospect" | "contacted" | "in_discussion" | "term_sheet" | "passed" | "invested";
          notes?: string | null;
          last_contacted_at?: string | null;
          ticket_size_sar?: number | null;
          is_hot?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "investor_pipeline_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "investor_pipeline_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "financing_rounds";
            referencedColumns: ["id"];
          },
        ];
      };
      data_room_links: {
        Row: {
          id: string;
          workspace_id: string;
          round_id: string | null;
          token: string;
          label: string;
          is_active: boolean;
          view_count: number;
          expires_at: string | null;
          created_at: string;
          access_tier: Database["public"]["Enums"]["data_room_tier"];
        };
        Insert: {
          id?: string;
          workspace_id: string;
          round_id?: string | null;
          token?: string;
          label?: string;
          is_active?: boolean;
          view_count?: number;
          expires_at?: string | null;
          created_at?: string;
          access_tier?: Database["public"]["Enums"]["data_room_tier"];
        };
        Update: {
          id?: string;
          workspace_id?: string;
          round_id?: string | null;
          token?: string;
          label?: string;
          is_active?: boolean;
          view_count?: number;
          expires_at?: string | null;
          created_at?: string;
          access_tier?: Database["public"]["Enums"]["data_room_tier"];
        };
        Relationships: [
          {
            foreignKeyName: "data_room_links_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "data_room_links_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "financing_rounds";
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
      vault_categories: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          is_data_room: boolean;
          is_locked: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          is_data_room?: boolean;
          is_locked?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          is_data_room?: boolean;
          is_locked?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vault_categories_workspace_id_fkey";
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
      round_blockers: {
        Row: {
          id: string;
          workspace_id: string;
          round_id: string;
          title: string;
          resolved: boolean;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          round_id: string;
          title: string;
          resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          round_id?: string;
          title?: string;
          resolved?: boolean;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      data_room_views: {
        Row: {
          id: string;
          link_id: string;
          viewed_at: string;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          link_id: string;
          viewed_at?: string;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          link_id?: string;
          viewed_at?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      investor_updates: {
        Row: {
          id: string;
          workspace_id: string;
          round_id: string;
          subject: string;
          body: string;
          mrr_sar: number | string | null;
          runway_months: number | string | null;
          highlights: string[];
          status: string;
          token: string;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          round_id: string;
          subject: string;
          body: string;
          mrr_sar?: number | string | null;
          runway_months?: number | string | null;
          highlights?: string[];
          status?: string;
          token?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          round_id?: string;
          subject?: string;
          body?: string;
          mrr_sar?: number | string | null;
          runway_months?: number | string | null;
          highlights?: string[];
          status?: string;
          token?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      investor_update_views: {
        Row: {
          id: string;
          update_id: string;
          viewed_at: string;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          update_id: string;
          viewed_at?: string;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          update_id?: string;
          viewed_at?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      investor_update_recipients: {
        Row: {
          id: string;
          update_id: string;
          email: string;
          name: string | null;
          sent_at: string | null;
          opened_at: string | null;
          resend_message_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          update_id: string;
          email: string;
          name?: string | null;
          sent_at?: string | null;
          opened_at?: string | null;
          resend_message_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          update_id?: string;
          email?: string;
          name?: string | null;
          sent_at?: string | null;
          opened_at?: string | null;
          resend_message_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investor_update_recipients_update_id_fkey";
            columns: ["update_id"];
            isOneToOne: false;
            referencedRelation: "investor_updates";
            referencedColumns: ["id"];
          },
        ];
      };
      closing_items: {
        Row: {
          id: string;
          workspace_id: string;
          round_id: string;
          pipeline_contact_id: string | null;
          category: "kyc_aml" | "subscription_agreement" | "wire_confirmation" | "share_certificate" | "board_approval" | "other";
          title: string;
          status: "pending" | "in_progress" | "complete" | "waived";
          notes: string | null;
          completed_at: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          round_id: string;
          pipeline_contact_id?: string | null;
          category: "kyc_aml" | "subscription_agreement" | "wire_confirmation" | "share_certificate" | "board_approval" | "other";
          title: string;
          status?: "pending" | "in_progress" | "complete" | "waived";
          notes?: string | null;
          completed_at?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          round_id?: string;
          pipeline_contact_id?: string | null;
          category?: "kyc_aml" | "subscription_agreement" | "wire_confirmation" | "share_certificate" | "board_approval" | "other";
          title?: string;
          status?: "pending" | "in_progress" | "complete" | "waived";
          notes?: string | null;
          completed_at?: string | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      term_sheets: {
        Row: {
          id: string;
          workspace_id: string;
          round_id: string;
          pipeline_contact_id: string | null;
          investor_name: string;
          investor_email: string | null;
          firm: string | null;
          instrument_type: "isafe" | "safe" | "convertible_note" | "ordinary";
          terms: Json;
          status: Database["public"]["Enums"]["term_sheet_status"];
          version: number;
          notes: string | null;
          sent_at: string | null;
          signed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          round_id: string;
          pipeline_contact_id?: string | null;
          investor_name: string;
          investor_email?: string | null;
          firm?: string | null;
          instrument_type: "isafe" | "safe" | "convertible_note" | "ordinary";
          terms?: Json;
          status?: Database["public"]["Enums"]["term_sheet_status"];
          version?: number;
          notes?: string | null;
          sent_at?: string | null;
          signed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          round_id?: string;
          pipeline_contact_id?: string | null;
          investor_name?: string;
          investor_email?: string | null;
          firm?: string | null;
          instrument_type?: "isafe" | "safe" | "convertible_note" | "ordinary";
          terms?: Json;
          status?: Database["public"]["Enums"]["term_sheet_status"];
          version?: number;
          notes?: string | null;
          sent_at?: string | null;
          signed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      share_listings: {
        Row: {
          id: string;
          workspace_id: string;
          shareholder_id: string;
          seller_user_id: string;
          shares_offered: number | string;
          ask_price_sar: number | string;
          notes: string | null;
          status: "open" | "withdrawn" | "sold_off_platform";
          listed_at: string;
          expires_at: string | null;
          closed_at: string | null;
          closed_reason: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          shareholder_id: string;
          seller_user_id: string;
          shares_offered: number | string;
          ask_price_sar: number | string;
          notes?: string | null;
          status?: "open" | "withdrawn" | "sold_off_platform";
          listed_at?: string;
          expires_at?: string | null;
          closed_at?: string | null;
          closed_reason?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          shareholder_id?: string;
          seller_user_id?: string;
          shares_offered?: number | string;
          ask_price_sar?: number | string;
          notes?: string | null;
          status?: "open" | "withdrawn" | "sold_off_platform";
          listed_at?: string;
          expires_at?: string | null;
          closed_at?: string | null;
          closed_reason?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "share_listings_shareholder_id_fkey";
            columns: ["shareholder_id"];
            isOneToOne: false;
            referencedRelation: "shareholders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "share_listings_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      rofr_notifications: {
        Row: {
          id: string;
          workspace_id: string;
          listing_id: string;
          notified_shareholder_id: string;
          notified_email: string | null;
          window_expires_at: string;
          response: "exercise" | "decline" | null;
          responded_at: string | null;
          responded_by_user_id: string | null;
          email_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          listing_id: string;
          notified_shareholder_id: string;
          notified_email?: string | null;
          window_expires_at: string;
          response?: "exercise" | "decline" | null;
          responded_at?: string | null;
          responded_by_user_id?: string | null;
          email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          listing_id?: string;
          notified_shareholder_id?: string;
          notified_email?: string | null;
          window_expires_at?: string;
          response?: "exercise" | "decline" | null;
          responded_at?: string | null;
          responded_by_user_id?: string | null;
          email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rofr_notifications_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "share_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rofr_notifications_notified_shareholder_id_fkey";
            columns: ["notified_shareholder_id"];
            isOneToOne: false;
            referencedRelation: "shareholders";
            referencedColumns: ["id"];
          },
        ];
      };
      connection_listings: {
        Row: {
          id: string;
          workspace_id: string;
          owner_user_id: string;
          listing_type: "exit" | "partnership";
          status: "open" | "withdrawn";
          public_summary: string;
          type_data: Json;
          notes: string | null;
          listed_at: string;
          closed_at: string | null;
          closed_reason: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          owner_user_id: string;
          listing_type: "exit" | "partnership";
          status?: "open" | "withdrawn";
          public_summary: string;
          type_data?: Json;
          notes?: string | null;
          listed_at?: string;
          closed_at?: string | null;
          closed_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["connection_listings"]["Insert"]>;
        Relationships: [];
      };
      connection_inquiries: {
        Row: {
          id: string;
          listing_id: string;
          inquirer_user_id: string;
          inquirer_workspace_id: string;
          status: "sent" | "accepted" | "declined" | "closed";
          message: string | null;
          data_room_link_id: string | null;
          sent_at: string;
          responded_at: string | null;
          closed_at: string | null;
          closed_by_user_id: string | null;
          closed_reason: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          listing_id: string;
          inquirer_user_id: string;
          inquirer_workspace_id: string;
          status?: "sent" | "accepted" | "declined" | "closed";
          message?: string | null;
          data_room_link_id?: string | null;
          sent_at?: string;
          responded_at?: string | null;
          closed_at?: string | null;
          closed_by_user_id?: string | null;
          closed_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["connection_inquiries"]["Insert"]>;
        Relationships: [];
      };
      account_notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "inquiry_received"
            | "inquiry_accepted"
            | "inquiry_declined"
            | "rofr_notified"
            | "investor_update_opened"
            | "compliance_overdue"
            | "round_visibility_changed";
          title: string;
          url: string;
          is_read: boolean;
          entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "inquiry_received"
            | "inquiry_accepted"
            | "inquiry_declined"
            | "rofr_notified"
            | "investor_update_opened"
            | "compliance_overdue"
            | "round_visibility_changed";
          title: string;
          url: string;
          is_read?: boolean;
          entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "inquiry_received"
            | "inquiry_accepted"
            | "inquiry_declined"
            | "rofr_notified"
            | "investor_update_opened"
            | "compliance_overdue"
            | "round_visibility_changed";
          title?: string;
          url?: string;
          is_read?: boolean;
          entity_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_data_room: {
        Args: { p_token: string };
        Returns: {
          workspace_name: string;
          round_name: string | null;
          round_status: string | null;
          access_tier: string;
          doc_id: string | null;
          doc_name: string | null;
          doc_mime_type: string | null;
          doc_size_bytes: number | null;
          doc_created_at: string | null;
          doc_tier: string | null;
        }[];
      };
      record_data_room_view: {
        Args: { p_token: string; p_user_agent?: string | null };
        Returns: void;
      };
      record_investor_update_view: {
        Args: { p_token: string; p_user_agent?: string | null; p_email?: string | null };
        Returns: void;
      };
      create_share_listing: {
        Args: {
          p_workspace_id: string;
          p_shareholder_id: string;
          p_shares_offered: number | string;
          p_ask_price_sar: number | string;
          p_notes: string | null;
          p_expires_at: string | null;
          p_rofr_window: string;
        };
        Returns: string;
      };
      withdraw_share_listing: {
        Args: { p_listing_id: string; p_reason: string | null };
        Returns: void;
      };
      mark_share_listing_sold_off_platform: {
        Args: {
          p_listing_id: string;
          p_buyer_name?: string | null;
          p_buyer_email?: string | null;
          p_sale_price_sar?: string | number | null;
        };
        Returns: {
          success: boolean;
          listing_id: string;
          cap_table_updated: boolean;
          new_shareholder_id: string | null;
        };
      };
      record_rofr_response: {
        Args: { p_notification_id: string; p_response: "exercise" | "decline" };
        Returns: void;
      };
      create_connection_listing: {
        Args: {
          p_workspace_id: string;
          p_listing_type: "exit" | "partnership";
          p_public_summary: string;
          p_type_data: Json;
          p_notes: string | null;
        };
        Returns: string;
      };
      withdraw_connection_listing: {
        Args: { p_listing_id: string; p_reason: string | null };
        Returns: void;
      };
      send_connection_inquiry: {
        Args: {
          p_listing_id: string;
          p_inquirer_workspace_id: string;
          p_message: string | null;
        };
        Returns: string;
      };
      accept_connection_inquiry: {
        Args: {
          p_inquiry_id: string;
          p_data_room_round_id: string | null;
          p_access_tier: "intro" | "standard" | "diligence";
          p_token_ttl_days: number;
        };
        Returns: {
          inquiry_id: string;
          data_room_token: string;
          data_room_link_id: string;
        }[];
      };
      decline_connection_inquiry: {
        Args: { p_inquiry_id: string; p_reason: string | null };
        Returns: void;
      };
      close_connection_inquiry: {
        Args: { p_inquiry_id: string; p_reason: string | null };
        Returns: void;
      };
      get_connection_inquiry_emails: {
        Args: { p_inquiry_id: string };
        Returns: {
          owner_user_id: string;
          owner_email: string;
          inquirer_user_id: string;
          inquirer_email: string;
          owner_workspace_name: string;
          inquirer_workspace_name: string;
          listing_type: string;
        }[];
      };
      get_connection_listing_owner_contact: {
        Args: { p_listing_id: string };
        Returns: {
          owner_user_id: string;
          owner_email: string;
          owner_workspace_name: string;
          listing_type: string;
        }[];
      };
      close_financing_round: {
        Args: {
          p_round_id: string;
          p_pre_money_valuation_sar: string | number;
          p_fd_shares_pre_round: string | number;
          p_actual_raise_sar: string | number | null;
          p_close_date: string;
          p_promotions: Json;
          p_conversions: Json;
        };
        Returns: {
          success: boolean;
          round_id: string;
          promoted_count: number;
          converted_count: number;
        };
      };
      search_platform: {
        Args: { p_query: string };
        Returns: Json;
      };
      compute_acquisition_model: {
        Args: {
          p_workspace_id: string;
          p_acquisition_price_sar: number;
          p_debt_sar?: number;
          p_label?: string;
          p_connection_listing_id?: string | null;
        };
        Returns: {
          model_id: string;
          label: string;
          acquisition_price_sar: number;
          net_proceeds_sar: number;
          results: {
            shareholder_id: string;
            shareholder_name: string;
            shares: number;
            payout_sar: number;
            multiple_x: number | null;
          }[];
        };
      };
      archive_acquisition_model: {
        Args: { p_model_id: string };
        Returns: void;
      };
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
      document_visibility: "internal" | "data_room" | "public";
      data_room_tier: "intro" | "standard" | "diligence";
      term_sheet_status: "draft" | "sent" | "signed" | "declined" | "withdrawn";
      closing_item_category: "kyc_aml" | "subscription_agreement" | "wire_confirmation" | "share_certificate" | "board_approval" | "other";
      closing_item_status: "pending" | "in_progress" | "complete" | "waived";
      meeting_format: "virtual" | "in_person";
      meeting_status: "upcoming" | "completed" | "cancelled";
      resolution_status: "draft" | "pending" | "passed" | "rejected";
      resolution_template:
        | "new_share_issuance"
        | "round_approval"
        | "director_appointment"
        | "esop_grant"
        | "esop_pool_expansion"
        | "rofr_waiver"
        | "transfer_restriction"
        | "custom";
      valuation_methodology: "revenue_multiple" | "scorecard" | "berkus" | "dcf";
      workspace_role: "owner" | "admin" | "viewer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Convenience alias for consumers (notification bell, API route, etc.)
export type AccountNotification =
  Database["public"]["Tables"]["account_notifications"]["Row"];

// ── Search ─────────────────────────────────────────────────────────────────
export interface SearchResult {
  entity_type: "workspace" | "connection_listing" | "financing_round";
  entity_id: string;
  title: string;
  subtitle: string | null;
  url: string;
  rank: number;
}

// ── Convenience aliases ───────────────────────────────────────────────────────
export type InvestorUpdateRecipient =
  Database["public"]["Tables"]["investor_update_recipients"]["Row"];

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
