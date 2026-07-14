// Generated from live Supabase schema (project: yykbyoswrblpeedjazpx).
// Regenerate with the Supabase MCP `generate_typescript_types` tool (or `supabase gen types
// typescript --project-id yykbyoswrblpeedjazpx`) whenever the schema changes. Do not hand-edit.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      approval_assignments: {
        Row: {
          approval_id: string
          created_at: string | null
          id: string
          level: number
          status: string
          user_id: string
        }
        Insert: {
          approval_id: string
          created_at?: string | null
          id?: string
          level: number
          status?: string
          user_id: string
        }
        Update: {
          approval_id?: string
          created_at?: string | null
          id?: string
          level?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_assignments_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_comments: {
        Row: {
          approval_id: string
          comment: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          approval_id: string
          comment: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          approval_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_comments_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approval_type: string
          company_id: string
          created_at: string | null
          created_by: string
          current_level: number | null
          entity_id: string | null
          entity_type: string | null
          id: string
          reason: string | null
          reference_id: string
          requester_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          task_id: string | null
          total_levels: number
        }
        Insert: {
          approval_type: string
          company_id: string
          created_at?: string | null
          created_by: string
          current_level?: number | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          reason?: string | null
          reference_id: string
          requester_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          task_id?: string | null
          total_levels: number
        }
        Update: {
          approval_type?: string
          company_id?: string
          created_at?: string | null
          created_by?: string
          current_level?: number | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          reason?: string | null
          reference_id?: string
          requester_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          task_id?: string | null
          total_levels?: number
        }
        Relationships: [
          {
            foreignKeyName: "approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          file_name: string
          file_size_bytes: number
          id: string
          is_deleted: boolean | null
          mime_type: string
          reference_id: string
          storage_path: string
          task_id: string | null
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          file_name: string
          file_size_bytes: number
          id?: string
          is_deleted?: boolean | null
          mime_type: string
          reference_id: string
          storage_path: string
          task_id?: string | null
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          is_deleted?: boolean | null
          mime_type?: string
          reference_id?: string
          storage_path?: string
          task_id?: string | null
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_id: string
          changes: Json | null
          company_id: string
          created_at: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
        }
        Insert: {
          actor_id: string
          changes?: Json | null
          company_id: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
        }
        Update: {
          actor_id?: string
          changes?: Json | null
          company_id?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_name: string
          created_at: string | null
          created_by: string
          employee_count: number | null
          headquarters_location: string | null
          id: string
          industry: string | null
          reference_id: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          created_by: string
          employee_count?: number | null
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          reference_id: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          created_by?: string
          employee_count?: number | null
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          reference_id?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: []
      }
      form_submission_attachments: {
        Row: {
          created_at: string | null
          field_id: string
          file_name: string
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          storage_path: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          field_id: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          field_id?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_attachments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_values: {
        Row: {
          created_at: string | null
          field_id: string
          field_value: Json | null
          id: string
          submission_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          field_value?: Json | null
          id?: string
          submission_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          field_value?: Json | null
          id?: string
          submission_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submission_values_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          company_id: string
          created_at: string | null
          form_id: string
          id: string
          is_draft: boolean | null
          reference_id: string
          status: string
          submitted_at: string | null
          submitter_id: string
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          form_id: string
          id?: string
          is_draft?: boolean | null
          reference_id: string
          status?: string
          submitted_at?: string | null
          submitter_id: string
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          form_id?: string
          id?: string
          is_draft?: boolean | null
          reference_id?: string
          status?: string
          submitted_at?: string | null
          submitter_id?: string
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          definition: Json
          description: string | null
          id: string
          name: string
          previous_version_id: string | null
          published_at: string | null
          published_by: string | null
          reference_id: string
          status: string
          updated_at: string | null
          updated_by: string
          version: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          definition: Json
          description?: string | null
          id?: string
          name: string
          previous_version_id?: string | null
          published_at?: string | null
          published_by?: string | null
          reference_id: string
          status?: string
          updated_at?: string | null
          updated_by: string
          version?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          definition?: Json
          description?: string | null
          id?: string
          name?: string
          previous_version_id?: string | null
          published_at?: string | null
          published_by?: string | null
          reference_id?: string
          status?: string
          updated_at?: string | null
          updated_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mhd_reference_sequences: {
        Row: {
          current_value: number
          prefix: string
          updated_at: string
        }
        Insert: {
          current_value?: number
          prefix: string
          updated_at?: string
        }
        Update: {
          current_value?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          note_plain_text: string
          note_rich_text: Json
          reference_id: string
          visibility: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          note_plain_text: string
          note_rich_text: Json
          reference_id: string
          visibility: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note_plain_text?: string
          note_rich_text?: Json
          reference_id?: string
          visibility?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          display_name: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          reference_id: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          display_name?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          reference_id: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          display_name?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          reference_id?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      priorities: {
        Row: {
          color_token: string | null
          created_at: string | null
          display_order: number | null
          id: string
          priority_name: string
        }
        Insert: {
          color_token?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          priority_name: string
        }
        Update: {
          color_token?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          priority_name?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          role_name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          role_name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          role_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          category: string
          color_token: string | null
          created_at: string | null
          display_order: number | null
          id: string
          status_name: string
        }
        Insert: {
          category: string
          color_token?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          status_name: string
        }
        Update: {
          category?: string
          color_token?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          status_name?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          created_by: string
          id: string
          reference_id: string
          task_id: string
          title: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          created_by: string
          id?: string
          reference_id: string
          task_id: string
          title: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          created_by?: string
          id?: string
          reference_id?: string
          task_id?: string
          title?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          assignment_type: string
          created_at: string | null
          created_by: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assignment_type: string
          created_at?: string | null
          created_by: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assignment_type?: string
          created_at?: string | null
          created_by?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          company_id: string
          completed_date: string | null
          created_at: string | null
          created_by: string
          description_plain_text: string | null
          due_date: string | null
          id: string
          manual_progress_percent: number | null
          priority_id: string | null
          reference_id: string
          start_date: string | null
          status_id: string
          title: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          company_id: string
          completed_date?: string | null
          created_at?: string | null
          created_by: string
          description_plain_text?: string | null
          due_date?: string | null
          id?: string
          manual_progress_percent?: number | null
          priority_id?: string | null
          reference_id: string
          start_date?: string | null
          status_id: string
          title: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          company_id?: string
          completed_date?: string | null
          created_at?: string | null
          created_by?: string
          description_plain_text?: string | null
          due_date?: string | null
          id?: string
          manual_progress_percent?: number | null
          priority_id?: string | null
          reference_id?: string
          start_date?: string | null
          status_id?: string
          title?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          person_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          person_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          person_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_transitions: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          from_status_id: string | null
          id: string
          reason: string | null
          task_id: string
          to_status_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          from_status_id?: string | null
          id?: string
          reason?: string | null
          task_id: string
          to_status_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          from_status_id?: string | null
          id?: string
          reason?: string | null
          task_id?: string
          to_status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_transitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_from_status_id_fkey"
            columns: ["from_status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_transitions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mhd_can_access_company: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      mhd_current_user_id: { Args: never; Returns: string }
      mhd_current_user_roles: { Args: never; Returns: string[] }
      mhd_next_reference_id: { Args: { p_prefix: string }; Returns: string }
      mhd_user_has_role: { Args: { p_role_name: string }; Returns: boolean }
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
    // @ts-expect-error — Supabase codegen quirk: DefaultSchema["CompositeTypes"] is `{}` for a
    // schema with no composite types, which TS can't index generically. Regenerate this file via
    // generate_typescript_types once real migrations are reapplied; this line should then be
    // reachable code again and the suppression will self-flag as unnecessary.
    ? DefaultSchema["CompositeTypes"][CompositeTypeName]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
