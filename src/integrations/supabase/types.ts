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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bidders: {
        Row: {
          bid_amount: number | null
          company_name: string
          contact_name: string | null
          created_at: string
          disqualified: boolean
          disqualify_reason: string | null
          id: string
          is_winner: boolean
          organization_id: string
          phone: string | null
          project_id: string
          submitted_at: string | null
          tax_id: string | null
        }
        Insert: {
          bid_amount?: number | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          disqualified?: boolean
          disqualify_reason?: string | null
          id?: string
          is_winner?: boolean
          organization_id: string
          phone?: string | null
          project_id: string
          submitted_at?: string | null
          tax_id?: string | null
        }
        Update: {
          bid_amount?: number | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          disqualified?: boolean
          disqualify_reason?: string | null
          id?: string
          is_winner?: boolean
          organization_id?: string
          phone?: string | null
          project_id?: string
          submitted_at?: string | null
          tax_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bidders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bidders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          appointment_date: string | null
          committee_type: string
          created_at: string
          id: string
          member_name: string
          organization_id: string
          position: string
          project_id: string
        }
        Insert: {
          appointment_date?: string | null
          committee_type: string
          created_at?: string
          id?: string
          member_name: string
          organization_id: string
          position: string
          project_id: string
        }
        Update: {
          appointment_date?: string | null
          committee_type?: string
          created_at?: string
          id?: string
          member_name?: string
          organization_id?: string
          position?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "committees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_reports: {
        Row: {
          contract_id: string | null
          id: string
          next_plan: string | null
          organization_id: string
          problems: string | null
          progress_actual: number | null
          progress_diff: number | null
          progress_plan: number | null
          project_id: string
          report_date: string
          report_type: string
          solutions: string | null
          submitted_at: string
          submitted_by: string | null
          weather_impact: boolean | null
          week_number: number | null
          work_done: string | null
        }
        Insert: {
          contract_id?: string | null
          id?: string
          next_plan?: string | null
          organization_id: string
          problems?: string | null
          progress_actual?: number | null
          progress_diff?: number | null
          progress_plan?: number | null
          project_id: string
          report_date: string
          report_type?: string
          solutions?: string | null
          submitted_at?: string
          submitted_by?: string | null
          weather_impact?: boolean | null
          week_number?: number | null
          work_done?: string | null
        }
        Update: {
          contract_id?: string | null
          id?: string
          next_plan?: string | null
          organization_id?: string
          problems?: string | null
          progress_actual?: number | null
          progress_diff?: number | null
          progress_plan?: number | null
          project_id?: string
          report_date?: string
          report_type?: string
          solutions?: string | null
          submitted_at?: string
          submitted_by?: string | null
          weather_impact?: boolean | null
          week_number?: number | null
          work_done?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "construction_reports_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          announcement_date: string | null
          contract_amount: number
          contract_number: string
          contractor_name: string
          contractor_tax_id: string | null
          created_at: string
          duration_days: number | null
          end_date: string
          guarantee_amount: number | null
          guarantee_returned_at: string | null
          guarantee_type: string | null
          id: string
          organization_id: string
          project_id: string
          result_accumulated: string | null
          signed_at: string | null
          start_date: string
          status: string
          winner_date: string | null
        }
        Insert: {
          announcement_date?: string | null
          contract_amount: number
          contract_number: string
          contractor_name: string
          contractor_tax_id?: string | null
          created_at?: string
          duration_days?: number | null
          end_date: string
          guarantee_amount?: number | null
          guarantee_returned_at?: string | null
          guarantee_type?: string | null
          id?: string
          organization_id: string
          project_id: string
          result_accumulated?: string | null
          signed_at?: string | null
          start_date: string
          status?: string
          winner_date?: string | null
        }
        Update: {
          announcement_date?: string | null
          contract_amount?: number
          contract_number?: string
          contractor_name?: string
          contractor_tax_id?: string | null
          created_at?: string
          duration_days?: number | null
          end_date?: string
          guarantee_amount?: number | null
          guarantee_returned_at?: string | null
          guarantee_type?: string | null
          id?: string
          organization_id?: string
          project_id?: string
          result_accumulated?: string | null
          signed_at?: string | null
          start_date?: string
          status?: string
          winner_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          document_type: string
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          note: string | null
          organization_id: string
          project_id: string
          step_number: number | null
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_type: string
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          note?: string | null
          organization_id: string
          project_id: string
          step_number?: number | null
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_type?: string
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          note?: string | null
          organization_id?: string
          project_id?: string
          step_number?: number | null
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          amount_due: number | null
          approved_at: string | null
          approved_by: string | null
          contract_id: string | null
          created_at: string
          id: string
          inspection_date: string
          inspector_note: string | null
          installment_no: number
          organization_id: string
          paid_at: string | null
          progress_pct: number | null
          project_id: string
          status: string
        }
        Insert: {
          amount_due?: number | null
          approved_at?: string | null
          approved_by?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          inspection_date: string
          inspector_note?: string | null
          installment_no: number
          organization_id: string
          paid_at?: string | null
          progress_pct?: number | null
          project_id: string
          status?: string
        }
        Update: {
          amount_due?: number | null
          approved_at?: string | null
          approved_by?: string | null
          contract_id?: string | null
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_note?: string | null
          installment_no?: number
          organization_id?: string
          paid_at?: string | null
          progress_pct?: number | null
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          code: string
          created_at: string
          department_type: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          notify_contract: boolean
          notify_inspection: boolean
          notify_report: boolean
          plan: string
          plan_expires_at: string | null
          province: string | null
          storage_used_bytes: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          department_type?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          notify_contract?: boolean
          notify_inspection?: boolean
          notify_report?: boolean
          plan?: string
          plan_expires_at?: string | null
          province?: string | null
          storage_used_bytes?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          department_type?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          notify_contract?: boolean
          notify_inspection?: boolean
          notify_report?: boolean
          plan?: string
          plan_expires_at?: string | null
          province?: string | null
          storage_used_bytes?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      procurement_steps: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string | null
          id: string
          note: string | null
          organization_id: string
          project_id: string
          responsible_officer_name: string | null
          status: string
          step_name: string
          step_notes: string | null
          step_number: number
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          organization_id: string
          project_id: string
          responsible_officer_name?: string | null
          status?: string
          step_name: string
          step_notes?: string | null
          step_number: number
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          organization_id?: string
          project_id?: string
          responsible_officer_name?: string | null
          status?: string
          step_name?: string
          step_notes?: string | null
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "procurement_steps_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          organization_id: string
          position: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          organization_id: string
          position?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          position?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          approving_agency: string | null
          budget: number
          committee_review_workdays: number | null
          created_at: string
          created_by: string | null
          current_step: number
          description: string | null
          design_code: string | null
          district_office: string | null
          estimated_price: number | null
          fiscal_year: number
          id: string
          method: string
          name: string
          organization_id: string
          procurement_agency: string | null
          procurement_request_approval_date: string | null
          procurement_request_letter_no: string | null
          project_code: string
          result_unit: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approving_agency?: string | null
          budget: number
          committee_review_workdays?: number | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          description?: string | null
          design_code?: string | null
          district_office?: string | null
          estimated_price?: number | null
          fiscal_year: number
          id?: string
          method?: string
          name: string
          organization_id: string
          procurement_agency?: string | null
          procurement_request_approval_date?: string | null
          procurement_request_letter_no?: string | null
          project_code: string
          result_unit?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approving_agency?: string | null
          budget?: number
          committee_review_workdays?: number | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          description?: string | null
          design_code?: string | null
          district_office?: string | null
          estimated_price?: number | null
          fiscal_year?: number
          id?: string
          method?: string
          name?: string
          organization_id?: string
          procurement_agency?: string | null
          procurement_request_approval_date?: string | null
          procurement_request_letter_no?: string | null
          project_code?: string
          result_unit?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      report_photos: {
        Row: {
          caption: string | null
          id: string
          organization_id: string
          report_id: string
          storage_path: string
          taken_at: string | null
          uploaded_at: string
        }
        Insert: {
          caption?: string | null
          id?: string
          organization_id: string
          report_id: string
          storage_path: string
          taken_at?: string | null
          uploaded_at?: string
        }
        Update: {
          caption?: string | null
          id?: string
          organization_id?: string
          report_id?: string
          storage_path?: string
          taken_at?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_photos_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "construction_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      tor_documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          duration_days: number | null
          id: string
          organization_id: string
          price_ceiling: number | null
          project_id: string
          scope_of_work: string | null
          specifications: string | null
          version: number
          warranty_days: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          duration_days?: number | null
          id?: string
          organization_id: string
          price_ceiling?: number | null
          project_id: string
          scope_of_work?: string | null
          specifications?: string | null
          version?: number
          warranty_days?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          duration_days?: number | null
          id?: string
          organization_id?: string
          price_ceiling?: number | null
          project_id?: string
          scope_of_work?: string | null
          specifications?: string | null
          version?: number
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tor_documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tor_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tor_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_storage_usage: { Args: { delta: number }; Returns: undefined }
      get_my_org_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
