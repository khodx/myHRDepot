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
      accommodation_cases: {
        Row: {
          closed_at: string | null
          closure_reason: string | null
          company_id: string
          created_at: string
          created_by: string
          essential_functions_snapshot: Json
          id: string
          job_description_id: string | null
          leave_case_id: string | null
          opened_by: string
          owner_user_id: string | null
          person_id: string
          recruiting_application_id: string | null
          reference_id: string
          request_channel: string
          request_source: string
          request_summary: string
          requested_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          closure_reason?: string | null
          company_id: string
          created_at?: string
          created_by: string
          essential_functions_snapshot?: Json
          id?: string
          job_description_id?: string | null
          leave_case_id?: string | null
          opened_by: string
          owner_user_id?: string | null
          person_id: string
          recruiting_application_id?: string | null
          reference_id: string
          request_channel: string
          request_source: string
          request_summary: string
          requested_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          closure_reason?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          essential_functions_snapshot?: Json
          id?: string
          job_description_id?: string | null
          leave_case_id?: string | null
          opened_by?: string
          owner_user_id?: string | null
          person_id?: string
          recruiting_application_id?: string | null
          reference_id?: string
          request_channel?: string
          request_source?: string
          request_summary?: string
          requested_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_cases_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_cases_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_cases_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_cases_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_cases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_cases_recruiting_application_id_fkey"
            columns: ["recruiting_application_id"]
            isOneToOne: false
            referencedRelation: "recruiting_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_decisions: {
        Row: {
          alternatives_considered: boolean
          case_id: string
          company_id: string
          decided_at: string
          decided_by: string
          decision_summary: string
          denial_reason_code: string | null
          id: string
          individualized_analysis: Json
          interactive_process_continues: boolean
          outcome: string
          selected_option_id: string | null
          superseded_at: string | null
          superseded_by: string | null
        }
        Insert: {
          alternatives_considered?: boolean
          case_id: string
          company_id: string
          decided_at?: string
          decided_by: string
          decision_summary: string
          denial_reason_code?: string | null
          id?: string
          individualized_analysis?: Json
          interactive_process_continues?: boolean
          outcome: string
          selected_option_id?: string | null
          superseded_at?: string | null
          superseded_by?: string | null
        }
        Update: {
          alternatives_considered?: boolean
          case_id?: string
          company_id?: string
          decided_at?: string
          decided_by?: string
          decision_summary?: string
          denial_reason_code?: string | null
          id?: string
          individualized_analysis?: Json
          interactive_process_continues?: boolean
          outcome?: string
          selected_option_id?: string | null
          superseded_at?: string | null
          superseded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_decisions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "accommodation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_decisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_decisions_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "accommodation_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_decisions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_implementations: {
        Row: {
          actual_cost: number | null
          case_id: string
          company_id: string
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          manager_instruction: string
          option_id: string
          review_due_date: string | null
          start_date: string
          status: string
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          actual_cost?: number | null
          case_id: string
          company_id: string
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          manager_instruction: string
          option_id: string
          review_due_date?: string | null
          start_date: string
          status?: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          actual_cost?: number | null
          case_id?: string
          company_id?: string
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          manager_instruction?: string
          option_id?: string
          review_due_date?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_implementations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "accommodation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_implementations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_implementations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_implementations_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "accommodation_options"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_interactions: {
        Row: {
          case_id: string
          channel: string
          company_id: string
          created_at: string
          created_by: string
          employee_visible: boolean
          id: string
          next_step: string | null
          next_step_due: string | null
          occurred_at: string
          participants: Json
          summary: string
        }
        Insert: {
          case_id: string
          channel: string
          company_id: string
          created_at?: string
          created_by: string
          employee_visible?: boolean
          id?: string
          next_step?: string | null
          next_step_due?: string | null
          occurred_at: string
          participants?: Json
          summary: string
        }
        Update: {
          case_id?: string
          channel?: string
          company_id?: string
          created_at?: string
          created_by?: string
          employee_visible?: boolean
          id?: string
          next_step?: string | null
          next_step_due?: string | null
          occurred_at?: string
          participants?: Json
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_interactions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "accommodation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_medical_documentation: {
        Row: {
          accommodation_need_ciphertext: string | null
          attachment_id: string | null
          case_id: string
          company_id: string
          created_at: string
          created_by: string
          documentation_requested: boolean
          documentation_type: string
          due_date: string | null
          functional_limitation_ciphertext: string | null
          id: string
          need_is_obvious: boolean
          received_at: string | null
          requested_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          accommodation_need_ciphertext?: string | null
          attachment_id?: string | null
          case_id: string
          company_id: string
          created_at?: string
          created_by: string
          documentation_requested?: boolean
          documentation_type: string
          due_date?: string | null
          functional_limitation_ciphertext?: string | null
          id?: string
          need_is_obvious?: boolean
          received_at?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          accommodation_need_ciphertext?: string | null
          attachment_id?: string | null
          case_id?: string
          company_id?: string
          created_at?: string
          created_by?: string
          documentation_requested?: boolean
          documentation_type?: string
          due_date?: string | null
          functional_limitation_ciphertext?: string | null
          id?: string
          need_is_obvious?: boolean
          received_at?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_medical_documentation_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_medical_documentation_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "accommodation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_medical_documentation_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_medical_documentation_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_options: {
        Row: {
          case_id: string
          company_id: string
          created_at: string
          created_by: string
          description: string
          disposition: string
          disposition_reason: string | null
          employee_preference: boolean
          essential_function_ids: string[]
          estimated_cost: number | null
          expected_effectiveness: string
          id: string
          operational_factors: Json
          option_type: string
          removes_essential_function: boolean
          updated_at: string | null
        }
        Insert: {
          case_id: string
          company_id: string
          created_at?: string
          created_by: string
          description: string
          disposition?: string
          disposition_reason?: string | null
          employee_preference?: boolean
          essential_function_ids?: string[]
          estimated_cost?: number | null
          expected_effectiveness: string
          id?: string
          operational_factors?: Json
          option_type: string
          removes_essential_function?: boolean
          updated_at?: string | null
        }
        Update: {
          case_id?: string
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string
          disposition?: string
          disposition_reason?: string | null
          employee_preference?: boolean
          essential_function_ids?: string[]
          estimated_cost?: number | null
          expected_effectiveness?: string
          id?: string
          operational_factors?: Json
          option_type?: string
          removes_essential_function?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_options_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "accommodation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_options_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_options_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_reviews: {
        Row: {
          case_id: string
          company_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          due_date: string
          effectiveness: string | null
          id: string
          implementation_id: string | null
          reengage_required: boolean
          summary: string | null
        }
        Insert: {
          case_id: string
          company_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by: string
          due_date: string
          effectiveness?: string | null
          id?: string
          implementation_id?: string | null
          reengage_required?: boolean
          summary?: string | null
        }
        Update: {
          case_id?: string
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          due_date?: string
          effectiveness?: string | null
          id?: string
          implementation_id?: string | null
          reengage_required?: boolean
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "accommodation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_reviews_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_reviews_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "accommodation_implementations"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: string
          company_id: string
          created_at: string | null
          created_by: string
          description_plain_text: string | null
          description_rich_text: Json | null
          duration_minutes: number | null
          follow_up_task_id: string | null
          id: string
          is_confidential: boolean
          location: string | null
          occurred_at: string | null
          outcome_summary: string | null
          parent_task_id: string | null
          person_id: string | null
          reference_id: string
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          activity_type: string
          company_id: string
          created_at?: string | null
          created_by: string
          description_plain_text?: string | null
          description_rich_text?: Json | null
          duration_minutes?: number | null
          follow_up_task_id?: string | null
          id?: string
          is_confidential?: boolean
          location?: string | null
          occurred_at?: string | null
          outcome_summary?: string | null
          parent_task_id?: string | null
          person_id?: string | null
          reference_id: string
          scheduled_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          activity_type?: string
          company_id?: string
          created_at?: string | null
          created_by?: string
          description_plain_text?: string | null
          description_rich_text?: Json | null
          duration_minutes?: number | null
          follow_up_task_id?: string | null
          id?: string
          is_confidential?: boolean
          location?: string | null
          occurred_at?: string | null
          outcome_summary?: string | null
          parent_task_id?: string | null
          person_id?: string | null
          reference_id?: string
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_follow_up_task_id_fkey"
            columns: ["follow_up_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_participants: {
        Row: {
          activity_id: string
          created_at: string | null
          created_by: string
          id: string
          participant_role: string
          person_id: string | null
          reference_id: string
          user_id: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          created_by: string
          id?: string
          participant_role: string
          person_id?: string | null
          reference_id: string
          user_id?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          participant_role?: string
          person_id?: string | null
          reference_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_assignments: {
        Row: {
          approval_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          level: number
          rejection_reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          approval_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          level: number
          rejection_reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approval_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          level?: number
          rejection_reason?: string | null
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
            foreignKeyName: "approval_assignments_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
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
          created_at: string
          id: string
          is_internal: boolean
          user_id: string
        }
        Insert: {
          approval_id: string
          comment: string
          created_at?: string
          id?: string
          is_internal?: boolean
          user_id: string
        }
        Update: {
          approval_id?: string
          comment?: string
          created_at?: string
          id?: string
          is_internal?: boolean
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
          created_at: string
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
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approval_type: string
          company_id: string
          created_at?: string
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
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approval_type?: string
          company_id?: string
          created_at?: string
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
          updated_at?: string
          updated_by?: string | null
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
          {
            foreignKeyName: "approvals_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description_plain_text: string
          description_rich_text: Json
          drive_file_id: string
          drive_folder_id: string
          drive_web_content_link: string | null
          drive_web_view_link: string | null
          entity_id: string
          entity_type: string
          file_extension: string | null
          file_size_bytes: number
          id: string
          is_current_version: boolean | null
          is_deleted: boolean | null
          legal_hold: boolean
          mime_type: string
          original_file_name: string
          reference_id: string
          retention_until: string | null
          sensitivity_level: string
          storage_provider: string
          stored_file_name: string | null
          subject_person_id: string | null
          updated_at: string
          updated_by: string
          uploaded_at: string
          uploaded_by: string
          version_number: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description_plain_text: string
          description_rich_text: Json
          drive_file_id: string
          drive_folder_id: string
          drive_web_content_link?: string | null
          drive_web_view_link?: string | null
          entity_id: string
          entity_type: string
          file_extension?: string | null
          file_size_bytes: number
          id?: string
          is_current_version?: boolean | null
          is_deleted?: boolean | null
          legal_hold?: boolean
          mime_type: string
          original_file_name: string
          reference_id: string
          retention_until?: string | null
          sensitivity_level?: string
          storage_provider?: string
          stored_file_name?: string | null
          subject_person_id?: string | null
          updated_at?: string
          updated_by: string
          uploaded_at?: string
          uploaded_by: string
          version_number?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description_plain_text?: string
          description_rich_text?: Json
          drive_file_id?: string
          drive_folder_id?: string
          drive_web_content_link?: string | null
          drive_web_view_link?: string | null
          entity_id?: string
          entity_type?: string
          file_extension?: string | null
          file_size_bytes?: number
          id?: string
          is_current_version?: boolean | null
          is_deleted?: boolean | null
          legal_hold?: boolean
          mime_type?: string
          original_file_name?: string
          reference_id?: string
          retention_until?: string | null
          sensitivity_level?: string
          storage_provider?: string
          stored_file_name?: string | null
          subject_person_id?: string | null
          updated_at?: string
          updated_by?: string
          uploaded_at?: string
          uploaded_by?: string
          version_number?: number | null
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
            foreignKeyName: "attachments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_occurrences: {
        Row: {
          classification: string
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          minutes_variance: number | null
          occurrence_date: string
          occurrence_type: string
          person_id: string
          protected_leave_category: string | null
          reason_note: string | null
          recorded_at: string
          recorded_by: string
          reference_id: string
          scheduled_shift_id: string | null
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          classification: string
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          minutes_variance?: number | null
          occurrence_date: string
          occurrence_type: string
          person_id: string
          protected_leave_category?: string | null
          reason_note?: string | null
          recorded_at?: string
          recorded_by: string
          reference_id: string
          scheduled_shift_id?: string | null
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          classification?: string
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          minutes_variance?: number | null
          occurrence_date?: string
          occurrence_type?: string
          person_id?: string
          protected_leave_category?: string | null
          reason_note?: string | null
          recorded_at?: string
          recorded_by?: string
          reference_id?: string
          scheduled_shift_id?: string | null
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_occurrences_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_occurrences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_occurrences_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_occurrences_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_occurrences_scheduled_shift_id_fkey"
            columns: ["scheduled_shift_id"]
            isOneToOne: false
            referencedRelation: "scheduled_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_point_ledger: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          effective_date: string
          entry_type: string
          expires_on: string | null
          id: string
          occurrence_id: string | null
          person_id: string
          points_delta: number
          policy_id: string | null
          reason: string | null
          reversal_of_entry_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          effective_date: string
          entry_type: string
          expires_on?: string | null
          id?: string
          occurrence_id?: string | null
          person_id: string
          points_delta: number
          policy_id?: string | null
          reason?: string | null
          reversal_of_entry_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          effective_date?: string
          entry_type?: string
          expires_on?: string | null
          id?: string
          occurrence_id?: string | null
          person_id?: string
          points_delta?: number
          policy_id?: string | null
          reason?: string | null
          reversal_of_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_point_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_point_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_point_ledger_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "attendance_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_point_ledger_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_point_ledger_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "attendance_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_point_ledger_reversal_of_entry_id_fkey"
            columns: ["reversal_of_entry_id"]
            isOneToOne: false
            referencedRelation: "attendance_point_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_policies: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          effective_from: string
          effective_to: string | null
          excused_paid_accrues: boolean
          excused_unpaid_accrues: boolean
          id: string
          policy_name: string
          roll_off_months: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          effective_from: string
          effective_to?: string | null
          excused_paid_accrues?: boolean
          excused_unpaid_accrues?: boolean
          id?: string
          policy_name: string
          roll_off_months?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          effective_from?: string
          effective_to?: string | null
          excused_paid_accrues?: boolean
          excused_unpaid_accrues?: boolean
          id?: string
          policy_name?: string
          roll_off_months?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_policy_point_rules: {
        Row: {
          id: string
          occurrence_type: string
          points: number
          policy_id: string
        }
        Insert: {
          id?: string
          occurrence_type: string
          points: number
          policy_id: string
        }
        Update: {
          id?: string
          occurrence_type?: string
          points?: number
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_policy_point_rules_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "attendance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_policy_thresholds: {
        Row: {
          action_level: string
          id: string
          points_at: number
          policy_id: string
        }
        Insert: {
          action_level: string
          id?: string
          points_at: number
          policy_id: string
        }
        Update: {
          action_level?: string
          id?: string
          points_at?: number
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_policy_thresholds_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "attendance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_reassessment_events: {
        Row: {
          company_id: string
          created_at: string | null
          decision_note: string | null
          from_classification: string
          id: string
          ledger_entry_id: string | null
          occurrence_id: string
          person_id: string
          points_assessed: number | null
          raised_at: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          to_classification: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          decision_note?: string | null
          from_classification: string
          id?: string
          ledger_entry_id?: string | null
          occurrence_id: string
          person_id: string
          points_assessed?: number | null
          raised_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          to_classification: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          decision_note?: string | null
          from_classification?: string
          id?: string
          ledger_entry_id?: string | null
          occurrence_id?: string
          person_id?: string
          points_assessed?: number | null
          raised_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          to_classification?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_reassessment_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_reassessment_events_ledger_entry_id_fkey"
            columns: ["ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "attendance_point_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_reassessment_events_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "attendance_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_reassessment_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_reassessment_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_threshold_events: {
        Row: {
          company_id: string
          created_at: string | null
          crossed_at: string
          id: string
          linked_conduct_case_id: string | null
          linked_task_id: string | null
          person_id: string
          points_at_crossing: number
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          threshold_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          crossed_at?: string
          id?: string
          linked_conduct_case_id?: string | null
          linked_task_id?: string | null
          person_id: string
          points_at_crossing: number
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          threshold_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          crossed_at?: string
          id?: string
          linked_conduct_case_id?: string | null
          linked_task_id?: string | null
          person_id?: string
          points_at_crossing?: number
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          threshold_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_threshold_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_threshold_events_conduct_fk"
            columns: ["linked_conduct_case_id"]
            isOneToOne: false
            referencedRelation: "conduct_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_threshold_events_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_threshold_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_threshold_events_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_threshold_events_threshold_id_fkey"
            columns: ["threshold_id"]
            isOneToOne: false
            referencedRelation: "attendance_policy_thresholds"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_certificates: {
        Row: {
          certificate_document_generation_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          digitally_signed: boolean
          entity_id: string
          entity_type: string
          generated_at: string | null
          id: string
          merged_document_hash: string | null
          merged_drive_file_id: string | null
          reference_id: string
          signing_certificate_fingerprint: string | null
          source_document_generation_id: string | null
          source_document_hash: string | null
          source_drive_file_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
          verification_code: string
        }
        Insert: {
          certificate_document_generation_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          digitally_signed?: boolean
          entity_id: string
          entity_type: string
          generated_at?: string | null
          id?: string
          merged_document_hash?: string | null
          merged_drive_file_id?: string | null
          reference_id: string
          signing_certificate_fingerprint?: string | null
          source_document_generation_id?: string | null
          source_document_hash?: string | null
          source_drive_file_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          verification_code: string
        }
        Update: {
          certificate_document_generation_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          digitally_signed?: boolean
          entity_id?: string
          entity_type?: string
          generated_at?: string | null
          id?: string
          merged_document_hash?: string | null
          merged_drive_file_id?: string | null
          reference_id?: string
          signing_certificate_fingerprint?: string | null
          source_document_generation_id?: string | null
          source_document_hash?: string | null
          source_drive_file_id?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_certificates_certificate_document_generation_id_fkey"
            columns: ["certificate_document_generation_id"]
            isOneToOne: false
            referencedRelation: "document_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_certificates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_certificates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_certificates_source_document_generation_id_fkey"
            columns: ["source_document_generation_id"]
            isOneToOne: false
            referencedRelation: "document_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_certificates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action_type: string | null
          company_id: string
          entity_id: string
          entity_type: string
          field_name: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          performed_at: string | null
          performed_by: string | null
          reference_id: string | null
          source_module: string | null
          summary: string | null
          user_agent: string | null
        }
        Insert: {
          action_type?: string | null
          company_id: string
          entity_id: string
          entity_type: string
          field_name?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          performed_at?: string | null
          performed_by?: string | null
          reference_id?: string | null
          source_module?: string | null
          summary?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string | null
          company_id?: string
          entity_id?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          performed_at?: string | null
          performed_by?: string | null
          reference_id?: string | null
          source_module?: string | null
          summary?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_action_types: {
        Row: {
          action_type_key: string
          config_schema: Json
          created_at: string
          description: string | null
          handler_function: string
          is_active: boolean
          label: string
          min_role: string
          sensitivity_ceiling: string
          updated_at: string | null
        }
        Insert: {
          action_type_key: string
          config_schema?: Json
          created_at?: string
          description?: string | null
          handler_function: string
          is_active?: boolean
          label: string
          min_role?: string
          sensitivity_ceiling?: string
          updated_at?: string | null
        }
        Update: {
          action_type_key?: string
          config_schema?: Json
          created_at?: string
          description?: string | null
          handler_function?: string
          is_active?: boolean
          label?: string
          min_role?: string
          sensitivity_ceiling?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_actions: {
        Row: {
          action_type_key: string
          config: Json
          continue_on_error: boolean
          created_at: string
          delay_seconds: number
          id: string
          rule_id: string
          sort_order: number
        }
        Insert: {
          action_type_key: string
          config?: Json
          continue_on_error?: boolean
          created_at?: string
          delay_seconds?: number
          id?: string
          rule_id: string
          sort_order?: number
        }
        Update: {
          action_type_key?: string
          config?: Json
          continue_on_error?: boolean
          created_at?: string
          delay_seconds?: number
          id?: string
          rule_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_actions_action_type_key_fkey"
            columns: ["action_type_key"]
            isOneToOne: false
            referencedRelation: "automation_action_types"
            referencedColumns: ["action_type_key"]
          },
          {
            foreignKeyName: "automation_actions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_event_types: {
        Row: {
          created_at: string
          description: string | null
          entity_type: string
          event_type_key: string
          is_active: boolean
          label: string
          payload_allowlist: string[] | null
          sensitivity_tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_type: string
          event_type_key: string
          is_active?: boolean
          label: string
          payload_allowlist?: string[] | null
          sensitivity_tier?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_type?: string
          event_type_key?: string
          is_active?: boolean
          label?: string
          payload_allowlist?: string[] | null
          sensitivity_tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_events: {
        Row: {
          actor_user_id: string | null
          company_id: string
          dedupe_key: string | null
          depth: number
          entity_id: string | null
          entity_type: string
          error_text: string | null
          event_type_key: string
          id: string
          occurred_at: string
          parent_run_id: string | null
          payload: Json
          processed_at: string | null
          reference_id: string
          sensitivity_level: string
          status: string
          subject_person_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          company_id: string
          dedupe_key?: string | null
          depth?: number
          entity_id?: string | null
          entity_type: string
          error_text?: string | null
          event_type_key: string
          id?: string
          occurred_at?: string
          parent_run_id?: string | null
          payload?: Json
          processed_at?: string | null
          reference_id: string
          sensitivity_level?: string
          status?: string
          subject_person_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          company_id?: string
          dedupe_key?: string | null
          depth?: number
          entity_id?: string | null
          entity_type?: string
          error_text?: string | null
          event_type_key?: string
          id?: string
          occurred_at?: string
          parent_run_id?: string | null
          payload?: Json
          processed_at?: string | null
          reference_id?: string
          sensitivity_level?: string
          status?: string
          subject_person_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_events_event_type_key_fkey"
            columns: ["event_type_key"]
            isOneToOne: false
            referencedRelation: "automation_event_types"
            referencedColumns: ["event_type_key"]
          },
          {
            foreignKeyName: "automation_events_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_recipient_kinds: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          label: string
          recipient_kind_key: string
          resolver_function: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          label: string
          recipient_kind_key: string
          resolver_function: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          label?: string
          recipient_kind_key?: string
          resolver_function?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_row_event_bindings: {
        Row: {
          created_at: string
          event_type_key: string
          id: string
          is_active: boolean
          operation: string
          table_name: string
        }
        Insert: {
          created_at?: string
          event_type_key: string
          id?: string
          is_active?: boolean
          operation: string
          table_name: string
        }
        Update: {
          created_at?: string
          event_type_key?: string
          id?: string
          is_active?: boolean
          operation?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_row_event_bindings_event_type_key_fkey"
            columns: ["event_type_key"]
            isOneToOne: false
            referencedRelation: "automation_event_types"
            referencedColumns: ["event_type_key"]
          },
        ]
      }
      automation_rule_conditions: {
        Row: {
          created_at: string
          group_index: number
          id: string
          operator: string
          path: string
          rule_id: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          group_index?: number
          id?: string
          operator: string
          path: string
          rule_id: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          group_index?: number
          id?: string
          operator?: string
          path?: string
          rule_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_conditions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          authored_by: string
          authorized_at: string | null
          authorized_by: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          event_type_key: string
          id: string
          is_active: boolean
          max_sensitivity: string
          name: string
          reference_id: string
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          authored_by: string
          authorized_at?: string | null
          authorized_by?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          event_type_key: string
          id?: string
          is_active?: boolean
          max_sensitivity?: string
          name: string
          reference_id: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          authored_by?: string
          authorized_at?: string | null
          authorized_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          event_type_key?: string
          id?: string
          is_active?: boolean
          max_sensitivity?: string
          name?: string
          reference_id?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_authorized_by_fkey"
            columns: ["authorized_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_event_type_key_fkey"
            columns: ["event_type_key"]
            isOneToOne: false
            referencedRelation: "automation_event_types"
            referencedColumns: ["event_type_key"]
          },
          {
            foreignKeyName: "automation_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_run_steps: {
        Row: {
          action_id: string | null
          action_type_key: string
          attempts: number
          completed_at: string | null
          id: string
          last_error: string | null
          result: Json | null
          run_id: string
          sort_order: number
          started_at: string | null
          status: string
        }
        Insert: {
          action_id?: string | null
          action_type_key: string
          attempts?: number
          completed_at?: string | null
          id?: string
          last_error?: string | null
          result?: Json | null
          run_id: string
          sort_order?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          action_id?: string | null
          action_type_key?: string
          attempts?: number
          completed_at?: string | null
          id?: string
          last_error?: string | null
          result?: Json | null
          run_id?: string
          sort_order?: number
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_run_steps_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "automation_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_run_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          company_id: string
          depth: number
          error_text: string | null
          event_id: string
          finished_at: string | null
          id: string
          matched: boolean | null
          reference_id: string
          rule_id: string
          started_at: string
          status: string
        }
        Insert: {
          company_id: string
          depth?: number
          error_text?: string | null
          event_id: string
          finished_at?: string | null
          id?: string
          matched?: boolean | null
          reference_id: string
          rule_id: string
          started_at?: string
          status?: string
        }
        Update: {
          company_id?: string
          depth?: number
          error_text?: string | null
          event_id?: string
          finished_at?: string | null
          id?: string
          matched?: boolean | null
          reference_id?: string
          rule_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "automation_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_scheduled_actions: {
        Row: {
          action_id: string
          attempts: number
          company_id: string
          created_at: string
          event_id: string
          id: string
          last_error: string | null
          run_after: string
          run_id: string
          status: string
          step_id: string
        }
        Insert: {
          action_id: string
          attempts?: number
          company_id: string
          created_at?: string
          event_id: string
          id?: string
          last_error?: string | null
          run_after: string
          run_id: string
          status?: string
          step_id: string
        }
        Update: {
          action_id?: string
          attempts?: number
          company_id?: string
          created_at?: string
          event_id?: string
          id?: string
          last_error?: string | null
          run_after?: string
          run_id?: string
          status?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_scheduled_actions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "automation_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_scheduled_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_scheduled_actions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "automation_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_scheduled_actions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_scheduled_actions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "automation_run_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_evaluations: {
        Row: {
          application_id: string
          company_id: string
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          decision_summary: string | null
          id: string
          overall_recommendation: string | null
          reference_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          application_id: string
          company_id: string
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_summary?: string | null
          id?: string
          overall_recommendation?: string | null
          reference_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          company_id?: string
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_summary?: string | null
          id?: string
          overall_recommendation?: string | null
          reference_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_evaluations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "recruiting_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_evaluations_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_documents: {
        Row: {
          company_id: string
          confidentiality_level: string
          created_at: string
          created_by: string
          document_generation_id: string | null
          document_kind: string
          id: string
          payload: Json
          reference_id: string
          source_entity_id: string
          source_entity_type: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          confidentiality_level?: string
          created_at?: string
          created_by: string
          document_generation_id?: string | null
          document_kind: string
          id?: string
          payload?: Json
          reference_id: string
          source_entity_id: string
          source_entity_type: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          confidentiality_level?: string
          created_at?: string
          created_by?: string
          document_generation_id?: string | null
          document_kind?: string
          id?: string
          payload?: Json
          reference_id?: string
          source_entity_id?: string
          source_entity_type?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_document_generation_id_fkey"
            columns: ["document_generation_id"]
            isOneToOne: false
            referencedRelation: "document_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_plan_items: {
        Row: {
          activity_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          plan_id: string
          reference_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          activity_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          plan_id: string
          reference_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          activity_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          plan_id?: string
          reference_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_plan_items_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plan_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "coaching_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plan_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_plans: {
        Row: {
          coach_user_id: string
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          objective: string | null
          outcome_summary: string | null
          person_id: string
          reference_id: string
          source_review_id: string | null
          start_date: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          coach_user_id: string
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          objective?: string | null
          outcome_summary?: string | null
          person_id: string
          reference_id: string
          source_review_id?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          coach_user_id?: string
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          objective?: string | null
          outcome_summary?: string | null
          person_id?: string
          reference_id?: string
          source_review_id?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_plans_coach_user_id_fkey"
            columns: ["coach_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plans_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plans_source_review_id_fkey"
            columns: ["source_review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_name: string
          created_at: string
          created_by: string | null
          employee_count: number | null
          headquarters_location: string | null
          id: string
          industry: string | null
          is_platform_org: boolean
          reference_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          created_by?: string | null
          employee_count?: number | null
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          is_platform_org?: boolean
          reference_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          created_by?: string | null
          employee_count?: number | null
          headquarters_location?: string | null
          id?: string
          industry?: string | null
          is_platform_org?: boolean
          reference_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      company_holidays: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          holiday_date: string
          holiday_name: string
          id: string
          is_paid: boolean
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          holiday_date: string
          holiday_name: string
          id?: string
          is_paid?: boolean
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          holiday_date?: string
          holiday_name?: string
          id?: string
          is_paid?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_holidays_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_holidays_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          category: string | null
          company_id: string | null
          competency_name: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          industry: string
          is_active: boolean
          is_regulated: boolean
          reference_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          competency_name: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string
          is_active?: boolean
          is_regulated?: boolean
          reference_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          competency_name?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string
          is_active?: boolean
          is_regulated?: boolean
          reference_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competencies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competencies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_content_registry: {
        Row: {
          authority_name: string
          content_key: string
          created_at: string
          created_by: string | null
          id: string
          last_verified_at: string
          module_key: string
          production_enabled: boolean
          review_note: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_effective_at: string | null
          source_url: string
          updated_at: string | null
          version: number
        }
        Insert: {
          authority_name: string
          content_key: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_verified_at: string
          module_key: string
          production_enabled?: boolean
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_effective_at?: string | null
          source_url: string
          updated_at?: string | null
          version: number
        }
        Update: {
          authority_name?: string
          content_key?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_verified_at?: string
          module_key?: string
          production_enabled?: boolean
          review_note?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_effective_at?: string | null
          source_url?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_content_registry_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_content_registry_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_deadlines: {
        Row: {
          basis_at: string
          basis_event: string
          company_id: string
          created_at: string
          created_by: string | null
          deadline_kind: string
          document_key: string | null
          due_at: string
          id: string
          interval_amount: number
          interval_unit: string
          legal_citation: string | null
          person_id: string | null
          satisfaction_note: string | null
          satisfied_at: string | null
          satisfied_by: string | null
          subject_id: string
          subject_table: string
          updated_at: string
          updated_by: string | null
          waived_at: string | null
          waived_by: string | null
          waiver_reason: string | null
        }
        Insert: {
          basis_at: string
          basis_event: string
          company_id: string
          created_at?: string
          created_by?: string | null
          deadline_kind: string
          document_key?: string | null
          due_at: string
          id?: string
          interval_amount: number
          interval_unit: string
          legal_citation?: string | null
          person_id?: string | null
          satisfaction_note?: string | null
          satisfied_at?: string | null
          satisfied_by?: string | null
          subject_id: string
          subject_table: string
          updated_at?: string
          updated_by?: string | null
          waived_at?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
        }
        Update: {
          basis_at?: string
          basis_event?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          deadline_kind?: string
          document_key?: string | null
          due_at?: string
          id?: string
          interval_amount?: number
          interval_unit?: string
          legal_citation?: string | null
          person_id?: string | null
          satisfaction_note?: string | null
          satisfied_at?: string | null
          satisfied_by?: string | null
          subject_id?: string
          subject_table?: string
          updated_at?: string
          updated_by?: string | null
          waived_at?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_deadlines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_document_key_fkey"
            columns: ["document_key"]
            isOneToOne: false
            referencedRelation: "onboarding_document_keys"
            referencedColumns: ["document_key"]
          },
          {
            foreignKeyName: "compliance_deadlines_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_satisfied_by_fkey"
            columns: ["satisfied_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_waived_by_fkey"
            columns: ["waived_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conduct_actions: {
        Row: {
          acknowledgment_type: string | null
          action_summary: string | null
          case_id: string
          created_at: string | null
          created_by: string
          document_generation_id: string | null
          document_payload: Json
          esignature_request_id: string | null
          id: string
          issued_at: string | null
          issued_by: string | null
          outcome_at: string | null
          outcome_by: string | null
          outcome_reason: string | null
          reference_id: string
          requires_document: boolean
          severity: string
          sort_order: number
          status: string
          updated_at: string | null
          witness_user_id: string | null
        }
        Insert: {
          acknowledgment_type?: string | null
          action_summary?: string | null
          case_id: string
          created_at?: string | null
          created_by: string
          document_generation_id?: string | null
          document_payload?: Json
          esignature_request_id?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          outcome_at?: string | null
          outcome_by?: string | null
          outcome_reason?: string | null
          reference_id: string
          requires_document?: boolean
          severity: string
          sort_order?: number
          status?: string
          updated_at?: string | null
          witness_user_id?: string | null
        }
        Update: {
          acknowledgment_type?: string | null
          action_summary?: string | null
          case_id?: string
          created_at?: string | null
          created_by?: string
          document_generation_id?: string | null
          document_payload?: Json
          esignature_request_id?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          outcome_at?: string | null
          outcome_by?: string | null
          outcome_reason?: string | null
          reference_id?: string
          requires_document?: boolean
          severity?: string
          sort_order?: number
          status?: string
          updated_at?: string | null
          witness_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conduct_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "conduct_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_actions_document_generation_id_fkey"
            columns: ["document_generation_id"]
            isOneToOne: false
            referencedRelation: "document_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_actions_esignature_request_id_fkey"
            columns: ["esignature_request_id"]
            isOneToOne: false
            referencedRelation: "esignature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_actions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_actions_outcome_by_fkey"
            columns: ["outcome_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_actions_witness_user_id_fkey"
            columns: ["witness_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conduct_cases: {
        Row: {
          category: string
          closed_at: string | null
          closed_by: string | null
          company_id: string
          concern_summary: string | null
          created_at: string | null
          created_by: string
          id: string
          opened_by_user_id: string
          person_id: string
          reference_id: string
          rescind_reason: string | null
          source_threshold_event_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          closed_at?: string | null
          closed_by?: string | null
          company_id: string
          concern_summary?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          opened_by_user_id: string
          person_id: string
          reference_id: string
          rescind_reason?: string | null
          source_threshold_event_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string
          concern_summary?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          opened_by_user_id?: string
          person_id?: string
          reference_id?: string
          rescind_reason?: string | null
          source_threshold_event_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conduct_cases_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_cases_opened_by_user_id_fkey"
            columns: ["opened_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conduct_cases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_methods: {
        Row: {
          contact_type: string
          contact_value: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean
          reference_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          contact_type: string
          contact_value: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type?: string
          id?: string
          is_primary?: boolean
          reference_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          contact_type?: string
          contact_value?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_primary?: boolean
          reference_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      correspondence_branding_settings: {
        Row: {
          company_id: string
          system_sender_display_name: string
          tagline: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          system_sender_display_name?: string
          tagline?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          system_sender_display_name?: string
          tagline?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_branding_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondence_mailbox_aliases: {
        Row: {
          alias_address: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          mailbox_id: string
          updated_at: string | null
        }
        Insert: {
          alias_address: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          mailbox_id: string
          updated_at?: string | null
        }
        Update: {
          alias_address?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          mailbox_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_mailbox_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_mailbox_aliases_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "correspondence_mailboxes"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondence_mailboxes: {
        Row: {
          address: string
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          updated_at: string | null
          watch_expiration: string | null
          watch_history_id: string | null
          workspace_credential_ref: string | null
        }
        Insert: {
          address: string
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          updated_at?: string | null
          watch_expiration?: string | null
          watch_history_id?: string | null
          workspace_credential_ref?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string | null
          watch_expiration?: string | null
          watch_history_id?: string | null
          workspace_credential_ref?: string | null
        }
        Relationships: []
      }
      correspondence_messages: {
        Row: {
          body_html: string | null
          body_text: string | null
          cc_emails: string[]
          company_id: string | null
          created_at: string
          direction: string
          external_in_reply_to: string | null
          external_message_id: string | null
          external_references: string[] | null
          failure_reason: string | null
          id: string
          is_system: boolean
          provider_message_id: string | null
          received_at: string | null
          recipient_emails: string[]
          reference_id: string
          reply_token: string | null
          sender_display_name: string | null
          sender_email: string
          sender_user_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          thread_id: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[]
          company_id?: string | null
          created_at?: string
          direction: string
          external_in_reply_to?: string | null
          external_message_id?: string | null
          external_references?: string[] | null
          failure_reason?: string | null
          id?: string
          is_system?: boolean
          provider_message_id?: string | null
          received_at?: string | null
          recipient_emails?: string[]
          reference_id: string
          reply_token?: string | null
          sender_display_name?: string | null
          sender_email: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          thread_id: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[]
          company_id?: string | null
          created_at?: string
          direction?: string
          external_in_reply_to?: string | null
          external_message_id?: string | null
          external_references?: string[] | null
          failure_reason?: string | null
          id?: string
          is_system?: boolean
          provider_message_id?: string | null
          received_at?: string | null
          recipient_emails?: string[]
          reference_id?: string
          reply_token?: string | null
          sender_display_name?: string | null
          sender_email?: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "correspondence_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondence_threads: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_archived: boolean
          last_message_at: string | null
          linked_at: string | null
          linked_by: string | null
          mailbox_id: string
          origin: string
          reference_id: string
          sensitivity_level: string
          subject: string | null
          subject_person_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          linked_at?: string | null
          linked_by?: string | null
          mailbox_id: string
          origin: string
          reference_id: string
          sensitivity_level?: string
          subject?: string | null
          subject_person_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          linked_at?: string | null
          linked_by?: string | null
          mailbox_id?: string
          origin?: string
          reference_id?: string
          sensitivity_level?: string
          subject?: string | null
          subject_person_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_threads_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_threads_mailbox_id_fkey"
            columns: ["mailbox_id"]
            isOneToOne: false
            referencedRelation: "correspondence_mailboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_threads_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      document_generations: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          esignature_request_id: string | null
          generated_at: string | null
          id: string
          merge_data: Json
          output_document_hash: string | null
          output_drive_file_id: string | null
          output_file_name: string | null
          reference_id: string
          sensitivity_level: string
          status: string
          subject_person_id: string | null
          template_id: string
          template_version: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          esignature_request_id?: string | null
          generated_at?: string | null
          id?: string
          merge_data?: Json
          output_document_hash?: string | null
          output_drive_file_id?: string | null
          output_file_name?: string | null
          reference_id: string
          sensitivity_level?: string
          status?: string
          subject_person_id?: string | null
          template_id: string
          template_version: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          esignature_request_id?: string | null
          generated_at?: string | null
          id?: string
          merge_data?: Json
          output_document_hash?: string | null
          output_drive_file_id?: string | null
          output_file_name?: string | null
          reference_id?: string
          sensitivity_level?: string
          status?: string
          subject_person_id?: string | null
          template_id?: string
          template_version?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_generations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_generations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_generations_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_generations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_generations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_retention_schedules: {
        Row: {
          company_id: string
          computed_at: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          retention_basis: string
          retention_expires_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          computed_at?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          retention_basis: string
          retention_expires_at: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          computed_at?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          retention_basis?: string
          retention_expires_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_retention_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_revocations: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          document_key: string | null
          effective_date: string
          effective_rule: string | null
          id: string
          notice_received_at: string
          person_id: string
          recorded_by: string | null
          revocation_method: string
          revocation_note: string | null
          subject_id: string
          subject_table: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          document_key?: string | null
          effective_date: string
          effective_rule?: string | null
          id?: string
          notice_received_at: string
          person_id: string
          recorded_by?: string | null
          revocation_method: string
          revocation_note?: string | null
          subject_id: string
          subject_table: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          document_key?: string | null
          effective_date?: string
          effective_rule?: string | null
          id?: string
          notice_received_at?: string
          person_id?: string
          recorded_by?: string | null
          revocation_method?: string
          revocation_note?: string | null
          subject_id?: string
          subject_table?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_revocations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_revocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_revocations_document_key_fkey"
            columns: ["document_key"]
            isOneToOne: false
            referencedRelation: "onboarding_document_keys"
            referencedColumns: ["document_key"]
          },
          {
            foreignKeyName: "document_revocations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_revocations_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_revocations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatories: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          decline_reason: string | null
          declined_at: string | null
          document_key: string | null
          id: string
          is_required: boolean
          person_id: string | null
          signatory_address: string | null
          signatory_ordinal: number
          signatory_role: string
          signatory_title: string | null
          signature_asset_id: string | null
          signature_method: string | null
          signed_at: string | null
          signed_ip: unknown
          signed_name: string | null
          signed_user_agent: string | null
          subject_id: string
          subject_table: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          document_key?: string | null
          id?: string
          is_required?: boolean
          person_id?: string | null
          signatory_address?: string | null
          signatory_ordinal?: number
          signatory_role: string
          signatory_title?: string | null
          signature_asset_id?: string | null
          signature_method?: string | null
          signed_at?: string | null
          signed_ip?: unknown
          signed_name?: string | null
          signed_user_agent?: string | null
          subject_id: string
          subject_table: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          document_key?: string | null
          id?: string
          is_required?: boolean
          person_id?: string | null
          signatory_address?: string | null
          signatory_ordinal?: number
          signatory_role?: string
          signatory_title?: string | null
          signature_asset_id?: string | null
          signature_method?: string | null
          signed_at?: string | null
          signed_ip?: unknown
          signed_name?: string | null
          signed_user_agent?: string | null
          subject_id?: string
          subject_table?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signatories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatories_document_key_fkey"
            columns: ["document_key"]
            isOneToOne: false
            referencedRelation: "onboarding_document_keys"
            referencedColumns: ["document_key"]
          },
          {
            foreignKeyName: "document_signatories_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          applicable_entity_type: string | null
          company_id: string | null
          compliance_content_key: string | null
          compliance_module_key: string | null
          content: string
          content_format: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_deleted: boolean
          is_system: boolean
          merge_fields: Json
          name: string
          reference_id: string
          requires_signature: boolean
          template_key: string | null
          template_type: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          applicable_entity_type?: string | null
          company_id?: string | null
          compliance_content_key?: string | null
          compliance_module_key?: string | null
          content: string
          content_format?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          is_system?: boolean
          merge_fields?: Json
          name: string
          reference_id: string
          requires_signature?: boolean
          template_key?: string | null
          template_type: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          applicable_entity_type?: string | null
          company_id?: string | null
          compliance_content_key?: string | null
          compliance_module_key?: string | null
          content?: string
          content_format?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_deleted?: boolean
          is_system?: boolean
          merge_fields?: Json
          name?: string
          reference_id?: string
          requires_signature?: boolean
          template_key?: string | null
          template_type?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      electronic_signature_consents: {
        Row: {
          company_id: string
          consent_ip: unknown
          consent_text_snapshot: string
          consent_user_agent: string | null
          consent_version: string | null
          consented_at: string
          created_at: string
          created_by: string | null
          document_key: string | null
          id: string
          person_id: string
          subject_id: string | null
          subject_table: string | null
          updated_at: string
          updated_by: string | null
          withdrawn_at: string | null
          withdrawn_reason: string | null
        }
        Insert: {
          company_id: string
          consent_ip?: unknown
          consent_text_snapshot: string
          consent_user_agent?: string | null
          consent_version?: string | null
          consented_at?: string
          created_at?: string
          created_by?: string | null
          document_key?: string | null
          id?: string
          person_id: string
          subject_id?: string | null
          subject_table?: string | null
          updated_at?: string
          updated_by?: string | null
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
        }
        Update: {
          company_id?: string
          consent_ip?: unknown
          consent_text_snapshot?: string
          consent_user_agent?: string | null
          consent_version?: string | null
          consented_at?: string
          created_at?: string
          created_by?: string | null
          document_key?: string | null
          id?: string
          person_id?: string
          subject_id?: string | null
          subject_table?: string | null
          updated_at?: string
          updated_by?: string | null
          withdrawn_at?: string | null
          withdrawn_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "electronic_signature_consents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_signature_consents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_signature_consents_document_key_fkey"
            columns: ["document_key"]
            isOneToOne: false
            referencedRelation: "onboarding_document_keys"
            referencedColumns: ["document_key"]
          },
          {
            foreignKeyName: "electronic_signature_consents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electronic_signature_consents_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_grievance_steps: {
        Row: {
          created_at: string
          created_by: string | null
          grievance_id: string
          handled_at: string | null
          handled_by: string | null
          id: string
          step_name: string
          step_notes: string | null
          step_ordinal: number
          step_outcome: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          grievance_id: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          step_name: string
          step_notes?: string | null
          step_ordinal: number
          step_outcome?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          grievance_id?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          step_name?: string
          step_notes?: string | null
          step_ordinal?: number
          step_outcome?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_grievance_steps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievance_steps_grievance_id_fkey"
            columns: ["grievance_id"]
            isOneToOne: false
            referencedRelation: "employee_grievances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievance_steps_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievance_steps_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_grievances: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          closed_at: string | null
          company_id: string
          concerns_unrecorded_oral_reprimand: boolean
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          disagreement_explanation: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          grievance_what: string | null
          grievance_when: string | null
          grievance_where: string | null
          grievance_who: string | null
          grievance_why: string | null
          id: string
          is_deleted: boolean
          is_harassment_related: boolean
          person_id: string
          reference_id: string | null
          referred_at: string | null
          referred_to_process: string | null
          remedy_requested: string | null
          resolution: string | null
          resolution_at: string | null
          resolution_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          closed_at?: string | null
          company_id: string
          concerns_unrecorded_oral_reprimand?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          disagreement_explanation?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          grievance_what?: string | null
          grievance_when?: string | null
          grievance_where?: string | null
          grievance_who?: string | null
          grievance_why?: string | null
          id?: string
          is_deleted?: boolean
          is_harassment_related?: boolean
          person_id: string
          reference_id?: string | null
          referred_at?: string | null
          referred_to_process?: string | null
          remedy_requested?: string | null
          resolution?: string | null
          resolution_at?: string | null
          resolution_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          closed_at?: string | null
          company_id?: string
          concerns_unrecorded_oral_reprimand?: boolean
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          disagreement_explanation?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          grievance_what?: string | null
          grievance_when?: string | null
          grievance_where?: string | null
          grievance_who?: string | null
          grievance_why?: string | null
          id?: string
          is_deleted?: boolean
          is_harassment_related?: boolean
          person_id?: string
          reference_id?: string | null
          referred_at?: string | null
          referred_to_process?: string | null
          remedy_requested?: string | null
          resolution?: string | null
          resolution_at?: string | null
          resolution_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_grievances_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievances_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievances_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievances_resolution_by_fkey"
            columns: ["resolution_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grievances_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      esignature_events: {
        Row: {
          event_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          request_id: string
          signer_id: string | null
          user_agent: string | null
        }
        Insert: {
          event_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          request_id: string
          signer_id?: string | null
          user_agent?: string | null
        }
        Update: {
          event_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          request_id?: string
          signer_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esignature_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "esignature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_events_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "esignature_signers"
            referencedColumns: ["id"]
          },
        ]
      }
      esignature_requests: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          disclosure_text: string
          disclosure_version: string
          document_drive_file_id: string
          document_generation_id: string
          document_hash: string | null
          document_name: string
          expires_at: string | null
          id: string
          reference_id: string
          signed_document_hash: string | null
          signed_drive_file_id: string | null
          signing_order: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          disclosure_text?: string
          disclosure_version?: string
          document_drive_file_id: string
          document_generation_id: string
          document_hash?: string | null
          document_name: string
          expires_at?: string | null
          id?: string
          reference_id: string
          signed_document_hash?: string | null
          signed_drive_file_id?: string | null
          signing_order?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          disclosure_text?: string
          disclosure_version?: string
          document_drive_file_id?: string
          document_generation_id?: string
          document_hash?: string | null
          document_name?: string
          expires_at?: string | null
          id?: string
          reference_id?: string
          signed_document_hash?: string | null
          signed_drive_file_id?: string | null
          signing_order?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esignature_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_requests_document_generation_id_fkey"
            columns: ["document_generation_id"]
            isOneToOne: false
            referencedRelation: "document_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_requests_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      esignature_signer_consents: {
        Row: {
          acknowledged_hardware_requirements: boolean
          acknowledged_paper_copy_right: boolean
          acknowledged_withdrawal_right: boolean
          agreed_to_use_electronic_signature: boolean
          consented_at: string
          consented_to_electronic_records: boolean
          created_at: string
          disclosure_text: string
          disclosure_version: string
          id: string
          ip_address: string | null
          request_id: string
          signer_id: string
          user_agent: string | null
        }
        Insert: {
          acknowledged_hardware_requirements: boolean
          acknowledged_paper_copy_right: boolean
          acknowledged_withdrawal_right: boolean
          agreed_to_use_electronic_signature: boolean
          consented_at?: string
          consented_to_electronic_records: boolean
          created_at?: string
          disclosure_text: string
          disclosure_version: string
          id?: string
          ip_address?: string | null
          request_id: string
          signer_id: string
          user_agent?: string | null
        }
        Update: {
          acknowledged_hardware_requirements?: boolean
          acknowledged_paper_copy_right?: boolean
          acknowledged_withdrawal_right?: boolean
          agreed_to_use_electronic_signature?: boolean
          consented_at?: string
          consented_to_electronic_records?: boolean
          created_at?: string
          disclosure_text?: string
          disclosure_version?: string
          id?: string
          ip_address?: string | null
          request_id?: string
          signer_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esignature_signer_consents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "esignature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_signer_consents_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: true
            referencedRelation: "esignature_signers"
            referencedColumns: ["id"]
          },
        ]
      }
      esignature_signers: {
        Row: {
          declined_reason: string | null
          external_email: string | null
          external_name: string | null
          id: string
          ip_address: string | null
          request_id: string
          signature_color: string
          signature_font: string
          signature_name: string | null
          signed_at: string | null
          signer_order: number | null
          signing_token: string
          status: string
          token_expires_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          declined_reason?: string | null
          external_email?: string | null
          external_name?: string | null
          id?: string
          ip_address?: string | null
          request_id: string
          signature_color?: string
          signature_font?: string
          signature_name?: string | null
          signed_at?: string | null
          signer_order?: number | null
          signing_token: string
          status?: string
          token_expires_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          declined_reason?: string | null
          external_email?: string | null
          external_name?: string | null
          id?: string
          ip_address?: string | null
          request_id?: string
          signature_color?: string
          signature_font?: string
          signature_name?: string | null
          signed_at?: string | null
          signer_order?: number | null
          signing_token?: string
          status?: string
          token_expires_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esignature_signers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "esignature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esignature_signers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_accessibility_configs: {
        Row: {
          accessibility_audit_status: string | null
          accessibility_enabled: boolean
          aria_description: string | null
          aria_label: string | null
          confirmation_ux_type: string | null
          created_at: string
          created_by: string | null
          empty_state_message: string | null
          error_summary_enabled: boolean
          focus_management_rule: string | null
          form_id: string
          help_text_display_mode: string | null
          high_contrast_mode_support: string | null
          id: string
          inline_error_display_enabled: boolean
          keyboard_navigation_enabled: boolean
          language_selector_enabled: boolean
          large_tap_targets_enabled: boolean
          loading_state_message: string | null
          mobile_camera_upload_enabled: boolean
          mobile_field_order: number | null
          mobile_layout_type: string | null
          mobile_offline_mode_enabled: boolean
          mobile_responsive_enabled: boolean
          mobile_section_collapse_default: string | null
          mobile_signature_enabled: boolean
          multi_language_form_enabled: boolean
          offline_draft_save_enabled: boolean
          offline_sync_status: string | null
          progress_indicator_type: string | null
          reduced_motion_support: string | null
          reference_id: string
          required_field_indicator_type: string | null
          right_to_left_language_support: string | null
          save_progress_indicator: string | null
          screen_reader_label: string | null
          tab_order: number | null
          text_scaling_support: string | null
          tooltip_display_mode: string | null
          touch_friendly_controls_enabled: boolean
          translation_status: string | null
          unsupported_browser_message: string | null
          updated_at: string
          updated_by: string | null
          ux_testing_status: string | null
          wcag_compliance_target: string | null
        }
        Insert: {
          accessibility_audit_status?: string | null
          accessibility_enabled?: boolean
          aria_description?: string | null
          aria_label?: string | null
          confirmation_ux_type?: string | null
          created_at?: string
          created_by?: string | null
          empty_state_message?: string | null
          error_summary_enabled?: boolean
          focus_management_rule?: string | null
          form_id: string
          help_text_display_mode?: string | null
          high_contrast_mode_support?: string | null
          id?: string
          inline_error_display_enabled?: boolean
          keyboard_navigation_enabled?: boolean
          language_selector_enabled?: boolean
          large_tap_targets_enabled?: boolean
          loading_state_message?: string | null
          mobile_camera_upload_enabled?: boolean
          mobile_field_order?: number | null
          mobile_layout_type?: string | null
          mobile_offline_mode_enabled?: boolean
          mobile_responsive_enabled?: boolean
          mobile_section_collapse_default?: string | null
          mobile_signature_enabled?: boolean
          multi_language_form_enabled?: boolean
          offline_draft_save_enabled?: boolean
          offline_sync_status?: string | null
          progress_indicator_type?: string | null
          reduced_motion_support?: string | null
          reference_id: string
          required_field_indicator_type?: string | null
          right_to_left_language_support?: string | null
          save_progress_indicator?: string | null
          screen_reader_label?: string | null
          tab_order?: number | null
          text_scaling_support?: string | null
          tooltip_display_mode?: string | null
          touch_friendly_controls_enabled?: boolean
          translation_status?: string | null
          unsupported_browser_message?: string | null
          updated_at?: string
          updated_by?: string | null
          ux_testing_status?: string | null
          wcag_compliance_target?: string | null
        }
        Update: {
          accessibility_audit_status?: string | null
          accessibility_enabled?: boolean
          aria_description?: string | null
          aria_label?: string | null
          confirmation_ux_type?: string | null
          created_at?: string
          created_by?: string | null
          empty_state_message?: string | null
          error_summary_enabled?: boolean
          focus_management_rule?: string | null
          form_id?: string
          help_text_display_mode?: string | null
          high_contrast_mode_support?: string | null
          id?: string
          inline_error_display_enabled?: boolean
          keyboard_navigation_enabled?: boolean
          language_selector_enabled?: boolean
          large_tap_targets_enabled?: boolean
          loading_state_message?: string | null
          mobile_camera_upload_enabled?: boolean
          mobile_field_order?: number | null
          mobile_layout_type?: string | null
          mobile_offline_mode_enabled?: boolean
          mobile_responsive_enabled?: boolean
          mobile_section_collapse_default?: string | null
          mobile_signature_enabled?: boolean
          multi_language_form_enabled?: boolean
          offline_draft_save_enabled?: boolean
          offline_sync_status?: string | null
          progress_indicator_type?: string | null
          reduced_motion_support?: string | null
          reference_id?: string
          required_field_indicator_type?: string | null
          right_to_left_language_support?: string | null
          save_progress_indicator?: string | null
          screen_reader_label?: string | null
          tab_order?: number | null
          text_scaling_support?: string | null
          tooltip_display_mode?: string | null
          touch_friendly_controls_enabled?: boolean
          translation_status?: string | null
          unsupported_browser_message?: string | null
          updated_at?: string
          updated_by?: string | null
          ux_testing_status?: string | null
          wcag_compliance_target?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_accessibility_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_accessibility_configs_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_accessibility_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_approval_routes: {
        Row: {
          approval_audit_trail_enabled: boolean
          approval_comment_required: boolean
          approval_decision_options: string | null
          approval_delegation_allowed: boolean
          approval_due_date_rule: string | null
          approval_escalation_level: string | null
          approval_escalation_recipient: string | null
          approval_escalation_rule: string | null
          approval_exception_reason: string | null
          approval_group_id: string | null
          approval_notification_template_id: string | null
          approval_override_role_ids: string | null
          approval_reminder_rule: string | null
          approval_required: boolean
          approval_security_rule: string | null
          approval_sla_hours: number | null
          approval_status: string | null
          approval_step_id: string | null
          approval_type: string | null
          approval_workflow_id: string | null
          approved_by: string | null
          approved_date: string | null
          changes_requested_allowed: boolean
          compliance_approval_required: boolean
          consensus_approval_enabled: boolean
          created_at: string
          created_by: string | null
          dynamic_approver_rule: string | null
          escalated_by: string | null
          escalated_date: string | null
          finance_approval_required: boolean
          form_id: string
          hr_approval_required: boolean
          id: string
          legal_approval_required: boolean
          manager_approval_required: boolean
          parallel_approval_enabled: boolean
          primary_approver_rule: string | null
          reference_id: string
          rejected_by: string | null
          rejected_date: string | null
          rejection_reason_required: boolean
          resubmission_allowed: boolean
          secondary_approver_rule: string | null
          sequential_approval_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approval_audit_trail_enabled?: boolean
          approval_comment_required?: boolean
          approval_decision_options?: string | null
          approval_delegation_allowed?: boolean
          approval_due_date_rule?: string | null
          approval_escalation_level?: string | null
          approval_escalation_recipient?: string | null
          approval_escalation_rule?: string | null
          approval_exception_reason?: string | null
          approval_group_id?: string | null
          approval_notification_template_id?: string | null
          approval_override_role_ids?: string | null
          approval_reminder_rule?: string | null
          approval_required?: boolean
          approval_security_rule?: string | null
          approval_sla_hours?: number | null
          approval_status?: string | null
          approval_step_id?: string | null
          approval_type?: string | null
          approval_workflow_id?: string | null
          approved_by?: string | null
          approved_date?: string | null
          changes_requested_allowed?: boolean
          compliance_approval_required?: boolean
          consensus_approval_enabled?: boolean
          created_at?: string
          created_by?: string | null
          dynamic_approver_rule?: string | null
          escalated_by?: string | null
          escalated_date?: string | null
          finance_approval_required?: boolean
          form_id: string
          hr_approval_required?: boolean
          id?: string
          legal_approval_required?: boolean
          manager_approval_required?: boolean
          parallel_approval_enabled?: boolean
          primary_approver_rule?: string | null
          reference_id: string
          rejected_by?: string | null
          rejected_date?: string | null
          rejection_reason_required?: boolean
          resubmission_allowed?: boolean
          secondary_approver_rule?: string | null
          sequential_approval_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approval_audit_trail_enabled?: boolean
          approval_comment_required?: boolean
          approval_decision_options?: string | null
          approval_delegation_allowed?: boolean
          approval_due_date_rule?: string | null
          approval_escalation_level?: string | null
          approval_escalation_recipient?: string | null
          approval_escalation_rule?: string | null
          approval_exception_reason?: string | null
          approval_group_id?: string | null
          approval_notification_template_id?: string | null
          approval_override_role_ids?: string | null
          approval_reminder_rule?: string | null
          approval_required?: boolean
          approval_security_rule?: string | null
          approval_sla_hours?: number | null
          approval_status?: string | null
          approval_step_id?: string | null
          approval_type?: string | null
          approval_workflow_id?: string | null
          approved_by?: string | null
          approved_date?: string | null
          changes_requested_allowed?: boolean
          compliance_approval_required?: boolean
          consensus_approval_enabled?: boolean
          created_at?: string
          created_by?: string | null
          dynamic_approver_rule?: string | null
          escalated_by?: string | null
          escalated_date?: string | null
          finance_approval_required?: boolean
          form_id?: string
          hr_approval_required?: boolean
          id?: string
          legal_approval_required?: boolean
          manager_approval_required?: boolean
          parallel_approval_enabled?: boolean
          primary_approver_rule?: string | null
          reference_id?: string
          rejected_by?: string | null
          rejected_date?: string | null
          rejection_reason_required?: boolean
          resubmission_allowed?: boolean
          secondary_approver_rule?: string | null
          sequential_approval_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_approval_routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_approval_routes_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_approval_routes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_audit_log: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          audit_export_status: string | null
          audit_log_id: string | null
          audit_retention_period: string | null
          audit_review_date: string | null
          audit_review_required: boolean
          change_approved_by: string | null
          change_approved_date: string | null
          change_reason: string | null
          change_request_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          draft_version_id: string | null
          export_audit_enabled: boolean
          field_change_audit_enabled: boolean
          form_id: string
          form_major_version: string | null
          form_minor_version: string | null
          form_version_number: string | null
          id: string
          previous_version_id: string | null
          published_at: string | null
          published_version_id: string | null
          record_hash: string | null
          reference_id: string
          restored_at: string | null
          restored_by: string | null
          rollback_allowed: boolean
          rollback_version_id: string | null
          rule_change_audit_enabled: boolean
          security_change_audit_enabled: boolean
          submission_audit_trail_enabled: boolean
          tamper_check_status: string | null
          updated_at: string
          updated_by: string | null
          version_comparison_json: Json | null
          version_effective_date: string | null
          version_notes: string | null
          version_retired_date: string | null
          version_status: string | null
          view_audit_enabled: boolean
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          audit_export_status?: string | null
          audit_log_id?: string | null
          audit_retention_period?: string | null
          audit_review_date?: string | null
          audit_review_required?: boolean
          change_approved_by?: string | null
          change_approved_date?: string | null
          change_reason?: string | null
          change_request_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          draft_version_id?: string | null
          export_audit_enabled?: boolean
          field_change_audit_enabled?: boolean
          form_id: string
          form_major_version?: string | null
          form_minor_version?: string | null
          form_version_number?: string | null
          id?: string
          previous_version_id?: string | null
          published_at?: string | null
          published_version_id?: string | null
          record_hash?: string | null
          reference_id: string
          restored_at?: string | null
          restored_by?: string | null
          rollback_allowed?: boolean
          rollback_version_id?: string | null
          rule_change_audit_enabled?: boolean
          security_change_audit_enabled?: boolean
          submission_audit_trail_enabled?: boolean
          tamper_check_status?: string | null
          updated_at?: string
          updated_by?: string | null
          version_comparison_json?: Json | null
          version_effective_date?: string | null
          version_notes?: string | null
          version_retired_date?: string | null
          version_status?: string | null
          view_audit_enabled?: boolean
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          audit_export_status?: string | null
          audit_log_id?: string | null
          audit_retention_period?: string | null
          audit_review_date?: string | null
          audit_review_required?: boolean
          change_approved_by?: string | null
          change_approved_date?: string | null
          change_reason?: string | null
          change_request_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          draft_version_id?: string | null
          export_audit_enabled?: boolean
          field_change_audit_enabled?: boolean
          form_id?: string
          form_major_version?: string | null
          form_minor_version?: string | null
          form_version_number?: string | null
          id?: string
          previous_version_id?: string | null
          published_at?: string | null
          published_version_id?: string | null
          record_hash?: string | null
          reference_id?: string
          restored_at?: string | null
          restored_by?: string | null
          rollback_allowed?: boolean
          rollback_version_id?: string | null
          rule_change_audit_enabled?: boolean
          security_change_audit_enabled?: boolean
          submission_audit_trail_enabled?: boolean
          tamper_check_status?: string | null
          updated_at?: string
          updated_by?: string | null
          version_comparison_json?: Json | null
          version_effective_date?: string | null
          version_notes?: string | null
          version_retired_date?: string | null
          version_status?: string | null
          view_audit_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_audit_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_audit_log_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_audit_log_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_calculations: {
        Row: {
          age_calculation_enabled: boolean
          calculated_default_value: string | null
          calculated_field_ids: string | null
          calculation_enabled: boolean
          calculation_result_mapping: string | null
          calculation_scope: string | null
          calculation_trigger: string | null
          client_side_calculation_required: boolean
          conditional_formula_rule: string | null
          created_at: string
          created_by: string | null
          currency_calculation_enabled: boolean
          date_difference_calculation: string | null
          decimal_precision: number | null
          form_id: string
          formula_audit_enabled: boolean
          formula_circular_reference_check: string | null
          formula_dependency_fields: Json | null
          formula_dependency_graph: string | null
          formula_error_message: string | null
          formula_expression: string | null
          formula_language: string | null
          formula_override_allowed: boolean
          formula_recalculate_on_change: string | null
          formula_recalculate_on_load: string | null
          formula_result_type: string | null
          formula_test_cases: string | null
          formula_validation_status: string | null
          formula_version: string | null
          grand_total_field_id: string | null
          hidden_calculation_field: string | null
          id: string
          matrix_score_calculation: string | null
          reference_id: string
          repeating_row_total: string | null
          repeating_section_total: string | null
          rounding_mode: string | null
          server_side_calculation_required: boolean
          subtotal_field_id: string | null
          total_field_id: string | null
          updated_at: string
          updated_by: string | null
          weighted_score_calculation: string | null
        }
        Insert: {
          age_calculation_enabled?: boolean
          calculated_default_value?: string | null
          calculated_field_ids?: string | null
          calculation_enabled?: boolean
          calculation_result_mapping?: string | null
          calculation_scope?: string | null
          calculation_trigger?: string | null
          client_side_calculation_required?: boolean
          conditional_formula_rule?: string | null
          created_at?: string
          created_by?: string | null
          currency_calculation_enabled?: boolean
          date_difference_calculation?: string | null
          decimal_precision?: number | null
          form_id: string
          formula_audit_enabled?: boolean
          formula_circular_reference_check?: string | null
          formula_dependency_fields?: Json | null
          formula_dependency_graph?: string | null
          formula_error_message?: string | null
          formula_expression?: string | null
          formula_language?: string | null
          formula_override_allowed?: boolean
          formula_recalculate_on_change?: string | null
          formula_recalculate_on_load?: string | null
          formula_result_type?: string | null
          formula_test_cases?: string | null
          formula_validation_status?: string | null
          formula_version?: string | null
          grand_total_field_id?: string | null
          hidden_calculation_field?: string | null
          id?: string
          matrix_score_calculation?: string | null
          reference_id: string
          repeating_row_total?: string | null
          repeating_section_total?: string | null
          rounding_mode?: string | null
          server_side_calculation_required?: boolean
          subtotal_field_id?: string | null
          total_field_id?: string | null
          updated_at?: string
          updated_by?: string | null
          weighted_score_calculation?: string | null
        }
        Update: {
          age_calculation_enabled?: boolean
          calculated_default_value?: string | null
          calculated_field_ids?: string | null
          calculation_enabled?: boolean
          calculation_result_mapping?: string | null
          calculation_scope?: string | null
          calculation_trigger?: string | null
          client_side_calculation_required?: boolean
          conditional_formula_rule?: string | null
          created_at?: string
          created_by?: string | null
          currency_calculation_enabled?: boolean
          date_difference_calculation?: string | null
          decimal_precision?: number | null
          form_id?: string
          formula_audit_enabled?: boolean
          formula_circular_reference_check?: string | null
          formula_dependency_fields?: Json | null
          formula_dependency_graph?: string | null
          formula_error_message?: string | null
          formula_expression?: string | null
          formula_language?: string | null
          formula_override_allowed?: boolean
          formula_recalculate_on_change?: string | null
          formula_recalculate_on_load?: string | null
          formula_result_type?: string | null
          formula_test_cases?: string | null
          formula_validation_status?: string | null
          formula_version?: string | null
          grand_total_field_id?: string | null
          hidden_calculation_field?: string | null
          id?: string
          matrix_score_calculation?: string | null
          reference_id?: string
          repeating_row_total?: string | null
          repeating_section_total?: string | null
          rounding_mode?: string | null
          server_side_calculation_required?: boolean
          subtotal_field_id?: string | null
          total_field_id?: string | null
          updated_at?: string
          updated_by?: string | null
          weighted_score_calculation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_calculations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_calculations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_calculations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_compliance: {
        Row: {
          archive_date: string | null
          archive_required: boolean
          attorney_client_privileged_flag: boolean
          audit_findings: string | null
          audit_required: boolean
          audit_status: string | null
          compliance_category: string | null
          compliance_owner: string | null
          compliance_required: boolean
          confidential_matter_flag: boolean
          consent_capture_required: boolean
          consent_retention_rule: string | null
          control_effectiveness: string | null
          control_id: string | null
          created_at: string
          created_by: string | null
          data_minimization_rule: string | null
          data_processing_purpose: string | null
          data_subject_request_linked: string | null
          destruction_approval_required: boolean
          destruction_eligible_date: string | null
          exception_approved: string | null
          exception_reason: string | null
          form_id: string
          id: string
          legal_hold_flag: boolean
          legal_hold_id: string | null
          legal_review_required: boolean
          phi_collection_category: string | null
          pii_collection_category: string | null
          policy_reference: string | null
          privacy_notice_required: boolean
          procedure_reference: string | null
          reference_id: string
          regulation_reference: string | null
          regulatory_body: string | null
          residual_risk: string | null
          retention_category: string | null
          retention_expiration_date: string | null
          retention_period: string | null
          right_to_access_export_enabled: boolean
          right_to_delete_restricted: string | null
          risk_mitigation_plan: string | null
          sensitive_data_category: string | null
          updated_at: string
          updated_by: string | null
          work_product_flag: boolean
        }
        Insert: {
          archive_date?: string | null
          archive_required?: boolean
          attorney_client_privileged_flag?: boolean
          audit_findings?: string | null
          audit_required?: boolean
          audit_status?: string | null
          compliance_category?: string | null
          compliance_owner?: string | null
          compliance_required?: boolean
          confidential_matter_flag?: boolean
          consent_capture_required?: boolean
          consent_retention_rule?: string | null
          control_effectiveness?: string | null
          control_id?: string | null
          created_at?: string
          created_by?: string | null
          data_minimization_rule?: string | null
          data_processing_purpose?: string | null
          data_subject_request_linked?: string | null
          destruction_approval_required?: boolean
          destruction_eligible_date?: string | null
          exception_approved?: string | null
          exception_reason?: string | null
          form_id: string
          id?: string
          legal_hold_flag?: boolean
          legal_hold_id?: string | null
          legal_review_required?: boolean
          phi_collection_category?: string | null
          pii_collection_category?: string | null
          policy_reference?: string | null
          privacy_notice_required?: boolean
          procedure_reference?: string | null
          reference_id: string
          regulation_reference?: string | null
          regulatory_body?: string | null
          residual_risk?: string | null
          retention_category?: string | null
          retention_expiration_date?: string | null
          retention_period?: string | null
          right_to_access_export_enabled?: boolean
          right_to_delete_restricted?: string | null
          risk_mitigation_plan?: string | null
          sensitive_data_category?: string | null
          updated_at?: string
          updated_by?: string | null
          work_product_flag?: boolean
        }
        Update: {
          archive_date?: string | null
          archive_required?: boolean
          attorney_client_privileged_flag?: boolean
          audit_findings?: string | null
          audit_required?: boolean
          audit_status?: string | null
          compliance_category?: string | null
          compliance_owner?: string | null
          compliance_required?: boolean
          confidential_matter_flag?: boolean
          consent_capture_required?: boolean
          consent_retention_rule?: string | null
          control_effectiveness?: string | null
          control_id?: string | null
          created_at?: string
          created_by?: string | null
          data_minimization_rule?: string | null
          data_processing_purpose?: string | null
          data_subject_request_linked?: string | null
          destruction_approval_required?: boolean
          destruction_eligible_date?: string | null
          exception_approved?: string | null
          exception_reason?: string | null
          form_id?: string
          id?: string
          legal_hold_flag?: boolean
          legal_hold_id?: string | null
          legal_review_required?: boolean
          phi_collection_category?: string | null
          pii_collection_category?: string | null
          policy_reference?: string | null
          privacy_notice_required?: boolean
          procedure_reference?: string | null
          reference_id?: string
          regulation_reference?: string | null
          regulatory_body?: string | null
          residual_risk?: string | null
          retention_category?: string | null
          retention_expiration_date?: string | null
          retention_period?: string | null
          right_to_access_export_enabled?: boolean
          right_to_delete_restricted?: string | null
          risk_mitigation_plan?: string | null
          sensitive_data_category?: string | null
          updated_at?: string
          updated_by?: string | null
          work_product_flag?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_compliance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_compliance_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_compliance_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_document_templates: {
        Row: {
          combine_attachments_into_packet: string | null
          created_at: string
          created_by: string | null
          document_approval_required: boolean
          document_delivery_rule: string | null
          document_download_allowed: boolean
          document_email_delivery_enabled: boolean
          document_expiration_date: string | null
          document_footer_template: string | null
          document_generation_enabled: boolean
          document_generation_error: string | null
          document_generation_status: string | null
          document_header_template: string | null
          document_output_language: string | null
          document_output_timezone: string | null
          document_page_numbering: string | null
          document_portal_delivery_enabled: boolean
          document_regeneration_allowed: boolean
          document_regeneration_reason: string | null
          document_template_name: string | null
          document_versioning_enabled: boolean
          document_watermark_required: boolean
          form_id: string
          generate_packet_on_submit: string | null
          generate_pdf_on_submit: string | null
          generate_word_on_submit: string | null
          generated_document_attachment_id: string | null
          generated_document_name_rule: string | null
          generated_document_storage_path: string | null
          generated_document_type: string | null
          id: string
          include_approval_history: string | null
          include_audit_trail: string | null
          include_signature_certificate: string | null
          include_submitted_data_summary: string | null
          merge_field_mapping_json: Json | null
          pdf_accessibility_tagging: string | null
          pdf_field_mapping_json: Json | null
          pdf_flattening_required: boolean
          pdf_mapping_enabled: boolean
          pdf_password_required: boolean
          pdf_template_id: string | null
          reference_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          combine_attachments_into_packet?: string | null
          created_at?: string
          created_by?: string | null
          document_approval_required?: boolean
          document_delivery_rule?: string | null
          document_download_allowed?: boolean
          document_email_delivery_enabled?: boolean
          document_expiration_date?: string | null
          document_footer_template?: string | null
          document_generation_enabled?: boolean
          document_generation_error?: string | null
          document_generation_status?: string | null
          document_header_template?: string | null
          document_output_language?: string | null
          document_output_timezone?: string | null
          document_page_numbering?: string | null
          document_portal_delivery_enabled?: boolean
          document_regeneration_allowed?: boolean
          document_regeneration_reason?: string | null
          document_template_name?: string | null
          document_versioning_enabled?: boolean
          document_watermark_required?: boolean
          form_id: string
          generate_packet_on_submit?: string | null
          generate_pdf_on_submit?: string | null
          generate_word_on_submit?: string | null
          generated_document_attachment_id?: string | null
          generated_document_name_rule?: string | null
          generated_document_storage_path?: string | null
          generated_document_type?: string | null
          id?: string
          include_approval_history?: string | null
          include_audit_trail?: string | null
          include_signature_certificate?: string | null
          include_submitted_data_summary?: string | null
          merge_field_mapping_json?: Json | null
          pdf_accessibility_tagging?: string | null
          pdf_field_mapping_json?: Json | null
          pdf_flattening_required?: boolean
          pdf_mapping_enabled?: boolean
          pdf_password_required?: boolean
          pdf_template_id?: string | null
          reference_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          combine_attachments_into_packet?: string | null
          created_at?: string
          created_by?: string | null
          document_approval_required?: boolean
          document_delivery_rule?: string | null
          document_download_allowed?: boolean
          document_email_delivery_enabled?: boolean
          document_expiration_date?: string | null
          document_footer_template?: string | null
          document_generation_enabled?: boolean
          document_generation_error?: string | null
          document_generation_status?: string | null
          document_header_template?: string | null
          document_output_language?: string | null
          document_output_timezone?: string | null
          document_page_numbering?: string | null
          document_portal_delivery_enabled?: boolean
          document_regeneration_allowed?: boolean
          document_regeneration_reason?: string | null
          document_template_name?: string | null
          document_versioning_enabled?: boolean
          document_watermark_required?: boolean
          form_id?: string
          generate_packet_on_submit?: string | null
          generate_pdf_on_submit?: string | null
          generate_word_on_submit?: string | null
          generated_document_attachment_id?: string | null
          generated_document_name_rule?: string | null
          generated_document_storage_path?: string | null
          generated_document_type?: string | null
          id?: string
          include_approval_history?: string | null
          include_audit_trail?: string | null
          include_signature_certificate?: string | null
          include_submitted_data_summary?: string | null
          merge_field_mapping_json?: Json | null
          pdf_accessibility_tagging?: string | null
          pdf_field_mapping_json?: Json | null
          pdf_flattening_required?: boolean
          pdf_mapping_enabled?: boolean
          pdf_password_required?: boolean
          pdf_template_id?: string | null
          reference_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_document_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_document_templates_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_document_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_controls: {
        Row: {
          address_field_control: string | null
          attestation_field_control: string | null
          barcode_field_control: string | null
          calculated_field_control: string | null
          captcha_control: string | null
          checkbox_control: string | null
          checkbox_group_control: string | null
          company_id: string
          consent_field_control: string | null
          created_at: string
          created_by: string | null
          currency_field_control: string | null
          data_grid_control: string | null
          date_field_control: string | null
          date_time_field_control: string | null
          decimal_field_control: string | null
          divider_control: string | null
          dropdown_control: string | null
          email_field_control: string | null
          file_upload_control: string | null
          geolocation_field_control: string | null
          hidden_field_control: string | null
          html_content_block: string | null
          id: string
          identifier_field_control: string | null
          image_upload_control: string | null
          initials_field_control: string | null
          instruction_block_control: string | null
          likert_scale_control: string | null
          long_text_control: string | null
          lookup_field_control: string | null
          map_location_control: string | null
          matrix_field_control: string | null
          multiple_choice_control: string | null
          name_field_control: string | null
          nested_repeater_control: string | null
          nps_field_control: string | null
          number_field_control: string | null
          page_break_control: string | null
          payment_field_control: string | null
          percentage_field_control: string | null
          phone_field_control: string | null
          qr_code_field_control: string | null
          radio_button_control: string | null
          ranking_control: string | null
          rating_control: string | null
          reference_field_control: string | null
          reference_id: string
          repeating_group_control: string | null
          repeating_row_control: string | null
          repeating_section_control: string | null
          repeating_table_control: string | null
          rich_text_control: string | null
          section_header_control: string | null
          signature_field_control: string | null
          single_choice_control: string | null
          slider_control: string | null
          ssn_sensitive_field_control: string | null
          text_field_control: string | null
          time_field_control: string | null
          toggle_switch_control: string | null
          updated_at: string
          updated_by: string | null
          url_field_control: string | null
          yes_no_control: string | null
        }
        Insert: {
          address_field_control?: string | null
          attestation_field_control?: string | null
          barcode_field_control?: string | null
          calculated_field_control?: string | null
          captcha_control?: string | null
          checkbox_control?: string | null
          checkbox_group_control?: string | null
          company_id: string
          consent_field_control?: string | null
          created_at?: string
          created_by?: string | null
          currency_field_control?: string | null
          data_grid_control?: string | null
          date_field_control?: string | null
          date_time_field_control?: string | null
          decimal_field_control?: string | null
          divider_control?: string | null
          dropdown_control?: string | null
          email_field_control?: string | null
          file_upload_control?: string | null
          geolocation_field_control?: string | null
          hidden_field_control?: string | null
          html_content_block?: string | null
          id?: string
          identifier_field_control?: string | null
          image_upload_control?: string | null
          initials_field_control?: string | null
          instruction_block_control?: string | null
          likert_scale_control?: string | null
          long_text_control?: string | null
          lookup_field_control?: string | null
          map_location_control?: string | null
          matrix_field_control?: string | null
          multiple_choice_control?: string | null
          name_field_control?: string | null
          nested_repeater_control?: string | null
          nps_field_control?: string | null
          number_field_control?: string | null
          page_break_control?: string | null
          payment_field_control?: string | null
          percentage_field_control?: string | null
          phone_field_control?: string | null
          qr_code_field_control?: string | null
          radio_button_control?: string | null
          ranking_control?: string | null
          rating_control?: string | null
          reference_field_control?: string | null
          reference_id: string
          repeating_group_control?: string | null
          repeating_row_control?: string | null
          repeating_section_control?: string | null
          repeating_table_control?: string | null
          rich_text_control?: string | null
          section_header_control?: string | null
          signature_field_control?: string | null
          single_choice_control?: string | null
          slider_control?: string | null
          ssn_sensitive_field_control?: string | null
          text_field_control?: string | null
          time_field_control?: string | null
          toggle_switch_control?: string | null
          updated_at?: string
          updated_by?: string | null
          url_field_control?: string | null
          yes_no_control?: string | null
        }
        Update: {
          address_field_control?: string | null
          attestation_field_control?: string | null
          barcode_field_control?: string | null
          calculated_field_control?: string | null
          captcha_control?: string | null
          checkbox_control?: string | null
          checkbox_group_control?: string | null
          company_id?: string
          consent_field_control?: string | null
          created_at?: string
          created_by?: string | null
          currency_field_control?: string | null
          data_grid_control?: string | null
          date_field_control?: string | null
          date_time_field_control?: string | null
          decimal_field_control?: string | null
          divider_control?: string | null
          dropdown_control?: string | null
          email_field_control?: string | null
          file_upload_control?: string | null
          geolocation_field_control?: string | null
          hidden_field_control?: string | null
          html_content_block?: string | null
          id?: string
          identifier_field_control?: string | null
          image_upload_control?: string | null
          initials_field_control?: string | null
          instruction_block_control?: string | null
          likert_scale_control?: string | null
          long_text_control?: string | null
          lookup_field_control?: string | null
          map_location_control?: string | null
          matrix_field_control?: string | null
          multiple_choice_control?: string | null
          name_field_control?: string | null
          nested_repeater_control?: string | null
          nps_field_control?: string | null
          number_field_control?: string | null
          page_break_control?: string | null
          payment_field_control?: string | null
          percentage_field_control?: string | null
          phone_field_control?: string | null
          qr_code_field_control?: string | null
          radio_button_control?: string | null
          ranking_control?: string | null
          rating_control?: string | null
          reference_field_control?: string | null
          reference_id?: string
          repeating_group_control?: string | null
          repeating_row_control?: string | null
          repeating_section_control?: string | null
          repeating_table_control?: string | null
          rich_text_control?: string | null
          section_header_control?: string | null
          signature_field_control?: string | null
          single_choice_control?: string | null
          slider_control?: string | null
          ssn_sensitive_field_control?: string | null
          text_field_control?: string | null
          time_field_control?: string | null
          toggle_switch_control?: string | null
          updated_at?: string
          updated_by?: string | null
          url_field_control?: string | null
          yes_no_control?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_field_controls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_field_controls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_field_controls_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_types: {
        Row: {
          canonical_type: string
          created_at: string
          created_by: string | null
          description: string | null
          field_type: string
          is_active: boolean
          is_evidentiary: boolean
          is_input: boolean
          label: string
          supports_masking: boolean
          supports_options: boolean
          updated_at: string
          updated_by: string | null
          value_shape: string
        }
        Insert: {
          canonical_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          field_type: string
          is_active?: boolean
          is_evidentiary?: boolean
          is_input?: boolean
          label: string
          supports_masking?: boolean
          supports_options?: boolean
          updated_at?: string
          updated_by?: string | null
          value_shape: string
        }
        Update: {
          canonical_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          field_type?: string
          is_active?: boolean
          is_evidentiary?: boolean
          is_input?: boolean
          label?: string
          supports_masking?: boolean
          supports_options?: boolean
          updated_at?: string
          updated_by?: string | null
          value_shape?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_field_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_field_types_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_validations: {
        Row: {
          allowed_file_types: string | null
          at_least_one_required_rule: string | null
          client_side_validation_required: boolean
          created_at: string
          created_by: string | null
          cross_field_validation_rule: string | null
          currency_validation_enabled: boolean
          custom_validation_expression: string | null
          date_range_validation_rule: string | null
          date_validation_enabled: boolean
          duplicate_check_rule: string | null
          email_validation_enabled: boolean
          exactly_one_required_rule: string | null
          field_id: string
          file_virus_scan_required: boolean
          future_date_allowed: boolean
          id: string
          maximum_age_rule: string | null
          maximum_date: string | null
          maximum_file_count: number | null
          maximum_file_size_mb: number | null
          maximum_length: number | null
          maximum_value: string | null
          minimum_age_rule: string | null
          minimum_date: string | null
          minimum_file_count: number | null
          minimum_length: number | null
          minimum_value: string | null
          mutually_exclusive_field_rule: string | null
          numeric_validation_enabled: boolean
          past_date_allowed: boolean
          phone_validation_enabled: boolean
          reference_id: string
          regex_error_message: string | null
          regex_validation_pattern: string | null
          required_error_message: string | null
          required_if_rule: string | null
          required_unless_rule: string | null
          sensitive_data_validation_rule: string | null
          server_side_validation_required: boolean
          unique_value_required: boolean
          updated_at: string
          updated_by: string | null
          url_validation_enabled: boolean
          validation_audit_enabled: boolean
          validation_block_submission_flag: boolean
          validation_bypass_role_ids: string | null
          validation_message: string | null
          validation_required_flag: boolean
          validation_rule_group: string | null
          validation_severity: string | null
          validation_trigger: string | null
          validation_warning_allowed: boolean
        }
        Insert: {
          allowed_file_types?: string | null
          at_least_one_required_rule?: string | null
          client_side_validation_required?: boolean
          created_at?: string
          created_by?: string | null
          cross_field_validation_rule?: string | null
          currency_validation_enabled?: boolean
          custom_validation_expression?: string | null
          date_range_validation_rule?: string | null
          date_validation_enabled?: boolean
          duplicate_check_rule?: string | null
          email_validation_enabled?: boolean
          exactly_one_required_rule?: string | null
          field_id: string
          file_virus_scan_required?: boolean
          future_date_allowed?: boolean
          id?: string
          maximum_age_rule?: string | null
          maximum_date?: string | null
          maximum_file_count?: number | null
          maximum_file_size_mb?: number | null
          maximum_length?: number | null
          maximum_value?: string | null
          minimum_age_rule?: string | null
          minimum_date?: string | null
          minimum_file_count?: number | null
          minimum_length?: number | null
          minimum_value?: string | null
          mutually_exclusive_field_rule?: string | null
          numeric_validation_enabled?: boolean
          past_date_allowed?: boolean
          phone_validation_enabled?: boolean
          reference_id: string
          regex_error_message?: string | null
          regex_validation_pattern?: string | null
          required_error_message?: string | null
          required_if_rule?: string | null
          required_unless_rule?: string | null
          sensitive_data_validation_rule?: string | null
          server_side_validation_required?: boolean
          unique_value_required?: boolean
          updated_at?: string
          updated_by?: string | null
          url_validation_enabled?: boolean
          validation_audit_enabled?: boolean
          validation_block_submission_flag?: boolean
          validation_bypass_role_ids?: string | null
          validation_message?: string | null
          validation_required_flag?: boolean
          validation_rule_group?: string | null
          validation_severity?: string | null
          validation_trigger?: string | null
          validation_warning_allowed?: boolean
        }
        Update: {
          allowed_file_types?: string | null
          at_least_one_required_rule?: string | null
          client_side_validation_required?: boolean
          created_at?: string
          created_by?: string | null
          cross_field_validation_rule?: string | null
          currency_validation_enabled?: boolean
          custom_validation_expression?: string | null
          date_range_validation_rule?: string | null
          date_validation_enabled?: boolean
          duplicate_check_rule?: string | null
          email_validation_enabled?: boolean
          exactly_one_required_rule?: string | null
          field_id?: string
          file_virus_scan_required?: boolean
          future_date_allowed?: boolean
          id?: string
          maximum_age_rule?: string | null
          maximum_date?: string | null
          maximum_file_count?: number | null
          maximum_file_size_mb?: number | null
          maximum_length?: number | null
          maximum_value?: string | null
          minimum_age_rule?: string | null
          minimum_date?: string | null
          minimum_file_count?: number | null
          minimum_length?: number | null
          minimum_value?: string | null
          mutually_exclusive_field_rule?: string | null
          numeric_validation_enabled?: boolean
          past_date_allowed?: boolean
          phone_validation_enabled?: boolean
          reference_id?: string
          regex_error_message?: string | null
          regex_validation_pattern?: string | null
          required_error_message?: string | null
          required_if_rule?: string | null
          required_unless_rule?: string | null
          sensitive_data_validation_rule?: string | null
          server_side_validation_required?: boolean
          unique_value_required?: boolean
          updated_at?: string
          updated_by?: string | null
          url_validation_enabled?: boolean
          validation_audit_enabled?: boolean
          validation_block_submission_flag?: boolean
          validation_bypass_role_ids?: string | null
          validation_message?: string | null
          validation_required_flag?: boolean
          validation_rule_group?: string | null
          validation_severity?: string | null
          validation_trigger?: string | null
          validation_warning_allowed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_field_validations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_field_validations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_field_validations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          clause_key: string | null
          computed_expression: string | null
          created_at: string
          created_by: string | null
          destination_column: string | null
          destination_entity_type: string | null
          destination_json_path: string | null
          destination_table: string | null
          field_api_name: string | null
          field_audit_enabled: boolean
          field_category: string | null
          field_css_class: string | null
          field_data_binding_target: string | null
          field_default_source_rule: string | null
          field_default_value: string | null
          field_dependency_count: number | null
          field_description: string | null
          field_disabled_flag: boolean
          field_display_format: string | null
          field_encryption_required: boolean
          field_exportable_flag: boolean
          field_external_key: string | null
          field_group: string | null
          field_height: string | null
          field_help_link_url: string | null
          field_help_text: string | null
          field_hidden_flag: boolean
          field_icon: string | null
          field_importable_flag: boolean
          field_instructions: string | null
          field_internal_name: string | null
          field_label: string | null
          field_mask_pattern: string | null
          field_normalization_rule: string | null
          field_number: number | null
          field_options_json: Json | null
          field_placeholder: string | null
          field_prepopulated_value: string | null
          field_read_only_flag: boolean
          field_reportable_flag: boolean
          field_required_flag: boolean
          field_searchable_flag: boolean
          field_short_label: string | null
          field_sort_order: number | null
          field_storage_format: string | null
          field_subtype: string | null
          field_tags: string | null
          field_tooltip: string | null
          field_type: string | null
          field_value_source: string | null
          field_visibility_rule: string | null
          field_width: string | null
          fill_responsibility: string | null
          form_id: string
          grid_definition: Json | null
          id: string
          masking_mode: string | null
          page_id: string | null
          reference_id: string
          signatory_role: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clause_key?: string | null
          computed_expression?: string | null
          created_at?: string
          created_by?: string | null
          destination_column?: string | null
          destination_entity_type?: string | null
          destination_json_path?: string | null
          destination_table?: string | null
          field_api_name?: string | null
          field_audit_enabled?: boolean
          field_category?: string | null
          field_css_class?: string | null
          field_data_binding_target?: string | null
          field_default_source_rule?: string | null
          field_default_value?: string | null
          field_dependency_count?: number | null
          field_description?: string | null
          field_disabled_flag?: boolean
          field_display_format?: string | null
          field_encryption_required?: boolean
          field_exportable_flag?: boolean
          field_external_key?: string | null
          field_group?: string | null
          field_height?: string | null
          field_help_link_url?: string | null
          field_help_text?: string | null
          field_hidden_flag?: boolean
          field_icon?: string | null
          field_importable_flag?: boolean
          field_instructions?: string | null
          field_internal_name?: string | null
          field_label?: string | null
          field_mask_pattern?: string | null
          field_normalization_rule?: string | null
          field_number?: number | null
          field_options_json?: Json | null
          field_placeholder?: string | null
          field_prepopulated_value?: string | null
          field_read_only_flag?: boolean
          field_reportable_flag?: boolean
          field_required_flag?: boolean
          field_searchable_flag?: boolean
          field_short_label?: string | null
          field_sort_order?: number | null
          field_storage_format?: string | null
          field_subtype?: string | null
          field_tags?: string | null
          field_tooltip?: string | null
          field_type?: string | null
          field_value_source?: string | null
          field_visibility_rule?: string | null
          field_width?: string | null
          fill_responsibility?: string | null
          form_id: string
          grid_definition?: Json | null
          id?: string
          masking_mode?: string | null
          page_id?: string | null
          reference_id: string
          signatory_role?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clause_key?: string | null
          computed_expression?: string | null
          created_at?: string
          created_by?: string | null
          destination_column?: string | null
          destination_entity_type?: string | null
          destination_json_path?: string | null
          destination_table?: string | null
          field_api_name?: string | null
          field_audit_enabled?: boolean
          field_category?: string | null
          field_css_class?: string | null
          field_data_binding_target?: string | null
          field_default_source_rule?: string | null
          field_default_value?: string | null
          field_dependency_count?: number | null
          field_description?: string | null
          field_disabled_flag?: boolean
          field_display_format?: string | null
          field_encryption_required?: boolean
          field_exportable_flag?: boolean
          field_external_key?: string | null
          field_group?: string | null
          field_height?: string | null
          field_help_link_url?: string | null
          field_help_text?: string | null
          field_hidden_flag?: boolean
          field_icon?: string | null
          field_importable_flag?: boolean
          field_instructions?: string | null
          field_internal_name?: string | null
          field_label?: string | null
          field_mask_pattern?: string | null
          field_normalization_rule?: string | null
          field_number?: number | null
          field_options_json?: Json | null
          field_placeholder?: string | null
          field_prepopulated_value?: string | null
          field_read_only_flag?: boolean
          field_reportable_flag?: boolean
          field_required_flag?: boolean
          field_searchable_flag?: boolean
          field_short_label?: string | null
          field_sort_order?: number | null
          field_storage_format?: string | null
          field_subtype?: string | null
          field_tags?: string | null
          field_tooltip?: string | null
          field_type?: string | null
          field_value_source?: string | null
          field_visibility_rule?: string | null
          field_width?: string | null
          fill_responsibility?: string | null
          form_id?: string
          grid_definition?: Json | null
          id?: string
          masking_mode?: string | null
          page_id?: string | null
          reference_id?: string
          signatory_role?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "form_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_file_configs: {
        Row: {
          allowed_file_extensions: string | null
          allowed_mime_types: string | null
          attachment_approval_required: boolean
          attachment_category_required: boolean
          attachment_description_required: boolean
          attachment_retention_category: string | null
          audio_upload_enabled: boolean
          camera_capture_enabled: boolean
          created_at: string
          created_by: string | null
          document_upload_enabled: boolean
          drag_drop_upload_enabled: boolean
          embedded_audio_enabled: boolean
          embedded_image_enabled: boolean
          embedded_video_enabled: boolean
          field_id: string
          file_delete_allowed: boolean
          file_download_allowed: boolean
          file_drive_file_id: string | null
          file_drive_folder_id: string | null
          file_field_id: string | null
          file_metadata_capture: string | null
          file_naming_rule: string | null
          file_ocr_required: boolean
          file_preview_enabled: boolean
          file_replace_allowed: boolean
          file_storage_provider: string | null
          file_upload_enabled: boolean
          file_versioning_enabled: boolean
          file_virus_scan_required: boolean
          file_watermark_required: boolean
          html_content_allowed: boolean
          id: string
          image_capture_enabled: boolean
          image_preview_enabled: boolean
          markdown_content_allowed: boolean
          maximum_file_count: number | null
          maximum_file_size_mb: number | null
          media_alt_text_required: boolean
          media_caption_field: string | null
          minimum_file_count: number | null
          multiple_file_upload_enabled: boolean
          reference_id: string
          rich_text_content_block: string | null
          updated_at: string
          updated_by: string | null
          upload_failure_message: string | null
          upload_progress_display: string | null
          video_upload_enabled: boolean
        }
        Insert: {
          allowed_file_extensions?: string | null
          allowed_mime_types?: string | null
          attachment_approval_required?: boolean
          attachment_category_required?: boolean
          attachment_description_required?: boolean
          attachment_retention_category?: string | null
          audio_upload_enabled?: boolean
          camera_capture_enabled?: boolean
          created_at?: string
          created_by?: string | null
          document_upload_enabled?: boolean
          drag_drop_upload_enabled?: boolean
          embedded_audio_enabled?: boolean
          embedded_image_enabled?: boolean
          embedded_video_enabled?: boolean
          field_id: string
          file_delete_allowed?: boolean
          file_download_allowed?: boolean
          file_drive_file_id?: string | null
          file_drive_folder_id?: string | null
          file_field_id?: string | null
          file_metadata_capture?: string | null
          file_naming_rule?: string | null
          file_ocr_required?: boolean
          file_preview_enabled?: boolean
          file_replace_allowed?: boolean
          file_storage_provider?: string | null
          file_upload_enabled?: boolean
          file_versioning_enabled?: boolean
          file_virus_scan_required?: boolean
          file_watermark_required?: boolean
          html_content_allowed?: boolean
          id?: string
          image_capture_enabled?: boolean
          image_preview_enabled?: boolean
          markdown_content_allowed?: boolean
          maximum_file_count?: number | null
          maximum_file_size_mb?: number | null
          media_alt_text_required?: boolean
          media_caption_field?: string | null
          minimum_file_count?: number | null
          multiple_file_upload_enabled?: boolean
          reference_id: string
          rich_text_content_block?: string | null
          updated_at?: string
          updated_by?: string | null
          upload_failure_message?: string | null
          upload_progress_display?: string | null
          video_upload_enabled?: boolean
        }
        Update: {
          allowed_file_extensions?: string | null
          allowed_mime_types?: string | null
          attachment_approval_required?: boolean
          attachment_category_required?: boolean
          attachment_description_required?: boolean
          attachment_retention_category?: string | null
          audio_upload_enabled?: boolean
          camera_capture_enabled?: boolean
          created_at?: string
          created_by?: string | null
          document_upload_enabled?: boolean
          drag_drop_upload_enabled?: boolean
          embedded_audio_enabled?: boolean
          embedded_image_enabled?: boolean
          embedded_video_enabled?: boolean
          field_id?: string
          file_delete_allowed?: boolean
          file_download_allowed?: boolean
          file_drive_file_id?: string | null
          file_drive_folder_id?: string | null
          file_field_id?: string | null
          file_metadata_capture?: string | null
          file_naming_rule?: string | null
          file_ocr_required?: boolean
          file_preview_enabled?: boolean
          file_replace_allowed?: boolean
          file_storage_provider?: string | null
          file_upload_enabled?: boolean
          file_versioning_enabled?: boolean
          file_virus_scan_required?: boolean
          file_watermark_required?: boolean
          html_content_allowed?: boolean
          id?: string
          image_capture_enabled?: boolean
          image_preview_enabled?: boolean
          markdown_content_allowed?: boolean
          maximum_file_count?: number | null
          maximum_file_size_mb?: number | null
          media_alt_text_required?: boolean
          media_caption_field?: string | null
          minimum_file_count?: number | null
          multiple_file_upload_enabled?: boolean
          reference_id?: string
          rich_text_content_block?: string | null
          updated_at?: string
          updated_by?: string | null
          upload_failure_message?: string | null
          upload_progress_display?: string | null
          video_upload_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_file_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_file_configs_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_file_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_logic_rules: {
        Row: {
          all_conditions_required_flag: boolean
          any_conditions_required_flag: boolean
          branch_completion_message: string | null
          branch_label: string | null
          branch_path_id: string | null
          branch_priority: string | null
          branch_sort_order: number | null
          clear_value_action: string | null
          condition_action_type: string | null
          condition_active_flag: boolean
          condition_audit_enabled: boolean
          condition_compare_field_id: string | null
          condition_compare_value: string | null
          condition_description: string | null
          condition_end_date: string | null
          condition_evaluation_mode: string | null
          condition_group_id: string | null
          condition_name: string | null
          condition_operator: string | null
          condition_source_field_id: string | null
          condition_start_date: string | null
          condition_type: string | null
          conditional_calculation_rule: string | null
          conditional_document_rule: string | null
          conditional_logic_enabled: boolean
          conditional_notification_rule: string | null
          conditional_option_filtering: string | null
          conditional_repeater_visibility: string | null
          conditional_section_visibility: string | null
          conditional_security_rule: string | null
          conditional_submit_button_text: string | null
          conditional_validation_rule: string | null
          conditional_workflow_rule: string | null
          created_at: string
          created_by: string | null
          disable_field_action: string | null
          end_form_action: string | null
          form_id: string
          hide_field_action: string | null
          id: string
          jump_to_page_action: string | null
          nested_condition_json: Json | null
          reference_id: string
          require_field_action: string | null
          set_value_action: string | null
          show_field_action: string | null
          skip_page_action: string | null
          target_field_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          all_conditions_required_flag?: boolean
          any_conditions_required_flag?: boolean
          branch_completion_message?: string | null
          branch_label?: string | null
          branch_path_id?: string | null
          branch_priority?: string | null
          branch_sort_order?: number | null
          clear_value_action?: string | null
          condition_action_type?: string | null
          condition_active_flag?: boolean
          condition_audit_enabled?: boolean
          condition_compare_field_id?: string | null
          condition_compare_value?: string | null
          condition_description?: string | null
          condition_end_date?: string | null
          condition_evaluation_mode?: string | null
          condition_group_id?: string | null
          condition_name?: string | null
          condition_operator?: string | null
          condition_source_field_id?: string | null
          condition_start_date?: string | null
          condition_type?: string | null
          conditional_calculation_rule?: string | null
          conditional_document_rule?: string | null
          conditional_logic_enabled?: boolean
          conditional_notification_rule?: string | null
          conditional_option_filtering?: string | null
          conditional_repeater_visibility?: string | null
          conditional_section_visibility?: string | null
          conditional_security_rule?: string | null
          conditional_submit_button_text?: string | null
          conditional_validation_rule?: string | null
          conditional_workflow_rule?: string | null
          created_at?: string
          created_by?: string | null
          disable_field_action?: string | null
          end_form_action?: string | null
          form_id: string
          hide_field_action?: string | null
          id?: string
          jump_to_page_action?: string | null
          nested_condition_json?: Json | null
          reference_id: string
          require_field_action?: string | null
          set_value_action?: string | null
          show_field_action?: string | null
          skip_page_action?: string | null
          target_field_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          all_conditions_required_flag?: boolean
          any_conditions_required_flag?: boolean
          branch_completion_message?: string | null
          branch_label?: string | null
          branch_path_id?: string | null
          branch_priority?: string | null
          branch_sort_order?: number | null
          clear_value_action?: string | null
          condition_action_type?: string | null
          condition_active_flag?: boolean
          condition_audit_enabled?: boolean
          condition_compare_field_id?: string | null
          condition_compare_value?: string | null
          condition_description?: string | null
          condition_end_date?: string | null
          condition_evaluation_mode?: string | null
          condition_group_id?: string | null
          condition_name?: string | null
          condition_operator?: string | null
          condition_source_field_id?: string | null
          condition_start_date?: string | null
          condition_type?: string | null
          conditional_calculation_rule?: string | null
          conditional_document_rule?: string | null
          conditional_logic_enabled?: boolean
          conditional_notification_rule?: string | null
          conditional_option_filtering?: string | null
          conditional_repeater_visibility?: string | null
          conditional_section_visibility?: string | null
          conditional_security_rule?: string | null
          conditional_submit_button_text?: string | null
          conditional_validation_rule?: string | null
          conditional_workflow_rule?: string | null
          created_at?: string
          created_by?: string | null
          disable_field_action?: string | null
          end_form_action?: string | null
          form_id?: string
          hide_field_action?: string | null
          id?: string
          jump_to_page_action?: string | null
          nested_condition_json?: Json | null
          reference_id?: string
          require_field_action?: string | null
          set_value_action?: string | null
          show_field_action?: string | null
          skip_page_action?: string | null
          target_field_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_logic_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_logic_rules_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_logic_rules_target_field_id_fkey"
            columns: ["target_field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_logic_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_lookups: {
        Row: {
          cascading_lookup_child_field_id: string | null
          cascading_lookup_parent_field_id: string | null
          company_data_source: string | null
          created_at: string
          created_by: string | null
          data_source_auth_method: string | null
          data_source_mapping_json: Json | null
          data_source_parameters: string | null
          data_source_query: string | null
          department_data_source: string | null
          dependent_lookup_rule: string | null
          employee_data_source: string | null
          external_data_source_id: string | null
          field_id: string
          id: string
          location_data_source: string | null
          lookup_cache_duration: string | null
          lookup_cache_enabled: boolean
          lookup_data_quality_rule: string | null
          lookup_default_selection_rule: string | null
          lookup_display_field: string | null
          lookup_empty_state_message: string | null
          lookup_failure_behavior: string | null
          lookup_filter_rule: string | null
          lookup_last_synced_at: string | null
          lookup_multi_select_enabled: boolean
          lookup_option_label_template: string | null
          lookup_option_limit: number | null
          lookup_permission_rule: string | null
          lookup_refresh_trigger: string | null
          lookup_search_enabled: boolean
          lookup_sort_rule: string | null
          lookup_source_api: string | null
          lookup_source_table: string | null
          lookup_source_type: string | null
          lookup_source_url: string | null
          lookup_source_view: string | null
          lookup_sync_status: string | null
          lookup_value_field: string | null
          prepopulation_rule: string | null
          prepopulation_source: string | null
          reference_entity_id: string | null
          reference_entity_type: string | null
          reference_id: string
          updated_at: string
          updated_by: string | null
          user_profile_data_source: string | null
        }
        Insert: {
          cascading_lookup_child_field_id?: string | null
          cascading_lookup_parent_field_id?: string | null
          company_data_source?: string | null
          created_at?: string
          created_by?: string | null
          data_source_auth_method?: string | null
          data_source_mapping_json?: Json | null
          data_source_parameters?: string | null
          data_source_query?: string | null
          department_data_source?: string | null
          dependent_lookup_rule?: string | null
          employee_data_source?: string | null
          external_data_source_id?: string | null
          field_id: string
          id?: string
          location_data_source?: string | null
          lookup_cache_duration?: string | null
          lookup_cache_enabled?: boolean
          lookup_data_quality_rule?: string | null
          lookup_default_selection_rule?: string | null
          lookup_display_field?: string | null
          lookup_empty_state_message?: string | null
          lookup_failure_behavior?: string | null
          lookup_filter_rule?: string | null
          lookup_last_synced_at?: string | null
          lookup_multi_select_enabled?: boolean
          lookup_option_label_template?: string | null
          lookup_option_limit?: number | null
          lookup_permission_rule?: string | null
          lookup_refresh_trigger?: string | null
          lookup_search_enabled?: boolean
          lookup_sort_rule?: string | null
          lookup_source_api?: string | null
          lookup_source_table?: string | null
          lookup_source_type?: string | null
          lookup_source_url?: string | null
          lookup_source_view?: string | null
          lookup_sync_status?: string | null
          lookup_value_field?: string | null
          prepopulation_rule?: string | null
          prepopulation_source?: string | null
          reference_entity_id?: string | null
          reference_entity_type?: string | null
          reference_id: string
          updated_at?: string
          updated_by?: string | null
          user_profile_data_source?: string | null
        }
        Update: {
          cascading_lookup_child_field_id?: string | null
          cascading_lookup_parent_field_id?: string | null
          company_data_source?: string | null
          created_at?: string
          created_by?: string | null
          data_source_auth_method?: string | null
          data_source_mapping_json?: Json | null
          data_source_parameters?: string | null
          data_source_query?: string | null
          department_data_source?: string | null
          dependent_lookup_rule?: string | null
          employee_data_source?: string | null
          external_data_source_id?: string | null
          field_id?: string
          id?: string
          location_data_source?: string | null
          lookup_cache_duration?: string | null
          lookup_cache_enabled?: boolean
          lookup_data_quality_rule?: string | null
          lookup_default_selection_rule?: string | null
          lookup_display_field?: string | null
          lookup_empty_state_message?: string | null
          lookup_failure_behavior?: string | null
          lookup_filter_rule?: string | null
          lookup_last_synced_at?: string | null
          lookup_multi_select_enabled?: boolean
          lookup_option_label_template?: string | null
          lookup_option_limit?: number | null
          lookup_permission_rule?: string | null
          lookup_refresh_trigger?: string | null
          lookup_search_enabled?: boolean
          lookup_sort_rule?: string | null
          lookup_source_api?: string | null
          lookup_source_table?: string | null
          lookup_source_type?: string | null
          lookup_source_url?: string | null
          lookup_source_view?: string | null
          lookup_sync_status?: string | null
          lookup_value_field?: string | null
          prepopulation_rule?: string | null
          prepopulation_source?: string | null
          reference_entity_id?: string | null
          reference_entity_type?: string | null
          reference_id?: string
          updated_at?: string
          updated_by?: string | null
          user_profile_data_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_lookups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_lookups_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_lookups_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_pages: {
        Row: {
          column_count: number | null
          created_at: string
          created_by: string | null
          current_page_index: number | null
          field_spacing: string | null
          form_alignment: string | null
          form_id: string
          form_width_max_pixels: number | null
          grid_layout_configuration: string | null
          help_text_position: string | null
          id: string
          label_position: string | null
          layout_density: string | null
          layout_theme: string | null
          layout_type: string | null
          layout_width: string | null
          mobile_layout_enabled: boolean
          multi_page_mode_enabled: boolean
          page_back_button_text: string | null
          page_break_enabled: boolean
          page_conditional_visibility_rule: string | null
          page_count: number | null
          page_description: string | null
          page_instructions: string | null
          page_next_button_text: string | null
          page_progress_label: string | null
          page_save_button_text: string | null
          page_sort_order: number | null
          page_submit_button_text: string | null
          page_title: string | null
          progress_bar_enabled: boolean
          progress_bar_type: string | null
          reference_id: string
          responsive_layout_enabled: boolean
          section_background_style: string | null
          section_border_style: string | null
          section_break_enabled: boolean
          section_collapsible_flag: boolean
          section_conditional_visibility_rule: string | null
          section_count: number | null
          section_description: string | null
          section_display_mode: string | null
          section_expanded_by_default: string | null
          section_instructions: string | null
          section_name: string | null
          section_repeatable_flag: boolean
          section_sort_order: number | null
          section_title: string | null
          single_page_mode_enabled: boolean
          sticky_footer_enabled: boolean
          sticky_header_enabled: boolean
          submit_gate_rule: Json | null
          updated_at: string
          updated_by: string | null
          wizard_mode_enabled: boolean
        }
        Insert: {
          column_count?: number | null
          created_at?: string
          created_by?: string | null
          current_page_index?: number | null
          field_spacing?: string | null
          form_alignment?: string | null
          form_id: string
          form_width_max_pixels?: number | null
          grid_layout_configuration?: string | null
          help_text_position?: string | null
          id?: string
          label_position?: string | null
          layout_density?: string | null
          layout_theme?: string | null
          layout_type?: string | null
          layout_width?: string | null
          mobile_layout_enabled?: boolean
          multi_page_mode_enabled?: boolean
          page_back_button_text?: string | null
          page_break_enabled?: boolean
          page_conditional_visibility_rule?: string | null
          page_count?: number | null
          page_description?: string | null
          page_instructions?: string | null
          page_next_button_text?: string | null
          page_progress_label?: string | null
          page_save_button_text?: string | null
          page_sort_order?: number | null
          page_submit_button_text?: string | null
          page_title?: string | null
          progress_bar_enabled?: boolean
          progress_bar_type?: string | null
          reference_id: string
          responsive_layout_enabled?: boolean
          section_background_style?: string | null
          section_border_style?: string | null
          section_break_enabled?: boolean
          section_collapsible_flag?: boolean
          section_conditional_visibility_rule?: string | null
          section_count?: number | null
          section_description?: string | null
          section_display_mode?: string | null
          section_expanded_by_default?: string | null
          section_instructions?: string | null
          section_name?: string | null
          section_repeatable_flag?: boolean
          section_sort_order?: number | null
          section_title?: string | null
          single_page_mode_enabled?: boolean
          sticky_footer_enabled?: boolean
          sticky_header_enabled?: boolean
          submit_gate_rule?: Json | null
          updated_at?: string
          updated_by?: string | null
          wizard_mode_enabled?: boolean
        }
        Update: {
          column_count?: number | null
          created_at?: string
          created_by?: string | null
          current_page_index?: number | null
          field_spacing?: string | null
          form_alignment?: string | null
          form_id?: string
          form_width_max_pixels?: number | null
          grid_layout_configuration?: string | null
          help_text_position?: string | null
          id?: string
          label_position?: string | null
          layout_density?: string | null
          layout_theme?: string | null
          layout_type?: string | null
          layout_width?: string | null
          mobile_layout_enabled?: boolean
          multi_page_mode_enabled?: boolean
          page_back_button_text?: string | null
          page_break_enabled?: boolean
          page_conditional_visibility_rule?: string | null
          page_count?: number | null
          page_description?: string | null
          page_instructions?: string | null
          page_next_button_text?: string | null
          page_progress_label?: string | null
          page_save_button_text?: string | null
          page_sort_order?: number | null
          page_submit_button_text?: string | null
          page_title?: string | null
          progress_bar_enabled?: boolean
          progress_bar_type?: string | null
          reference_id?: string
          responsive_layout_enabled?: boolean
          section_background_style?: string | null
          section_border_style?: string | null
          section_break_enabled?: boolean
          section_collapsible_flag?: boolean
          section_conditional_visibility_rule?: string | null
          section_count?: number | null
          section_description?: string | null
          section_display_mode?: string | null
          section_expanded_by_default?: string | null
          section_instructions?: string | null
          section_name?: string | null
          section_repeatable_flag?: boolean
          section_sort_order?: number | null
          section_title?: string | null
          single_page_mode_enabled?: boolean
          sticky_footer_enabled?: boolean
          sticky_header_enabled?: boolean
          submit_gate_rule?: Json | null
          updated_at?: string
          updated_by?: string | null
          wizard_mode_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_pages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_pages_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_public_access: {
        Row: {
          anonymous_submission_allowed: boolean
          authentication_method: string | null
          authentication_required: boolean
          bot_protection_enabled: boolean
          captcha_required: boolean
          cookie_consent_required: boolean
          created_at: string
          created_by: string | null
          embedded_domain_allowlist: string | null
          external_edit_after_submit_enabled: boolean
          external_privacy_notice_required: boolean
          external_save_and_resume_enabled: boolean
          external_terms_acceptance_required: boolean
          external_user_registration_allowed: boolean
          form_id: string
          guest_user_allowed: boolean
          hide_powered_by_flag: boolean
          id: string
          magic_link_enabled: boolean
          one_time_link_enabled: boolean
          portal_login_required: boolean
          public_access_audit_enabled: boolean
          public_branding_profile_id: string | null
          public_confirmation_page_url: string | null
          public_embed_code: string | null
          public_form_enabled: boolean
          public_form_indexing_allowed: boolean
          public_form_maintenance_mode: string | null
          public_form_password_hash: string | null
          public_form_password_required: boolean
          public_form_slug: string | null
          public_form_url: string | null
          public_link_active_flag: boolean
          public_link_expiration_date: string | null
          public_redirect_url: string | null
          rate_limit_enabled: boolean
          rate_limit_per_ip: string | null
          rate_limit_per_user: string | null
          reference_id: string
          sso_required: boolean
          submission_limit_count: number | null
          submission_limit_enabled: boolean
          submission_limit_window: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          anonymous_submission_allowed?: boolean
          authentication_method?: string | null
          authentication_required?: boolean
          bot_protection_enabled?: boolean
          captcha_required?: boolean
          cookie_consent_required?: boolean
          created_at?: string
          created_by?: string | null
          embedded_domain_allowlist?: string | null
          external_edit_after_submit_enabled?: boolean
          external_privacy_notice_required?: boolean
          external_save_and_resume_enabled?: boolean
          external_terms_acceptance_required?: boolean
          external_user_registration_allowed?: boolean
          form_id: string
          guest_user_allowed?: boolean
          hide_powered_by_flag?: boolean
          id?: string
          magic_link_enabled?: boolean
          one_time_link_enabled?: boolean
          portal_login_required?: boolean
          public_access_audit_enabled?: boolean
          public_branding_profile_id?: string | null
          public_confirmation_page_url?: string | null
          public_embed_code?: string | null
          public_form_enabled?: boolean
          public_form_indexing_allowed?: boolean
          public_form_maintenance_mode?: string | null
          public_form_password_hash?: string | null
          public_form_password_required?: boolean
          public_form_slug?: string | null
          public_form_url?: string | null
          public_link_active_flag?: boolean
          public_link_expiration_date?: string | null
          public_redirect_url?: string | null
          rate_limit_enabled?: boolean
          rate_limit_per_ip?: string | null
          rate_limit_per_user?: string | null
          reference_id: string
          sso_required?: boolean
          submission_limit_count?: number | null
          submission_limit_enabled?: boolean
          submission_limit_window?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          anonymous_submission_allowed?: boolean
          authentication_method?: string | null
          authentication_required?: boolean
          bot_protection_enabled?: boolean
          captcha_required?: boolean
          cookie_consent_required?: boolean
          created_at?: string
          created_by?: string | null
          embedded_domain_allowlist?: string | null
          external_edit_after_submit_enabled?: boolean
          external_privacy_notice_required?: boolean
          external_save_and_resume_enabled?: boolean
          external_terms_acceptance_required?: boolean
          external_user_registration_allowed?: boolean
          form_id?: string
          guest_user_allowed?: boolean
          hide_powered_by_flag?: boolean
          id?: string
          magic_link_enabled?: boolean
          one_time_link_enabled?: boolean
          portal_login_required?: boolean
          public_access_audit_enabled?: boolean
          public_branding_profile_id?: string | null
          public_confirmation_page_url?: string | null
          public_embed_code?: string | null
          public_form_enabled?: boolean
          public_form_indexing_allowed?: boolean
          public_form_maintenance_mode?: string | null
          public_form_password_hash?: string | null
          public_form_password_required?: boolean
          public_form_slug?: string | null
          public_form_url?: string | null
          public_link_active_flag?: boolean
          public_link_expiration_date?: string | null
          public_redirect_url?: string | null
          rate_limit_enabled?: boolean
          rate_limit_per_ip?: string | null
          rate_limit_per_user?: string | null
          reference_id?: string
          sso_required?: boolean
          submission_limit_count?: number | null
          submission_limit_enabled?: boolean
          submission_limit_window?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_public_access_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_public_access_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_public_access_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_repeaters: {
        Row: {
          child_record_entity_type: string | null
          child_record_mapping_rule: string | null
          child_repeater_id: string | null
          collection_delete_behavior: string | null
          collection_save_mode: string | null
          created_at: string
          created_by: string | null
          data_grid_enabled: boolean
          form_id: string
          grandchild_repeater_id: string | null
          grid_cell_formula_rule: string | null
          grid_cell_validation_rule: string | null
          grid_column_definitions: Json | null
          grid_footer_totals_enabled: boolean
          grid_row_limit: number | null
          id: string
          json_collection_path: string | null
          master_detail_collection_enabled: boolean
          matrix_cell_type: string | null
          matrix_cell_validation_rule: string | null
          matrix_column_definitions: Json | null
          matrix_enabled: boolean
          matrix_required_cells_rule: string | null
          matrix_row_definitions: Json | null
          matrix_score_rule: string | null
          matrix_total_rule: string | null
          nested_repeater_calculation_rule: string | null
          nested_repeater_depth_limit: number | null
          nested_repeater_enabled: boolean
          nested_repeater_storage_path: string | null
          nested_repeater_validation_rule: string | null
          parent_repeater_id: string | null
          reference_id: string
          repeating_row_auto_numbering: string | null
          repeating_row_clone_allowed: boolean
          repeating_row_conditional_visibility: string | null
          repeating_row_default_count: number | null
          repeating_row_delete_allowed: boolean
          repeating_row_enabled: boolean
          repeating_row_maximum_count: number | null
          repeating_row_minimum_count: number | null
          repeating_row_reorder_allowed: boolean
          repeating_row_summary_field: string | null
          repeating_row_total_calculation: string | null
          repeating_section_add_button_text: string | null
          repeating_section_collapse_per_row: string | null
          repeating_section_default_rows: number | null
          repeating_section_duplicate_button_text: string | null
          repeating_section_enabled: boolean
          repeating_section_id: string | null
          repeating_section_label: string | null
          repeating_section_maximum_rows: number | null
          repeating_section_minimum_rows: number | null
          repeating_section_numbering_enabled: boolean
          repeating_section_remove_button_text: string | null
          repeating_section_required_flag: boolean
          repeating_section_row_label_template: string | null
          repeating_section_sortable_flag: boolean
          repeating_section_storage_mode: string | null
          repeating_section_validation_mode: string | null
          repeating_table_add_row_text: string | null
          repeating_table_bulk_delete_enabled: boolean
          repeating_table_bulk_edit_enabled: boolean
          repeating_table_column_definitions: Json | null
          repeating_table_delete_row_text: string | null
          repeating_table_enabled: boolean
          repeating_table_export_enabled: boolean
          repeating_table_id: string | null
          repeating_table_import_enabled: boolean
          repeating_table_inline_edit_enabled: boolean
          repeating_table_name: string | null
          repeating_table_row_definitions: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          child_record_entity_type?: string | null
          child_record_mapping_rule?: string | null
          child_repeater_id?: string | null
          collection_delete_behavior?: string | null
          collection_save_mode?: string | null
          created_at?: string
          created_by?: string | null
          data_grid_enabled?: boolean
          form_id: string
          grandchild_repeater_id?: string | null
          grid_cell_formula_rule?: string | null
          grid_cell_validation_rule?: string | null
          grid_column_definitions?: Json | null
          grid_footer_totals_enabled?: boolean
          grid_row_limit?: number | null
          id?: string
          json_collection_path?: string | null
          master_detail_collection_enabled?: boolean
          matrix_cell_type?: string | null
          matrix_cell_validation_rule?: string | null
          matrix_column_definitions?: Json | null
          matrix_enabled?: boolean
          matrix_required_cells_rule?: string | null
          matrix_row_definitions?: Json | null
          matrix_score_rule?: string | null
          matrix_total_rule?: string | null
          nested_repeater_calculation_rule?: string | null
          nested_repeater_depth_limit?: number | null
          nested_repeater_enabled?: boolean
          nested_repeater_storage_path?: string | null
          nested_repeater_validation_rule?: string | null
          parent_repeater_id?: string | null
          reference_id: string
          repeating_row_auto_numbering?: string | null
          repeating_row_clone_allowed?: boolean
          repeating_row_conditional_visibility?: string | null
          repeating_row_default_count?: number | null
          repeating_row_delete_allowed?: boolean
          repeating_row_enabled?: boolean
          repeating_row_maximum_count?: number | null
          repeating_row_minimum_count?: number | null
          repeating_row_reorder_allowed?: boolean
          repeating_row_summary_field?: string | null
          repeating_row_total_calculation?: string | null
          repeating_section_add_button_text?: string | null
          repeating_section_collapse_per_row?: string | null
          repeating_section_default_rows?: number | null
          repeating_section_duplicate_button_text?: string | null
          repeating_section_enabled?: boolean
          repeating_section_id?: string | null
          repeating_section_label?: string | null
          repeating_section_maximum_rows?: number | null
          repeating_section_minimum_rows?: number | null
          repeating_section_numbering_enabled?: boolean
          repeating_section_remove_button_text?: string | null
          repeating_section_required_flag?: boolean
          repeating_section_row_label_template?: string | null
          repeating_section_sortable_flag?: boolean
          repeating_section_storage_mode?: string | null
          repeating_section_validation_mode?: string | null
          repeating_table_add_row_text?: string | null
          repeating_table_bulk_delete_enabled?: boolean
          repeating_table_bulk_edit_enabled?: boolean
          repeating_table_column_definitions?: Json | null
          repeating_table_delete_row_text?: string | null
          repeating_table_enabled?: boolean
          repeating_table_export_enabled?: boolean
          repeating_table_id?: string | null
          repeating_table_import_enabled?: boolean
          repeating_table_inline_edit_enabled?: boolean
          repeating_table_name?: string | null
          repeating_table_row_definitions?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          child_record_entity_type?: string | null
          child_record_mapping_rule?: string | null
          child_repeater_id?: string | null
          collection_delete_behavior?: string | null
          collection_save_mode?: string | null
          created_at?: string
          created_by?: string | null
          data_grid_enabled?: boolean
          form_id?: string
          grandchild_repeater_id?: string | null
          grid_cell_formula_rule?: string | null
          grid_cell_validation_rule?: string | null
          grid_column_definitions?: Json | null
          grid_footer_totals_enabled?: boolean
          grid_row_limit?: number | null
          id?: string
          json_collection_path?: string | null
          master_detail_collection_enabled?: boolean
          matrix_cell_type?: string | null
          matrix_cell_validation_rule?: string | null
          matrix_column_definitions?: Json | null
          matrix_enabled?: boolean
          matrix_required_cells_rule?: string | null
          matrix_row_definitions?: Json | null
          matrix_score_rule?: string | null
          matrix_total_rule?: string | null
          nested_repeater_calculation_rule?: string | null
          nested_repeater_depth_limit?: number | null
          nested_repeater_enabled?: boolean
          nested_repeater_storage_path?: string | null
          nested_repeater_validation_rule?: string | null
          parent_repeater_id?: string | null
          reference_id?: string
          repeating_row_auto_numbering?: string | null
          repeating_row_clone_allowed?: boolean
          repeating_row_conditional_visibility?: string | null
          repeating_row_default_count?: number | null
          repeating_row_delete_allowed?: boolean
          repeating_row_enabled?: boolean
          repeating_row_maximum_count?: number | null
          repeating_row_minimum_count?: number | null
          repeating_row_reorder_allowed?: boolean
          repeating_row_summary_field?: string | null
          repeating_row_total_calculation?: string | null
          repeating_section_add_button_text?: string | null
          repeating_section_collapse_per_row?: string | null
          repeating_section_default_rows?: number | null
          repeating_section_duplicate_button_text?: string | null
          repeating_section_enabled?: boolean
          repeating_section_id?: string | null
          repeating_section_label?: string | null
          repeating_section_maximum_rows?: number | null
          repeating_section_minimum_rows?: number | null
          repeating_section_numbering_enabled?: boolean
          repeating_section_remove_button_text?: string | null
          repeating_section_required_flag?: boolean
          repeating_section_row_label_template?: string | null
          repeating_section_sortable_flag?: boolean
          repeating_section_storage_mode?: string | null
          repeating_section_validation_mode?: string | null
          repeating_table_add_row_text?: string | null
          repeating_table_bulk_delete_enabled?: boolean
          repeating_table_bulk_edit_enabled?: boolean
          repeating_table_column_definitions?: Json | null
          repeating_table_delete_row_text?: string | null
          repeating_table_enabled?: boolean
          repeating_table_export_enabled?: boolean
          repeating_table_id?: string | null
          repeating_table_import_enabled?: boolean
          repeating_table_inline_edit_enabled?: boolean
          repeating_table_name?: string | null
          repeating_table_row_definitions?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_repeaters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_repeaters_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_repeaters_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_reporting_config: {
        Row: {
          abandonment_count: number | null
          analytics_snapshot_date: string | null
          approval_cycle_time: string | null
          average_completion_time: string | null
          browser_breakdown: string | null
          completion_count: number | null
          completion_trend: string | null
          conversion_rate: string | null
          created_at: string
          created_by: string | null
          dashboard_group: string | null
          dashboard_visible: string | null
          data_quality_score: number | null
          device_breakdown: string | null
          document_generation_count: number | null
          draft_count: number | null
          duplicate_submission_count: number | null
          error_rate: string | null
          export_count: number | null
          field_completion_rate: string | null
          fiscal_quarter: string | null
          fiscal_year: string | null
          form_health_score: number | null
          form_id: string
          form_usage_score: number | null
          id: string
          kpi_category: string | null
          location_breakdown: string | null
          median_completion_time: string | null
          metric_impact: string | null
          missing_required_data_count: number | null
          most_failed_field_id: string | null
          notification_delivery_rate: string | null
          page_drop_off_rate: string | null
          question_drop_off_rate: string | null
          reference_id: string
          report_category: string | null
          reportable_flag: boolean
          reporting_period: string | null
          sensitive_data_submission_count: number | null
          submission_count: number | null
          submission_trend: string | null
          submitter_type_breakdown: string | null
          task_generation_count: number | null
          updated_at: string
          updated_by: string | null
          validation_failure_count: number | null
          workflow_cycle_time: string | null
        }
        Insert: {
          abandonment_count?: number | null
          analytics_snapshot_date?: string | null
          approval_cycle_time?: string | null
          average_completion_time?: string | null
          browser_breakdown?: string | null
          completion_count?: number | null
          completion_trend?: string | null
          conversion_rate?: string | null
          created_at?: string
          created_by?: string | null
          dashboard_group?: string | null
          dashboard_visible?: string | null
          data_quality_score?: number | null
          device_breakdown?: string | null
          document_generation_count?: number | null
          draft_count?: number | null
          duplicate_submission_count?: number | null
          error_rate?: string | null
          export_count?: number | null
          field_completion_rate?: string | null
          fiscal_quarter?: string | null
          fiscal_year?: string | null
          form_health_score?: number | null
          form_id: string
          form_usage_score?: number | null
          id?: string
          kpi_category?: string | null
          location_breakdown?: string | null
          median_completion_time?: string | null
          metric_impact?: string | null
          missing_required_data_count?: number | null
          most_failed_field_id?: string | null
          notification_delivery_rate?: string | null
          page_drop_off_rate?: string | null
          question_drop_off_rate?: string | null
          reference_id: string
          report_category?: string | null
          reportable_flag?: boolean
          reporting_period?: string | null
          sensitive_data_submission_count?: number | null
          submission_count?: number | null
          submission_trend?: string | null
          submitter_type_breakdown?: string | null
          task_generation_count?: number | null
          updated_at?: string
          updated_by?: string | null
          validation_failure_count?: number | null
          workflow_cycle_time?: string | null
        }
        Update: {
          abandonment_count?: number | null
          analytics_snapshot_date?: string | null
          approval_cycle_time?: string | null
          average_completion_time?: string | null
          browser_breakdown?: string | null
          completion_count?: number | null
          completion_trend?: string | null
          conversion_rate?: string | null
          created_at?: string
          created_by?: string | null
          dashboard_group?: string | null
          dashboard_visible?: string | null
          data_quality_score?: number | null
          device_breakdown?: string | null
          document_generation_count?: number | null
          draft_count?: number | null
          duplicate_submission_count?: number | null
          error_rate?: string | null
          export_count?: number | null
          field_completion_rate?: string | null
          fiscal_quarter?: string | null
          fiscal_year?: string | null
          form_health_score?: number | null
          form_id?: string
          form_usage_score?: number | null
          id?: string
          kpi_category?: string | null
          location_breakdown?: string | null
          median_completion_time?: string | null
          metric_impact?: string | null
          missing_required_data_count?: number | null
          most_failed_field_id?: string | null
          notification_delivery_rate?: string | null
          page_drop_off_rate?: string | null
          question_drop_off_rate?: string | null
          reference_id?: string
          report_category?: string | null
          reportable_flag?: boolean
          reporting_period?: string | null
          sensitive_data_submission_count?: number | null
          submission_count?: number | null
          submission_trend?: string | null
          submitter_type_breakdown?: string | null
          task_generation_count?: number | null
          updated_at?: string
          updated_by?: string | null
          validation_failure_count?: number | null
          workflow_cycle_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_reporting_config_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_reporting_config_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_reporting_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_signatures: {
        Row: {
          acknowledgment_required: boolean
          acknowledgment_text: string | null
          attestation_checkbox_required: boolean
          attestation_required: boolean
          attestation_text: string | null
          consent_required: boolean
          consent_type: string | null
          consent_withdrawal_allowed: boolean
          counter_signature_required: boolean
          created_at: string
          created_by: string | null
          drawn_signature_allowed: boolean
          e_signature_envelope_id: string | null
          e_signature_template_id: string | null
          form_id: string
          id: string
          initials_field_id: string | null
          initials_required: boolean
          multiple_signers_enabled: boolean
          parent_guardian_signature_required: boolean
          policy_acknowledgment_required: boolean
          reference_id: string
          signature_audit_trail_enabled: boolean
          signature_capture_mode: string | null
          signature_certificate_required: boolean
          signature_completion_status: string | null
          signature_consent_text: string | null
          signature_decline_reason: string | null
          signature_disclosure_text: string | null
          signature_expiration_date: string | null
          signature_field_id: string | null
          signature_provider: string | null
          signature_reminder_enabled: boolean
          signature_required: boolean
          signature_type: string | null
          signer_email_field_id: string | null
          signer_ip_capture: string | null
          signer_name_field_id: string | null
          signer_order: number | null
          signer_role: string | null
          signer_timestamp_capture: string | null
          typed_signature_allowed: boolean
          updated_at: string
          updated_by: string | null
          uploaded_signature_allowed: boolean
          witness_signature_required: boolean
        }
        Insert: {
          acknowledgment_required?: boolean
          acknowledgment_text?: string | null
          attestation_checkbox_required?: boolean
          attestation_required?: boolean
          attestation_text?: string | null
          consent_required?: boolean
          consent_type?: string | null
          consent_withdrawal_allowed?: boolean
          counter_signature_required?: boolean
          created_at?: string
          created_by?: string | null
          drawn_signature_allowed?: boolean
          e_signature_envelope_id?: string | null
          e_signature_template_id?: string | null
          form_id: string
          id?: string
          initials_field_id?: string | null
          initials_required?: boolean
          multiple_signers_enabled?: boolean
          parent_guardian_signature_required?: boolean
          policy_acknowledgment_required?: boolean
          reference_id: string
          signature_audit_trail_enabled?: boolean
          signature_capture_mode?: string | null
          signature_certificate_required?: boolean
          signature_completion_status?: string | null
          signature_consent_text?: string | null
          signature_decline_reason?: string | null
          signature_disclosure_text?: string | null
          signature_expiration_date?: string | null
          signature_field_id?: string | null
          signature_provider?: string | null
          signature_reminder_enabled?: boolean
          signature_required?: boolean
          signature_type?: string | null
          signer_email_field_id?: string | null
          signer_ip_capture?: string | null
          signer_name_field_id?: string | null
          signer_order?: number | null
          signer_role?: string | null
          signer_timestamp_capture?: string | null
          typed_signature_allowed?: boolean
          updated_at?: string
          updated_by?: string | null
          uploaded_signature_allowed?: boolean
          witness_signature_required?: boolean
        }
        Update: {
          acknowledgment_required?: boolean
          acknowledgment_text?: string | null
          attestation_checkbox_required?: boolean
          attestation_required?: boolean
          attestation_text?: string | null
          consent_required?: boolean
          consent_type?: string | null
          consent_withdrawal_allowed?: boolean
          counter_signature_required?: boolean
          created_at?: string
          created_by?: string | null
          drawn_signature_allowed?: boolean
          e_signature_envelope_id?: string | null
          e_signature_template_id?: string | null
          form_id?: string
          id?: string
          initials_field_id?: string | null
          initials_required?: boolean
          multiple_signers_enabled?: boolean
          parent_guardian_signature_required?: boolean
          policy_acknowledgment_required?: boolean
          reference_id?: string
          signature_audit_trail_enabled?: boolean
          signature_capture_mode?: string | null
          signature_certificate_required?: boolean
          signature_completion_status?: string | null
          signature_consent_text?: string | null
          signature_decline_reason?: string | null
          signature_disclosure_text?: string | null
          signature_expiration_date?: string | null
          signature_field_id?: string | null
          signature_provider?: string | null
          signature_reminder_enabled?: boolean
          signature_required?: boolean
          signature_type?: string | null
          signer_email_field_id?: string | null
          signer_ip_capture?: string | null
          signer_name_field_id?: string | null
          signer_order?: number | null
          signer_role?: string | null
          signer_timestamp_capture?: string | null
          typed_signature_allowed?: boolean
          updated_at?: string
          updated_by?: string | null
          uploaded_signature_allowed?: boolean
          witness_signature_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_signatures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_signatures_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_signatures_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submission_attachments: {
        Row: {
          drive_file_id: string
          field_id: string
          file_name: string
          file_size_bytes: number
          id: string
          mime_type: string
          submission_id: string
          uploaded_at: string
        }
        Insert: {
          drive_file_id: string
          field_id: string
          file_name: string
          file_size_bytes: number
          id?: string
          mime_type: string
          submission_id: string
          uploaded_at?: string
        }
        Update: {
          drive_file_id?: string
          field_id?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          submission_id?: string
          uploaded_at?: string
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
          created_at: string
          field_id: string
          field_value: Json | null
          id: string
          submission_id: string
        }
        Insert: {
          created_at?: string
          field_id: string
          field_value?: Json | null
          id?: string
          submission_id: string
        }
        Update: {
          created_at?: string
          field_id?: string
          field_value?: Json | null
          id?: string
          submission_id?: string
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
          autosave_enabled: boolean
          autosave_interval_seconds: number | null
          company_id: string
          correction_reason: string | null
          created_at: string
          created_by: string | null
          draft_expiration_date: string | null
          draft_save_enabled: boolean
          draft_status: string | null
          draft_uuid: string | null
          duplicate_submission_detected_flag: boolean
          duplicate_submission_rule: string | null
          edit_after_submit_allowed: boolean
          edit_window_minutes: number | null
          employee_file_category: string | null
          employee_file_person_id: string | null
          employee_file_user_id: string | null
          esignature_request_id: string | null
          form_id: string
          id: string
          is_draft: boolean
          partial_submission_allowed: boolean
          reference_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          related_submission_id: string | null
          resume_submission_link: string | null
          sensitivity_level: string
          status: string
          submission_archive_flag: boolean
          submission_completed_at: string | null
          submission_correction_flag: boolean
          submission_data_json: Json | null
          submission_device_type: string | null
          submission_duration_minutes: number | null
          submission_error_count: number | null
          submission_export_status: string | null
          submission_ip_address: string | null
          submission_location: string | null
          submission_lock_flag: boolean
          submission_lock_reason: string | null
          submission_number: string | null
          submission_parent_id: string | null
          submission_quality_score: number | null
          submission_response_count: number | null
          submission_review_status: string | null
          submission_source: string | null
          submission_started_at: string | null
          submission_sync_status: string | null
          submission_type: string | null
          submission_user_agent: string | null
          submission_version_number: string | null
          submission_void_flag: boolean
          submitted_at: string | null
          submitted_by: string | null
          submitted_for: string | null
          submitter_id: string
          task_id: string | null
          updated_at: string
          updated_by: string | null
          void_reason: string | null
        }
        Insert: {
          autosave_enabled?: boolean
          autosave_interval_seconds?: number | null
          company_id: string
          correction_reason?: string | null
          created_at?: string
          created_by?: string | null
          draft_expiration_date?: string | null
          draft_save_enabled?: boolean
          draft_status?: string | null
          draft_uuid?: string | null
          duplicate_submission_detected_flag?: boolean
          duplicate_submission_rule?: string | null
          edit_after_submit_allowed?: boolean
          edit_window_minutes?: number | null
          employee_file_category?: string | null
          employee_file_person_id?: string | null
          employee_file_user_id?: string | null
          esignature_request_id?: string | null
          form_id: string
          id?: string
          is_draft?: boolean
          partial_submission_allowed?: boolean
          reference_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          related_submission_id?: string | null
          resume_submission_link?: string | null
          sensitivity_level?: string
          status?: string
          submission_archive_flag?: boolean
          submission_completed_at?: string | null
          submission_correction_flag?: boolean
          submission_data_json?: Json | null
          submission_device_type?: string | null
          submission_duration_minutes?: number | null
          submission_error_count?: number | null
          submission_export_status?: string | null
          submission_ip_address?: string | null
          submission_location?: string | null
          submission_lock_flag?: boolean
          submission_lock_reason?: string | null
          submission_number?: string | null
          submission_parent_id?: string | null
          submission_quality_score?: number | null
          submission_response_count?: number | null
          submission_review_status?: string | null
          submission_source?: string | null
          submission_started_at?: string | null
          submission_sync_status?: string | null
          submission_type?: string | null
          submission_user_agent?: string | null
          submission_version_number?: string | null
          submission_void_flag?: boolean
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_for?: string | null
          submitter_id: string
          task_id?: string | null
          updated_at?: string
          updated_by?: string | null
          void_reason?: string | null
        }
        Update: {
          autosave_enabled?: boolean
          autosave_interval_seconds?: number | null
          company_id?: string
          correction_reason?: string | null
          created_at?: string
          created_by?: string | null
          draft_expiration_date?: string | null
          draft_save_enabled?: boolean
          draft_status?: string | null
          draft_uuid?: string | null
          duplicate_submission_detected_flag?: boolean
          duplicate_submission_rule?: string | null
          edit_after_submit_allowed?: boolean
          edit_window_minutes?: number | null
          employee_file_category?: string | null
          employee_file_person_id?: string | null
          employee_file_user_id?: string | null
          esignature_request_id?: string | null
          form_id?: string
          id?: string
          is_draft?: boolean
          partial_submission_allowed?: boolean
          reference_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          related_submission_id?: string | null
          resume_submission_link?: string | null
          sensitivity_level?: string
          status?: string
          submission_archive_flag?: boolean
          submission_completed_at?: string | null
          submission_correction_flag?: boolean
          submission_data_json?: Json | null
          submission_device_type?: string | null
          submission_duration_minutes?: number | null
          submission_error_count?: number | null
          submission_export_status?: string | null
          submission_ip_address?: string | null
          submission_location?: string | null
          submission_lock_flag?: boolean
          submission_lock_reason?: string | null
          submission_number?: string | null
          submission_parent_id?: string | null
          submission_quality_score?: number | null
          submission_response_count?: number | null
          submission_review_status?: string | null
          submission_source?: string | null
          submission_started_at?: string | null
          submission_sync_status?: string | null
          submission_type?: string | null
          submission_user_agent?: string | null
          submission_version_number?: string | null
          submission_void_flag?: boolean
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_for?: string | null
          submitter_id?: string
          task_id?: string | null
          updated_at?: string
          updated_by?: string | null
          void_reason?: string | null
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
            foreignKeyName: "form_submissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_employee_file_person_id_fkey"
            columns: ["employee_file_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_employee_file_user_id_fkey"
            columns: ["employee_file_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_esignature_request_id_fkey"
            columns: ["esignature_request_id"]
            isOneToOne: false
            referencedRelation: "esignature_requests"
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
          {
            foreignKeyName: "form_submissions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          component_library_id: string | null
          created_at: string
          created_by: string | null
          id: string
          reference_id: string
          reusable_document_template_ids: string | null
          reusable_field_ids: string | null
          reusable_notification_ids: string | null
          reusable_rule_ids: string | null
          reusable_section_ids: string | null
          reusable_validation_rule_ids: string | null
          reusable_workflow_ids: string | null
          system_template_flag: boolean
          template_active_flag: boolean
          template_approval_required: boolean
          template_approved_by: string | null
          template_approved_date: string | null
          template_category: string | null
          template_change_notes: string | null
          template_clone_source_id: string | null
          template_default_flag: boolean
          template_dependency_map: string | null
          template_description: string | null
          template_global_flag: boolean
          template_instructions: string | null
          template_locked_flag: boolean
          template_migration_notes: string | null
          template_name: string | null
          template_number: string | null
          template_owner: string | null
          template_preview_url: string | null
          template_published_date: string | null
          template_retired_date: string | null
          template_reusable_flag: boolean
          template_search_text: string | null
          template_source: string | null
          template_status: string | null
          template_subcategory: string | null
          template_tags: string | null
          template_thumbnail_url: string | null
          template_usage_count: number | null
          template_version: string | null
          tenant_template_flag: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          component_library_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          reference_id: string
          reusable_document_template_ids?: string | null
          reusable_field_ids?: string | null
          reusable_notification_ids?: string | null
          reusable_rule_ids?: string | null
          reusable_section_ids?: string | null
          reusable_validation_rule_ids?: string | null
          reusable_workflow_ids?: string | null
          system_template_flag?: boolean
          template_active_flag?: boolean
          template_approval_required?: boolean
          template_approved_by?: string | null
          template_approved_date?: string | null
          template_category?: string | null
          template_change_notes?: string | null
          template_clone_source_id?: string | null
          template_default_flag?: boolean
          template_dependency_map?: string | null
          template_description?: string | null
          template_global_flag?: boolean
          template_instructions?: string | null
          template_locked_flag?: boolean
          template_migration_notes?: string | null
          template_name?: string | null
          template_number?: string | null
          template_owner?: string | null
          template_preview_url?: string | null
          template_published_date?: string | null
          template_retired_date?: string | null
          template_reusable_flag?: boolean
          template_search_text?: string | null
          template_source?: string | null
          template_status?: string | null
          template_subcategory?: string | null
          template_tags?: string | null
          template_thumbnail_url?: string | null
          template_usage_count?: number | null
          template_version?: string | null
          tenant_template_flag?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          component_library_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          reference_id?: string
          reusable_document_template_ids?: string | null
          reusable_field_ids?: string | null
          reusable_notification_ids?: string | null
          reusable_rule_ids?: string | null
          reusable_section_ids?: string | null
          reusable_validation_rule_ids?: string | null
          reusable_workflow_ids?: string | null
          system_template_flag?: boolean
          template_active_flag?: boolean
          template_approval_required?: boolean
          template_approved_by?: string | null
          template_approved_date?: string | null
          template_category?: string | null
          template_change_notes?: string | null
          template_clone_source_id?: string | null
          template_default_flag?: boolean
          template_dependency_map?: string | null
          template_description?: string | null
          template_global_flag?: boolean
          template_instructions?: string | null
          template_locked_flag?: boolean
          template_migration_notes?: string | null
          template_name?: string | null
          template_number?: string | null
          template_owner?: string | null
          template_preview_url?: string | null
          template_published_date?: string | null
          template_retired_date?: string | null
          template_reusable_flag?: boolean
          template_search_text?: string | null
          template_source?: string | null
          template_status?: string | null
          template_subcategory?: string | null
          template_tags?: string | null
          template_thumbnail_url?: string | null
          template_usage_count?: number | null
          template_version?: string | null
          tenant_template_flag?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_tenant_configs: {
        Row: {
          allowed_field_types: string | null
          allowed_file_extensions: string | null
          brand_logo_url: string | null
          company_id: string
          created_at: string
          created_by: string | null
          custom_domain_enabled: boolean
          custom_domain_url: string | null
          default_approval_workflow: string | null
          default_authentication_requirement: string | null
          default_branding_profile: string | null
          default_confirmation_message: string | null
          default_currency: string | null
          default_date_format: string | null
          default_document_template: string | null
          default_field_required_indicator: string | null
          default_form_language: string | null
          default_form_theme: string | null
          default_notification_template: string | null
          default_number_format: string | null
          default_public_form_setting: string | null
          default_save_draft_setting: string | null
          default_task_template: string | null
          default_time_format: string | null
          default_timezone: string | null
          default_validation_mode: string | null
          disabled_field_types: string | null
          id: string
          maximum_fields_per_form: string | null
          maximum_file_size_mb: number | null
          maximum_forms_per_tenant: string | null
          maximum_pages_per_form: string | null
          maximum_repeat_rows: number | null
          maximum_sections_per_form: string | null
          reference_id: string
          tenant_api_policy: string | null
          tenant_audit_policy: string | null
          tenant_beta_features_enabled: boolean
          tenant_component_library_enabled: boolean
          tenant_configuration_id: string | null
          tenant_custom_css: string | null
          tenant_custom_java_script: string | null
          tenant_export_policy: string | null
          tenant_feature_flags: string | null
          tenant_form_library_enabled: boolean
          tenant_lookup_library_enabled: boolean
          tenant_retention_policy: string | null
          tenant_rule_library_enabled: boolean
          tenant_security_policy: string | null
          tenant_template_library_enabled: boolean
          theme_color_primary: string | null
          theme_color_secondary: string | null
          updated_at: string
          updated_by: string | null
          white_label_enabled: boolean
        }
        Insert: {
          allowed_field_types?: string | null
          allowed_file_extensions?: string | null
          brand_logo_url?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          custom_domain_enabled?: boolean
          custom_domain_url?: string | null
          default_approval_workflow?: string | null
          default_authentication_requirement?: string | null
          default_branding_profile?: string | null
          default_confirmation_message?: string | null
          default_currency?: string | null
          default_date_format?: string | null
          default_document_template?: string | null
          default_field_required_indicator?: string | null
          default_form_language?: string | null
          default_form_theme?: string | null
          default_notification_template?: string | null
          default_number_format?: string | null
          default_public_form_setting?: string | null
          default_save_draft_setting?: string | null
          default_task_template?: string | null
          default_time_format?: string | null
          default_timezone?: string | null
          default_validation_mode?: string | null
          disabled_field_types?: string | null
          id?: string
          maximum_fields_per_form?: string | null
          maximum_file_size_mb?: number | null
          maximum_forms_per_tenant?: string | null
          maximum_pages_per_form?: string | null
          maximum_repeat_rows?: number | null
          maximum_sections_per_form?: string | null
          reference_id: string
          tenant_api_policy?: string | null
          tenant_audit_policy?: string | null
          tenant_beta_features_enabled?: boolean
          tenant_component_library_enabled?: boolean
          tenant_configuration_id?: string | null
          tenant_custom_css?: string | null
          tenant_custom_java_script?: string | null
          tenant_export_policy?: string | null
          tenant_feature_flags?: string | null
          tenant_form_library_enabled?: boolean
          tenant_lookup_library_enabled?: boolean
          tenant_retention_policy?: string | null
          tenant_rule_library_enabled?: boolean
          tenant_security_policy?: string | null
          tenant_template_library_enabled?: boolean
          theme_color_primary?: string | null
          theme_color_secondary?: string | null
          updated_at?: string
          updated_by?: string | null
          white_label_enabled?: boolean
        }
        Update: {
          allowed_field_types?: string | null
          allowed_file_extensions?: string | null
          brand_logo_url?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom_domain_enabled?: boolean
          custom_domain_url?: string | null
          default_approval_workflow?: string | null
          default_authentication_requirement?: string | null
          default_branding_profile?: string | null
          default_confirmation_message?: string | null
          default_currency?: string | null
          default_date_format?: string | null
          default_document_template?: string | null
          default_field_required_indicator?: string | null
          default_form_language?: string | null
          default_form_theme?: string | null
          default_notification_template?: string | null
          default_number_format?: string | null
          default_public_form_setting?: string | null
          default_save_draft_setting?: string | null
          default_task_template?: string | null
          default_time_format?: string | null
          default_timezone?: string | null
          default_validation_mode?: string | null
          disabled_field_types?: string | null
          id?: string
          maximum_fields_per_form?: string | null
          maximum_file_size_mb?: number | null
          maximum_forms_per_tenant?: string | null
          maximum_pages_per_form?: string | null
          maximum_repeat_rows?: number | null
          maximum_sections_per_form?: string | null
          reference_id?: string
          tenant_api_policy?: string | null
          tenant_audit_policy?: string | null
          tenant_beta_features_enabled?: boolean
          tenant_component_library_enabled?: boolean
          tenant_configuration_id?: string | null
          tenant_custom_css?: string | null
          tenant_custom_java_script?: string | null
          tenant_export_policy?: string | null
          tenant_feature_flags?: string | null
          tenant_form_library_enabled?: boolean
          tenant_lookup_library_enabled?: boolean
          tenant_retention_policy?: string | null
          tenant_rule_library_enabled?: boolean
          tenant_security_policy?: string | null
          tenant_template_library_enabled?: boolean
          theme_color_primary?: string | null
          theme_color_secondary?: string | null
          updated_at?: string
          updated_by?: string | null
          white_label_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "form_tenant_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_tenant_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_tenant_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_workflow_action_roles: {
        Row: {
          form_workflow_action_id: string
          id: string
          role_id: string
        }
        Insert: {
          form_workflow_action_id: string
          id?: string
          role_id: string
        }
        Update: {
          form_workflow_action_id?: string
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_workflow_action_roles_form_workflow_action_id_fkey"
            columns: ["form_workflow_action_id"]
            isOneToOne: false
            referencedRelation: "form_workflow_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_workflow_action_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_workflow_actions: {
        Row: {
          action_key: string | null
          company_id: string
          condition: string | null
          create_task: boolean
          created_at: string
          display_order: number
          form_id: string
          from_status_id: string | null
          id: string
          name: string | null
          reference_id: string
          send_email: boolean
          to_status_id: string | null
          trigger_event: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          action_key?: string | null
          company_id: string
          condition?: string | null
          create_task?: boolean
          created_at?: string
          display_order?: number
          form_id: string
          from_status_id?: string | null
          id?: string
          name?: string | null
          reference_id: string
          send_email?: boolean
          to_status_id?: string | null
          trigger_event: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          action_key?: string | null
          company_id?: string
          condition?: string | null
          create_task?: boolean
          created_at?: string
          display_order?: number
          form_id?: string
          from_status_id?: string | null
          id?: string
          name?: string | null
          reference_id?: string
          send_email?: boolean
          to_status_id?: string | null
          trigger_event?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_workflow_actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_workflow_actions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_workflow_webhook_deliveries: {
        Row: {
          attempts: number
          company_id: string
          created_at: string
          error_text: string | null
          form_id: string
          form_workflow_action_id: string
          id: string
          payload: Json
          provider_ref: string | null
          result: Json | null
          sent_at: string | null
          status: string
          submission_id: string
          target_url: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number
          company_id: string
          created_at?: string
          error_text?: string | null
          form_id: string
          form_workflow_action_id: string
          id?: string
          payload: Json
          provider_ref?: string | null
          result?: Json | null
          sent_at?: string | null
          status?: string
          submission_id: string
          target_url: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number
          company_id?: string
          created_at?: string
          error_text?: string | null
          form_id?: string
          form_workflow_action_id?: string
          id?: string
          payload?: Json
          provider_ref?: string | null
          result?: Json | null
          sent_at?: string | null
          status?: string
          submission_id?: string
          target_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_workflow_webhook_deliveries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_workflow_webhook_deliveries_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_workflow_webhook_deliveries_form_workflow_action_id_fkey"
            columns: ["form_workflow_action_id"]
            isOneToOne: false
            referencedRelation: "form_workflow_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_workflow_webhook_deliveries_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          audience_type: string | null
          business_critical_flag: boolean
          business_purpose: string | null
          business_sponsor: string | null
          client_facing_flag: boolean
          company_id: string
          completion_instructions: string | null
          compliance_impact_flag: boolean
          confidentiality_level: string | null
          confirmation_message: string | null
          created_at: string
          created_by: string | null
          data_collection_purpose: string | null
          data_sensitivity_level: string | null
          data_steward: string | null
          default_back_button_text: string | null
          default_cancel_button_text: string | null
          default_next_button_text: string | null
          default_save_button_text: string | null
          default_submit_button_text: string | null
          description: string | null
          employee_facing_flag: boolean
          employee_file_category: string | null
          esignature_document_template_id: string | null
          estimated_completion_time_minutes: number | null
          external_dependency_flag: boolean
          external_reference_number: string | null
          file_collection_flag: boolean
          financial_impact_flag: boolean
          form_branding_profile_id: string | null
          form_category: string | null
          form_color: string | null
          form_complexity: string | null
          form_icon: string | null
          form_keywords: string | null
          form_label: string | null
          form_language: string | null
          form_number: string | null
          form_owner: string | null
          form_prefix: string | null
          form_priority: string | null
          form_source: string | null
          form_subcategory: string | null
          form_summary: string | null
          form_tags: string | null
          form_title: string | null
          form_type: string | null
          hr_discipline: string | null
          hr_module: string | null
          hr_submodule: string | null
          id: string
          instructions: string | null
          internal_description: string | null
          internal_only_flag: boolean
          internal_process_owner: string | null
          legacy_form_id: string | null
          legal_sensitivity: string | null
          lifecycle_category: string | null
          name: string
          operational_impact_flag: boolean
          outcome_type: string | null
          payment_collection_flag: boolean
          phi_collection_flag: boolean
          pii_collection_flag: boolean
          previous_version_id: string | null
          priority_reason: string | null
          process_category: string | null
          public_description: string | null
          public_facing_flag: boolean
          published_at: string | null
          published_by: string | null
          record_impact_type: string | null
          reference_id: string
          regulatory_category: string | null
          requires_esignature: boolean
          risk_level: string | null
          risk_score: number | null
          sensitivity_level: string
          short_title: string | null
          signature_collection_flag: boolean
          source_reference: string | null
          source_system: string | null
          status: string
          submission_frequency_type: string | null
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
          use_case_type: string | null
          version: number
        }
        Insert: {
          audience_type?: string | null
          business_critical_flag?: boolean
          business_purpose?: string | null
          business_sponsor?: string | null
          client_facing_flag?: boolean
          company_id: string
          completion_instructions?: string | null
          compliance_impact_flag?: boolean
          confidentiality_level?: string | null
          confirmation_message?: string | null
          created_at?: string
          created_by?: string | null
          data_collection_purpose?: string | null
          data_sensitivity_level?: string | null
          data_steward?: string | null
          default_back_button_text?: string | null
          default_cancel_button_text?: string | null
          default_next_button_text?: string | null
          default_save_button_text?: string | null
          default_submit_button_text?: string | null
          description?: string | null
          employee_facing_flag?: boolean
          employee_file_category?: string | null
          esignature_document_template_id?: string | null
          estimated_completion_time_minutes?: number | null
          external_dependency_flag?: boolean
          external_reference_number?: string | null
          file_collection_flag?: boolean
          financial_impact_flag?: boolean
          form_branding_profile_id?: string | null
          form_category?: string | null
          form_color?: string | null
          form_complexity?: string | null
          form_icon?: string | null
          form_keywords?: string | null
          form_label?: string | null
          form_language?: string | null
          form_number?: string | null
          form_owner?: string | null
          form_prefix?: string | null
          form_priority?: string | null
          form_source?: string | null
          form_subcategory?: string | null
          form_summary?: string | null
          form_tags?: string | null
          form_title?: string | null
          form_type?: string | null
          hr_discipline?: string | null
          hr_module?: string | null
          hr_submodule?: string | null
          id?: string
          instructions?: string | null
          internal_description?: string | null
          internal_only_flag?: boolean
          internal_process_owner?: string | null
          legacy_form_id?: string | null
          legal_sensitivity?: string | null
          lifecycle_category?: string | null
          name: string
          operational_impact_flag?: boolean
          outcome_type?: string | null
          payment_collection_flag?: boolean
          phi_collection_flag?: boolean
          pii_collection_flag?: boolean
          previous_version_id?: string | null
          priority_reason?: string | null
          process_category?: string | null
          public_description?: string | null
          public_facing_flag?: boolean
          published_at?: string | null
          published_by?: string | null
          record_impact_type?: string | null
          reference_id: string
          regulatory_category?: string | null
          requires_esignature?: boolean
          risk_level?: string | null
          risk_score?: number | null
          sensitivity_level?: string
          short_title?: string | null
          signature_collection_flag?: boolean
          source_reference?: string | null
          source_system?: string | null
          status?: string
          submission_frequency_type?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          use_case_type?: string | null
          version?: number
        }
        Update: {
          audience_type?: string | null
          business_critical_flag?: boolean
          business_purpose?: string | null
          business_sponsor?: string | null
          client_facing_flag?: boolean
          company_id?: string
          completion_instructions?: string | null
          compliance_impact_flag?: boolean
          confidentiality_level?: string | null
          confirmation_message?: string | null
          created_at?: string
          created_by?: string | null
          data_collection_purpose?: string | null
          data_sensitivity_level?: string | null
          data_steward?: string | null
          default_back_button_text?: string | null
          default_cancel_button_text?: string | null
          default_next_button_text?: string | null
          default_save_button_text?: string | null
          default_submit_button_text?: string | null
          description?: string | null
          employee_facing_flag?: boolean
          employee_file_category?: string | null
          esignature_document_template_id?: string | null
          estimated_completion_time_minutes?: number | null
          external_dependency_flag?: boolean
          external_reference_number?: string | null
          file_collection_flag?: boolean
          financial_impact_flag?: boolean
          form_branding_profile_id?: string | null
          form_category?: string | null
          form_color?: string | null
          form_complexity?: string | null
          form_icon?: string | null
          form_keywords?: string | null
          form_label?: string | null
          form_language?: string | null
          form_number?: string | null
          form_owner?: string | null
          form_prefix?: string | null
          form_priority?: string | null
          form_source?: string | null
          form_subcategory?: string | null
          form_summary?: string | null
          form_tags?: string | null
          form_title?: string | null
          form_type?: string | null
          hr_discipline?: string | null
          hr_module?: string | null
          hr_submodule?: string | null
          id?: string
          instructions?: string | null
          internal_description?: string | null
          internal_only_flag?: boolean
          internal_process_owner?: string | null
          legacy_form_id?: string | null
          legal_sensitivity?: string | null
          lifecycle_category?: string | null
          name?: string
          operational_impact_flag?: boolean
          outcome_type?: string | null
          payment_collection_flag?: boolean
          phi_collection_flag?: boolean
          pii_collection_flag?: boolean
          previous_version_id?: string | null
          priority_reason?: string | null
          process_category?: string | null
          public_description?: string | null
          public_facing_flag?: boolean
          published_at?: string | null
          published_by?: string | null
          record_impact_type?: string | null
          reference_id?: string
          regulatory_category?: string | null
          requires_esignature?: boolean
          risk_level?: string | null
          risk_score?: number | null
          sensitivity_level?: string
          short_title?: string | null
          signature_collection_flag?: boolean
          source_reference?: string | null
          source_system?: string | null
          status?: string
          submission_frequency_type?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          use_case_type?: string | null
          version?: number
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
            foreignKeyName: "forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_esignature_document_template_id_fkey"
            columns: ["esignature_document_template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
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
          {
            foreignKeyName: "forms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      handbook_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          assigned_at: string | null
          assigned_by: string | null
          esignature_request_id: string | null
          handbook_version_id: string
          id: string
          person_id: string
          reference_id: string
          status: string
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          esignature_request_id?: string | null
          handbook_version_id: string
          id?: string
          person_id: string
          reference_id: string
          status?: string
        }
        Update: {
          acknowledged_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          esignature_request_id?: string | null
          handbook_version_id?: string
          id?: string
          person_id?: string
          reference_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "handbook_acknowledgments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbook_acknowledgments_esignature_request_id_fkey"
            columns: ["esignature_request_id"]
            isOneToOne: false
            referencedRelation: "esignature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbook_acknowledgments_handbook_version_id_fkey"
            columns: ["handbook_version_id"]
            isOneToOne: false
            referencedRelation: "handbook_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbook_acknowledgments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      handbook_section_selections: {
        Row: {
          created_at: string | null
          handbook_id: string
          id: string
          included: boolean
          section_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          handbook_id: string
          id?: string
          included?: boolean
          section_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          handbook_id?: string
          id?: string
          included?: boolean
          section_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "handbook_section_selections_handbook_id_fkey"
            columns: ["handbook_id"]
            isOneToOne: false
            referencedRelation: "handbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbook_section_selections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "handbook_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      handbook_sections: {
        Row: {
          body_placeholder: string
          company_id: string | null
          created_at: string | null
          handbook_type: string
          id: string
          is_active: boolean
          is_required: boolean
          jurisdiction: string
          section_key: string
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          body_placeholder?: string
          company_id?: string | null
          created_at?: string | null
          handbook_type: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          jurisdiction: string
          section_key: string
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          body_placeholder?: string
          company_id?: string | null
          created_at?: string | null
          handbook_type?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          jurisdiction?: string
          section_key?: string
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handbook_sections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      handbook_versions: {
        Row: {
          assembled_content: Json
          content_hash: string
          document_generation_id: string | null
          effective_date: string | null
          handbook_id: string
          id: string
          published_at: string
          published_by: string
          reference_id: string
          version_number: number
        }
        Insert: {
          assembled_content: Json
          content_hash: string
          document_generation_id?: string | null
          effective_date?: string | null
          handbook_id: string
          id?: string
          published_at?: string
          published_by: string
          reference_id: string
          version_number: number
        }
        Update: {
          assembled_content?: Json
          content_hash?: string
          document_generation_id?: string | null
          effective_date?: string | null
          handbook_id?: string
          id?: string
          published_at?: string
          published_by?: string
          reference_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "handbook_versions_document_generation_id_fkey"
            columns: ["document_generation_id"]
            isOneToOne: false
            referencedRelation: "document_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbook_versions_handbook_id_fkey"
            columns: ["handbook_id"]
            isOneToOne: false
            referencedRelation: "handbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbook_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      handbooks: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          current_version_id: string | null
          effective_date: string | null
          handbook_type: string
          id: string
          jurisdictions: string[]
          reference_id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          current_version_id?: string | null
          effective_date?: string | null
          handbook_type: string
          id?: string
          jurisdictions?: string[]
          reference_id: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          current_version_id?: string | null
          effective_date?: string | null
          handbook_type?: string
          id?: string
          jurisdictions?: string[]
          reference_id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handbooks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handbooks_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "handbook_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_guide_items: {
        Row: {
          competency_id: string | null
          created_at: string | null
          custom_question_text: string | null
          guide_id: string
          id: string
          question_id: string | null
          response_type: string
          sort_order: number
          source: string
        }
        Insert: {
          competency_id?: string | null
          created_at?: string | null
          custom_question_text?: string | null
          guide_id: string
          id?: string
          question_id?: string | null
          response_type?: string
          sort_order?: number
          source?: string
        }
        Update: {
          competency_id?: string | null
          created_at?: string | null
          custom_question_text?: string | null
          guide_id?: string
          id?: string
          question_id?: string | null
          response_type?: string
          sort_order?: number
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_guide_items_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guide_items_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "interview_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guide_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_guides: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          requisition_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          requisition_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          requisition_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_guides_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_guides_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "recruiting_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_question_categories: {
        Row: {
          category_key: string
          category_name: string
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          category_key: string
          category_name: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          category_key?: string
          category_name?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_question_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          category_id: string | null
          company_id: string | null
          competency_id: string | null
          compliance_guidance: string | null
          compliance_status: string
          created_at: string | null
          guidance: string | null
          id: string
          is_active: boolean
          question_key: string
          question_text: string
          response_type: string
          scope: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          company_id?: string | null
          competency_id?: string | null
          compliance_guidance?: string | null
          compliance_status?: string
          created_at?: string | null
          guidance?: string | null
          id?: string
          is_active?: boolean
          question_key: string
          question_text: string
          response_type?: string
          scope?: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          company_id?: string | null
          competency_id?: string | null
          compliance_guidance?: string | null
          compliance_status?: string
          created_at?: string | null
          guidance?: string | null
          id?: string
          is_active?: boolean
          question_key?: string
          question_text?: string
          response_type?: string
          scope?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "interview_question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_responses: {
        Row: {
          competency_id: string | null
          created_at: string | null
          guide_item_id: string | null
          id: string
          interview_id: string
          question_text_snapshot: string
          rating: number | null
          response_bool: boolean | null
          response_text: string | null
          response_type: string
        }
        Insert: {
          competency_id?: string | null
          created_at?: string | null
          guide_item_id?: string | null
          id?: string
          interview_id: string
          question_text_snapshot: string
          rating?: number | null
          response_bool?: boolean | null
          response_text?: string | null
          response_type?: string
        }
        Update: {
          competency_id?: string | null
          created_at?: string | null
          guide_item_id?: string | null
          id?: string
          interview_id?: string
          question_text_snapshot?: string
          rating?: number | null
          response_bool?: boolean | null
          response_text?: string | null
          response_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_responses_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_responses_guide_item_id_fkey"
            columns: ["guide_item_id"]
            isOneToOne: false
            referencedRelation: "interview_guide_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_responses_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          company_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          guide_id: string | null
          id: string
          interview_type: string | null
          interviewer_person_id: string
          reference_id: string
          scheduled_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          application_id: string
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          guide_id?: string | null
          id?: string
          interview_type?: string | null
          interviewer_person_id: string
          reference_id: string
          scheduled_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          guide_id?: string | null
          id?: string
          interview_type?: string | null
          interviewer_person_id?: string
          reference_id?: string
          scheduled_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recruiting_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "interview_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_person_id_fkey"
            columns: ["interviewer_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_access_grants: {
        Row: {
          case_id: string
          created_at: string | null
          granted_by: string | null
          id: string
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_access_grants_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "investigation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_access_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_access_grants_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_access_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_cases: {
        Row: {
          allegation_ciphertext: string | null
          assigned_investigator_user_id: string | null
          case_type: string
          closed_at: string | null
          company_id: string
          confidentiality_level: string
          created_at: string | null
          created_by: string
          disposition: string | null
          finding_summary: string | null
          id: string
          opened_by: string
          reference_id: string
          severity: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          allegation_ciphertext?: string | null
          assigned_investigator_user_id?: string | null
          case_type: string
          closed_at?: string | null
          company_id: string
          confidentiality_level?: string
          created_at?: string | null
          created_by: string
          disposition?: string | null
          finding_summary?: string | null
          id?: string
          opened_by: string
          reference_id: string
          severity?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          allegation_ciphertext?: string | null
          assigned_investigator_user_id?: string | null
          case_type?: string
          closed_at?: string | null
          company_id?: string
          confidentiality_level?: string
          created_at?: string | null
          created_by?: string
          disposition?: string | null
          finding_summary?: string | null
          id?: string
          opened_by?: string
          reference_id?: string
          severity?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investigation_cases_assigned_investigator_user_id_fkey"
            columns: ["assigned_investigator_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_cases_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_parties: {
        Row: {
          case_id: string
          created_at: string | null
          created_by: string
          external_name: string | null
          id: string
          is_confidential: boolean
          party_role: string
          person_id: string | null
          reference_id: string
          statement_ciphertext: string | null
        }
        Insert: {
          case_id: string
          created_at?: string | null
          created_by: string
          external_name?: string | null
          id?: string
          is_confidential?: boolean
          party_role: string
          person_id?: string | null
          reference_id: string
          statement_ciphertext?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string | null
          created_by?: string
          external_name?: string | null
          id?: string
          is_confidential?: boolean
          party_role?: string
          person_id?: string | null
          reference_id?: string
          statement_ciphertext?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investigation_parties_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "investigation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_parties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigation_parties_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignments: {
        Row: {
          assignment_note: string | null
          company_id: string
          created_at: string | null
          created_by: string
          effective_from: string
          effective_to: string | null
          id: string
          job_id: string
          manager_person_id: string | null
          person_id: string
          updated_at: string | null
        }
        Insert: {
          assignment_note?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          effective_from: string
          effective_to?: string | null
          id?: string
          job_id: string
          manager_person_id?: string | null
          person_id: string
          updated_at?: string | null
        }
        Update: {
          assignment_note?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          job_id?: string
          manager_person_id?: string | null
          person_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_manager_person_id_fkey"
            columns: ["manager_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      job_description_competencies: {
        Row: {
          competency_id: string
          created_at: string | null
          description_id: string
          id: string
          sort_order: number
          weight: number | null
        }
        Insert: {
          competency_id: string
          created_at?: string | null
          description_id: string
          id?: string
          sort_order?: number
          weight?: number | null
        }
        Update: {
          competency_id?: string
          created_at?: string | null
          description_id?: string
          id?: string
          sort_order?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_description_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_description_competencies_description_id_fkey"
            columns: ["description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_description_functions: {
        Row: {
          created_at: string | null
          description_id: string
          function_text: string
          id: string
          is_essential: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          description_id: string
          function_text: string
          id?: string
          is_essential?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          description_id?: string
          function_text?: string
          id?: string
          is_essential?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_description_functions_description_id_fkey"
            columns: ["description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_description_qualifications: {
        Row: {
          created_at: string | null
          description_id: string
          id: string
          is_required: boolean
          qualification_text: string
          qualification_type: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          description_id: string
          id?: string
          is_required?: boolean
          qualification_text: string
          qualification_type: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          description_id?: string
          id?: string
          is_required?: boolean
          qualification_text?: string
          qualification_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_description_qualifications_description_id_fkey"
            columns: ["description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string | null
          created_by: string
          effective_from: string | null
          id: string
          job_id: string
          physical_requirements: string | null
          published_at: string | null
          published_by: string | null
          reference_id: string
          scope_of_role: string | null
          status: string
          summary: string | null
          supervisory_responsibility: string | null
          travel_requirement: string | null
          updated_at: string | null
          version_number: number
          work_environment: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          effective_from?: string | null
          id?: string
          job_id: string
          physical_requirements?: string | null
          published_at?: string | null
          published_by?: string | null
          reference_id: string
          scope_of_role?: string | null
          status?: string
          summary?: string | null
          supervisory_responsibility?: string | null
          travel_requirement?: string | null
          updated_at?: string | null
          version_number: number
          work_environment?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          effective_from?: string | null
          id?: string
          job_id?: string
          physical_requirements?: string | null
          published_at?: string | null
          published_by?: string | null
          reference_id?: string
          scope_of_role?: string | null
          status?: string
          summary?: string | null
          supervisory_responsibility?: string | null
          travel_requirement?: string | null
          updated_at?: string | null
          version_number?: number
          work_environment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_descriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_descriptions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_descriptions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_descriptions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_pay_benchmarks: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          data_as_of: string | null
          geography: string
          id: string
          job_id: string
          median: number | null
          notes: string | null
          onet_soc_code: string | null
          pay_period: string
          percentile_10: number | null
          percentile_25: number | null
          percentile_75: number | null
          percentile_90: number | null
          retrieved_at: string
          retrieved_by: string | null
          source: string
          source_detail: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          data_as_of?: string | null
          geography: string
          id?: string
          job_id: string
          median?: number | null
          notes?: string | null
          onet_soc_code?: string | null
          pay_period: string
          percentile_10?: number | null
          percentile_25?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          retrieved_at?: string
          retrieved_by?: string | null
          source: string
          source_detail?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          data_as_of?: string | null
          geography?: string
          id?: string
          job_id?: string
          median?: number | null
          notes?: string | null
          onet_soc_code?: string | null
          pay_period?: string
          percentile_10?: number | null
          percentile_25?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          retrieved_at?: string
          retrieved_by?: string | null
          source?: string
          source_detail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_pay_benchmarks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pay_benchmarks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pay_benchmarks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_pay_benchmarks_retrieved_by_fkey"
            columns: ["retrieved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          department: string | null
          employment_type: string
          flsa_classification: string | null
          id: string
          industry: string
          is_active: boolean
          is_safety_sensitive: boolean
          job_code: string | null
          job_family: string | null
          job_level: string | null
          job_title: string
          onet_soc_code: string | null
          pay_max: number | null
          pay_min: number | null
          pay_period: string | null
          reference_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          department?: string | null
          employment_type?: string
          flsa_classification?: string | null
          id?: string
          industry?: string
          is_active?: boolean
          is_safety_sensitive?: boolean
          job_code?: string | null
          job_family?: string | null
          job_level?: string | null
          job_title: string
          onet_soc_code?: string | null
          pay_max?: number | null
          pay_min?: number | null
          pay_period?: string | null
          reference_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          department?: string | null
          employment_type?: string
          flsa_classification?: string | null
          id?: string
          industry?: string
          is_active?: boolean
          is_safety_sensitive?: boolean
          job_code?: string | null
          job_family?: string | null
          job_level?: string | null
          job_title?: string
          onet_soc_code?: string | null
          pay_max?: number | null
          pay_min?: number | null
          pay_period?: string | null
          reference_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_benefit_obligations: {
        Row: {
          benefit_type: string
          company_id: string
          coverage_end: string | null
          coverage_start: string
          created_at: string
          created_by: string
          employee_amount: number
          employer_amount: number
          frequency: string
          id: string
          leave_case_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          benefit_type: string
          company_id: string
          coverage_end?: string | null
          coverage_start: string
          created_at?: string
          created_by: string
          employee_amount?: number
          employer_amount?: number
          frequency: string
          id?: string
          leave_case_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          benefit_type?: string
          company_id?: string
          coverage_end?: string | null
          coverage_start?: string
          created_at?: string
          created_by?: string
          employee_amount?: number
          employer_amount?: number
          frequency?: string
          id?: string
          leave_case_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_benefit_obligations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_benefit_obligations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_benefit_obligations_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_benefit_transactions: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string
          effective_date: string
          id: string
          obligation_id: string
          reference_note: string | null
          reversal_of: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          created_by: string
          effective_date: string
          id?: string
          obligation_id: string
          reference_note?: string | null
          reversal_of?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string
          effective_date?: string
          id?: string
          obligation_id?: string
          reference_note?: string | null
          reversal_of?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_benefit_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_benefit_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_benefit_transactions_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "leave_benefit_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_benefit_transactions_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "leave_benefit_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_case_bases: {
        Row: {
          created_at: string | null
          id: string
          leave_case_id: string
          leave_type_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leave_case_id: string
          leave_type_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leave_case_id?: string
          leave_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_case_bases_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_case_bases_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_case_events: {
        Row: {
          channel: string | null
          company_id: string
          created_at: string
          created_by: string
          event_type: string
          id: string
          leave_case_id: string
          occurred_at: string
          summary: string
          visibility: string
        }
        Insert: {
          channel?: string | null
          company_id: string
          created_at?: string
          created_by: string
          event_type: string
          id?: string
          leave_case_id: string
          occurred_at: string
          summary: string
          visibility?: string
        }
        Update: {
          channel?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          event_type?: string
          id?: string
          leave_case_id?: string
          occurred_at?: string
          summary?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_case_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_case_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_case_events_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_cases: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          company_id: string
          created_at: string | null
          created_by: string
          decision_reason: string | null
          family_relationship: string | null
          id: string
          intake_channel: string
          is_intermittent: boolean
          opened_by: string
          person_id: string
          reason_category: string
          reason_code: string | null
          reference_id: string
          requested_end: string | null
          requested_mode: string
          requested_start: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          decision_reason?: string | null
          family_relationship?: string | null
          id?: string
          intake_channel?: string
          is_intermittent?: boolean
          opened_by: string
          person_id: string
          reason_category: string
          reason_code?: string | null
          reference_id: string
          requested_end?: string | null
          requested_mode?: string
          requested_start?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          decision_reason?: string | null
          family_relationship?: string | null
          id?: string
          intake_channel?: string
          is_intermittent?: boolean
          opened_by?: string
          person_id?: string
          reason_category?: string
          reason_code?: string | null
          reference_id?: string
          requested_end?: string | null
          requested_mode?: string
          requested_start?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_cases_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_cases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_certifications: {
        Row: {
          attachment_id: string | null
          certification_type: string
          company_id: string
          created_at: string | null
          created_by: string | null
          cure_due_date: string | null
          deficiency_notified_at: string | null
          drive_file_id: string | null
          due_date: string | null
          form_authority: string | null
          form_version: string | null
          id: string
          leave_case_id: string
          provider_note: string | null
          received_at: string | null
          requested_at: string | null
          source_kind: string | null
          status: string
          sufficient: boolean | null
          updated_at: string | null
        }
        Insert: {
          attachment_id?: string | null
          certification_type: string
          company_id: string
          created_at?: string | null
          created_by?: string | null
          cure_due_date?: string | null
          deficiency_notified_at?: string | null
          drive_file_id?: string | null
          due_date?: string | null
          form_authority?: string | null
          form_version?: string | null
          id?: string
          leave_case_id: string
          provider_note?: string | null
          received_at?: string | null
          requested_at?: string | null
          source_kind?: string | null
          status?: string
          sufficient?: boolean | null
          updated_at?: string | null
        }
        Update: {
          attachment_id?: string | null
          certification_type?: string
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          cure_due_date?: string | null
          deficiency_notified_at?: string | null
          drive_file_id?: string | null
          due_date?: string | null
          form_authority?: string | null
          form_version?: string | null
          id?: string
          leave_case_id?: string
          provider_note?: string | null
          received_at?: string | null
          requested_at?: string | null
          source_kind?: string | null
          status?: string
          sufficient?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_certifications_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_certifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_certifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_certifications_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_eligibility_determinations: {
        Row: {
          company_id: string
          concurrency_code: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          effective_outcome: string
          entitlement_hours: number | null
          evaluated_at: string
          evaluated_by: string
          evaluated_outcome: string
          findings: Json
          id: string
          leave_case_id: string
          leave_type_id: string
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          rule_set_id: string | null
          snapshot_id: string
        }
        Insert: {
          company_id: string
          concurrency_code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          effective_outcome: string
          entitlement_hours?: number | null
          evaluated_at?: string
          evaluated_by: string
          evaluated_outcome: string
          findings?: Json
          id?: string
          leave_case_id: string
          leave_type_id: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          rule_set_id?: string | null
          snapshot_id: string
        }
        Update: {
          company_id?: string
          concurrency_code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          effective_outcome?: string
          entitlement_hours?: number | null
          evaluated_at?: string
          evaluated_by?: string
          evaluated_outcome?: string
          findings?: Json
          id?: string
          leave_case_id?: string
          leave_type_id?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          rule_set_id?: string | null
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_eligibility_determinations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_determinations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_determinations_evaluated_by_fkey"
            columns: ["evaluated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_determinations_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_determinations_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_determinations_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_determinations_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "leave_rule_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_determinations_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "leave_eligibility_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_eligibility_snapshots: {
        Row: {
          as_of_date: string
          company_id: string
          created_at: string
          created_by: string
          designated_person_selected: boolean
          eligibility_context: Json
          employer_employee_count: number | null
          facts_source: string
          family_relationship: string | null
          hours_worked_12_months: number | null
          id: string
          leave_case_id: string
          months_of_service: number | null
          reason_code: string
          scheduled_weekly_hours: number
          worksite_employee_count_75: number | null
        }
        Insert: {
          as_of_date: string
          company_id: string
          created_at?: string
          created_by: string
          designated_person_selected?: boolean
          eligibility_context?: Json
          employer_employee_count?: number | null
          facts_source?: string
          family_relationship?: string | null
          hours_worked_12_months?: number | null
          id?: string
          leave_case_id: string
          months_of_service?: number | null
          reason_code: string
          scheduled_weekly_hours: number
          worksite_employee_count_75?: number | null
        }
        Update: {
          as_of_date?: string
          company_id?: string
          created_at?: string
          created_by?: string
          designated_person_selected?: boolean
          eligibility_context?: Json
          employer_employee_count?: number | null
          facts_source?: string
          family_relationship?: string | null
          hours_worked_12_months?: number | null
          id?: string
          leave_case_id?: string
          months_of_service?: number | null
          reason_code?: string
          scheduled_weekly_hours?: number
          worksite_employee_count_75?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_eligibility_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_eligibility_snapshots_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_entitlement_periods: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          determination_id: string | null
          entitlement_hours: number
          id: string
          leave_type_id: string
          period_end: string | null
          period_start: string
          person_id: string
          scheduled_weekly_hours: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          determination_id?: string | null
          entitlement_hours: number
          id?: string
          leave_type_id: string
          period_end?: string | null
          period_start: string
          person_id: string
          scheduled_weekly_hours: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          determination_id?: string | null
          entitlement_hours?: number
          id?: string
          leave_type_id?: string
          period_end?: string | null
          period_start?: string
          person_id?: string
          scheduled_weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_entitlement_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_entitlement_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_entitlement_periods_determination_id_fkey"
            columns: ["determination_id"]
            isOneToOne: false
            referencedRelation: "leave_eligibility_determinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_entitlement_periods_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_entitlement_periods_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_notices: {
        Row: {
          acknowledged_at: string | null
          authority_name: string | null
          authority_source_url: string | null
          company_id: string
          content_registry_id: string | null
          created_at: string
          created_by: string
          delivered_at: string | null
          delivery_method: string | null
          delivery_reference: string | null
          document_generation_id: string | null
          due_at: string | null
          id: string
          issued_at: string | null
          leave_case_id: string
          leave_type_id: string | null
          notice_type: string
          snapshot: Json
          status: string
          template_key: string
          template_version: number
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          authority_name?: string | null
          authority_source_url?: string | null
          company_id: string
          content_registry_id?: string | null
          created_at?: string
          created_by: string
          delivered_at?: string | null
          delivery_method?: string | null
          delivery_reference?: string | null
          document_generation_id?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string | null
          leave_case_id: string
          leave_type_id?: string | null
          notice_type: string
          snapshot?: Json
          status?: string
          template_key: string
          template_version: number
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          authority_name?: string | null
          authority_source_url?: string | null
          company_id?: string
          content_registry_id?: string | null
          created_at?: string
          created_by?: string
          delivered_at?: string | null
          delivery_method?: string | null
          delivery_reference?: string | null
          document_generation_id?: string | null
          due_at?: string | null
          id?: string
          issued_at?: string | null
          leave_case_id?: string
          leave_type_id?: string | null
          notice_type?: string
          snapshot?: Json
          status?: string
          template_key?: string
          template_version?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_notices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_notices_content_registry_id_fkey"
            columns: ["content_registry_id"]
            isOneToOne: false
            referencedRelation: "compliance_content_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_notices_document_generation_id_fkey"
            columns: ["document_generation_id"]
            isOneToOne: false
            referencedRelation: "document_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_notices_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_notices_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_return_to_work: {
        Row: {
          accommodation_case_id: string | null
          accommodation_referral_required: boolean
          actual_return_date: string | null
          company_id: string
          created_at: string
          created_by: string
          expected_return_date: string | null
          fitness_certification_id: string | null
          fitness_required: boolean
          id: string
          job_description_id: string | null
          leave_case_id: string
          reinstatement_note: string | null
          restrictions_present: boolean
          same_or_comparable_job: boolean | null
          updated_at: string | null
        }
        Insert: {
          accommodation_case_id?: string | null
          accommodation_referral_required?: boolean
          actual_return_date?: string | null
          company_id: string
          created_at?: string
          created_by: string
          expected_return_date?: string | null
          fitness_certification_id?: string | null
          fitness_required?: boolean
          id?: string
          job_description_id?: string | null
          leave_case_id: string
          reinstatement_note?: string | null
          restrictions_present?: boolean
          same_or_comparable_job?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accommodation_case_id?: string | null
          accommodation_referral_required?: boolean
          actual_return_date?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          expected_return_date?: string | null
          fitness_certification_id?: string | null
          fitness_required?: boolean
          id?: string
          job_description_id?: string | null
          leave_case_id?: string
          reinstatement_note?: string | null
          restrictions_present?: boolean
          same_or_comparable_job?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_return_to_work_accommodation_case_id_fkey"
            columns: ["accommodation_case_id"]
            isOneToOne: false
            referencedRelation: "accommodation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_return_to_work_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_return_to_work_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_return_to_work_fitness_certification_id_fkey"
            columns: ["fitness_certification_id"]
            isOneToOne: false
            referencedRelation: "leave_certifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_return_to_work_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_return_to_work_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: true
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_rule_sets: {
        Row: {
          citation: string
          company_id: string | null
          content_registry_id: string | null
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          jurisdiction: string
          legal_basis_key: string
          rules: Json
          source_url: string
          status: string
          updated_at: string | null
          version: number
        }
        Insert: {
          citation: string
          company_id?: string | null
          content_registry_id?: string | null
          created_at?: string
          created_by?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          jurisdiction: string
          legal_basis_key: string
          rules: Json
          source_url: string
          status?: string
          updated_at?: string | null
          version: number
        }
        Update: {
          citation?: string
          company_id?: string | null
          content_registry_id?: string | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          jurisdiction?: string
          legal_basis_key?: string
          rules?: Json
          source_url?: string
          status?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_rule_sets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_rule_sets_content_registry_id_fkey"
            columns: ["content_registry_id"]
            isOneToOne: false
            referencedRelation: "compliance_content_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_rule_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_schedule_segments: {
        Row: {
          actual_hours: number | null
          company_id: string
          created_at: string
          created_by: string
          designated_at: string | null
          end_at: string | null
          id: string
          leave_case_id: string
          planned_hours: number | null
          segment_mode: string
          start_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          company_id: string
          created_at?: string
          created_by: string
          designated_at?: string | null
          end_at?: string | null
          id?: string
          leave_case_id: string
          planned_hours?: number | null
          segment_mode: string
          start_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          company_id?: string
          created_at?: string
          created_by?: string
          designated_at?: string | null
          end_at?: string | null
          id?: string
          leave_case_id?: string
          planned_hours?: number | null
          segment_mode?: string
          start_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_schedule_segments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_schedule_segments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_schedule_segments_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          citation: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          entitlement_hours: number | null
          id: string
          is_active: boolean
          jurisdiction: string
          measurement_method: string
          measurement_months: number | null
          requires_certification: boolean
          type_key: string
          type_name: string
          updated_at: string | null
        }
        Insert: {
          citation?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          entitlement_hours?: number | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          measurement_method?: string
          measurement_months?: number | null
          requires_certification?: boolean
          type_key: string
          type_name: string
          updated_at?: string | null
        }
        Update: {
          citation?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          entitlement_hours?: number | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          measurement_method?: string
          measurement_months?: number | null
          requires_certification?: boolean
          type_key?: string
          type_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves_ledger: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          effective_date: string
          entry_type: string
          hours_delta: number
          id: string
          leave_case_id: string | null
          leave_type_id: string
          person_id: string
          reason: string | null
          reference_id: string
          reversal_of: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          effective_date: string
          entry_type: string
          hours_delta: number
          id?: string
          leave_case_id?: string | null
          leave_type_id: string
          person_id: string
          reason?: string | null
          reference_id: string
          reversal_of?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          effective_date?: string
          entry_type?: string
          hours_delta?: number
          id?: string
          leave_case_id?: string | null
          leave_type_id?: string
          person_id?: string
          reason?: string | null
          reference_id?: string
          reversal_of?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaves_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_ledger_leave_case_id_fkey"
            columns: ["leave_case_id"]
            isOneToOne: false
            referencedRelation: "leave_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_ledger_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_ledger_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_ledger_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "leaves_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      message_thread_participants: {
        Row: {
          id: string
          is_muted: boolean
          joined_at: string
          last_read_at: string | null
          left_at: string | null
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          role?: string
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_thread_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_archived: boolean
          last_message_at: string | null
          reference_id: string
          subject: string | null
          thread_type: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          reference_id: string
          subject?: string | null
          thread_type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          reference_id?: string
          subject?: string | null
          thread_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_versions: {
        Row: {
          body: string
          change_type: string
          changed_at: string
          changed_by: string
          company_id: string
          id: string
          message_id: string
          reference_id: string
          version_number: number
        }
        Insert: {
          body: string
          change_type: string
          changed_at?: string
          changed_by: string
          company_id: string
          id?: string
          message_id: string
          reference_id: string
          version_number: number
        }
        Update: {
          body?: string
          change_type?: string
          changed_at?: string
          changed_by?: string
          company_id?: string
          id?: string
          message_id?: string
          reference_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_versions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_versions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          company_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_system: boolean
          parent_message_id: string | null
          reference_id: string
          sender_user_id: string
          thread_id: string
        }
        Insert: {
          body: string
          company_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_system?: boolean
          parent_message_id?: string | null
          reference_id: string
          sender_user_id: string
          thread_id: string
        }
        Update: {
          body?: string
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_system?: boolean
          parent_message_id?: string | null
          reference_id?: string
          sender_user_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      mhd_impersonation_sessions: {
        Row: {
          admin_user_id: string
          ended_at: string | null
          id: string
          impersonated_company_id: string | null
          impersonated_role: string
          started_at: string
        }
        Insert: {
          admin_user_id: string
          ended_at?: string | null
          id?: string
          impersonated_company_id?: string | null
          impersonated_role: string
          started_at?: string
        }
        Update: {
          admin_user_id?: string
          ended_at?: string | null
          id?: string
          impersonated_company_id?: string | null
          impersonated_role?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mhd_impersonation_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mhd_impersonation_sessions_impersonated_company_id_fkey"
            columns: ["impersonated_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      mileage_claim_lines: {
        Row: {
          claim_id: string
          claim_is_live: boolean
          company_amount: number | null
          company_rate_applied: number | null
          company_rate_policy_id: string | null
          created_at: string | null
          id: string
          irs_amount: number | null
          irs_rate_applied: number | null
          irs_rate_id: string | null
          line_number: number
          miles_claimed: number
          rate_category: string
          stamped_at: string | null
          trip_date: string
          trip_id: string
        }
        Insert: {
          claim_id: string
          claim_is_live?: boolean
          company_amount?: number | null
          company_rate_applied?: number | null
          company_rate_policy_id?: string | null
          created_at?: string | null
          id?: string
          irs_amount?: number | null
          irs_rate_applied?: number | null
          irs_rate_id?: string | null
          line_number?: number
          miles_claimed: number
          rate_category?: string
          stamped_at?: string | null
          trip_date: string
          trip_id: string
        }
        Update: {
          claim_id?: string
          claim_is_live?: boolean
          company_amount?: number | null
          company_rate_applied?: number | null
          company_rate_policy_id?: string | null
          created_at?: string | null
          id?: string
          irs_amount?: number | null
          irs_rate_applied?: number | null
          irs_rate_id?: string | null
          line_number?: number
          miles_claimed?: number
          rate_category?: string
          stamped_at?: string | null
          trip_date?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_claim_lines_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "mileage_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_claim_lines_company_rate_policy_id_fkey"
            columns: ["company_rate_policy_id"]
            isOneToOne: false
            referencedRelation: "mileage_company_rate_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_claim_lines_irs_rate_id_fkey"
            columns: ["irs_rate_id"]
            isOneToOne: false
            referencedRelation: "mileage_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_claim_lines_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "mileage_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_claims: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          company_id: string
          created_at: string | null
          created_by: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          export_batch_reference: string | null
          exported_at: string | null
          exported_by: string | null
          id: string
          period_end: string
          period_start: string
          person_id: string
          reference_id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          total_company_amount: number | null
          total_irs_amount: number | null
          total_miles: number | null
          updated_at: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          export_batch_reference?: string | null
          exported_at?: string | null
          exported_by?: string | null
          id?: string
          period_end: string
          period_start: string
          person_id: string
          reference_id: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_company_amount?: number | null
          total_irs_amount?: number | null
          total_miles?: number | null
          updated_at?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          export_batch_reference?: string | null
          exported_at?: string | null
          exported_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          person_id?: string
          reference_id?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          total_company_amount?: number | null
          total_irs_amount?: number | null
          total_miles?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_claims_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_claims_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_claims_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_claims_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_claims_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_claims_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_company_rate_policies: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          effective_from: string
          effective_to: string | null
          fixed_rate_per_mile: number | null
          id: string
          policy_note: string | null
          rate_mode: string
          set_by: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          effective_from: string
          effective_to?: string | null
          fixed_rate_per_mile?: number | null
          id?: string
          policy_note?: string | null
          rate_mode?: string
          set_by: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          effective_from?: string
          effective_to?: string | null
          fixed_rate_per_mile?: number | null
          id?: string
          policy_note?: string | null
          rate_mode?: string
          set_by?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_company_rate_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_company_rate_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_company_rate_policies_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_rates: {
        Row: {
          category: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          created_by: string
          effective_from: string
          effective_to: string | null
          fetch_source: string
          id: string
          notes: string | null
          notice_number: string | null
          rate_per_mile: number
          reference_id: string
          retrieved_at: string | null
          retrieved_by: string | null
          source_document_date: string | null
          source_url: string | null
          status: string
          superseded_by_rate_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          created_by: string
          effective_from: string
          effective_to?: string | null
          fetch_source?: string
          id?: string
          notes?: string | null
          notice_number?: string | null
          rate_per_mile: number
          reference_id: string
          retrieved_at?: string | null
          retrieved_by?: string | null
          source_document_date?: string | null
          source_url?: string | null
          status?: string
          superseded_by_rate_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string
          effective_from?: string
          effective_to?: string | null
          fetch_source?: string
          id?: string
          notes?: string | null
          notice_number?: string | null
          rate_per_mile?: number
          reference_id?: string
          retrieved_at?: string | null
          retrieved_by?: string | null
          source_document_date?: string | null
          source_url?: string | null
          status?: string
          superseded_by_rate_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_rates_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_rates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_rates_retrieved_by_fkey"
            columns: ["retrieved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_rates_superseded_by_rate_id_fkey"
            columns: ["superseded_by_rate_id"]
            isOneToOne: false
            referencedRelation: "mileage_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_trips: {
        Row: {
          affirmed_by: string
          business_purpose: string
          commute_deduction_miles: number | null
          company_id: string
          created_at: string | null
          created_by: string
          destination: string
          id: string
          is_round_trip: boolean
          miles: number
          not_ordinary_commuting_affirmed: boolean
          notes: string | null
          odometer_end: number | null
          odometer_start: number | null
          origin: string
          person_id: string
          recorded_at: string
          recorded_by: string
          reference_id: string
          trip_date: string
          updated_at: string | null
          vehicle_description: string | null
          void_reason: string | null
          voided_at: string | null
        }
        Insert: {
          affirmed_by: string
          business_purpose: string
          commute_deduction_miles?: number | null
          company_id: string
          created_at?: string | null
          created_by: string
          destination: string
          id?: string
          is_round_trip?: boolean
          miles: number
          not_ordinary_commuting_affirmed?: boolean
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          origin: string
          person_id: string
          recorded_at?: string
          recorded_by: string
          reference_id: string
          trip_date: string
          updated_at?: string | null
          vehicle_description?: string | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Update: {
          affirmed_by?: string
          business_purpose?: string
          commute_deduction_miles?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          destination?: string
          id?: string
          is_round_trip?: boolean
          miles?: number
          not_ordinary_commuting_affirmed?: boolean
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          origin?: string
          person_id?: string
          recorded_at?: string
          recorded_by?: string
          reference_id?: string
          trip_date?: string
          updated_at?: string | null
          vehicle_description?: string | null
          void_reason?: string | null
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_trips_affirmed_by_fkey"
            columns: ["affirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_trips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_trips_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_trips_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          note_plain_text: string
          note_rich_text: Json
          parent_note_id: string | null
          reference_id: string
          updated_at: string
          updated_by: string
          visibility: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          note_plain_text: string
          note_rich_text: Json
          parent_note_id?: string | null
          reference_id: string
          updated_at?: string
          updated_by: string
          visibility: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          note_plain_text?: string
          note_rich_text?: Json
          parent_note_id?: string | null
          reference_id?: string
          updated_at?: string
          updated_by?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_parent_note_id_fkey"
            columns: ["parent_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_packet_items: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_required: boolean
          notice_version_id: string
          packet_version_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_required?: boolean
          notice_version_id: string
          packet_version_id: string
          sort_order: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_required?: boolean
          notice_version_id?: string
          packet_version_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "notice_packet_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_packet_items_notice_version_id_fkey"
            columns: ["notice_version_id"]
            isOneToOne: false
            referencedRelation: "notice_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_packet_items_packet_version_id_fkey"
            columns: ["packet_version_id"]
            isOneToOne: false
            referencedRelation: "notice_packet_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_packet_versions: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          notes: string | null
          packet_id: string
          reference_id: string
          status: string
          updated_at: string
          updated_by: string | null
          version_date: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          packet_id: string
          reference_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version_date: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          packet_id?: string
          reference_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_packet_versions_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_packet_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_packet_versions_packet_id_fkey"
            columns: ["packet_id"]
            isOneToOne: false
            referencedRelation: "notice_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_packet_versions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_packets: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          jurisdiction: string
          name: string
          packet_key: string
          reference_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          name: string
          packet_key: string
          reference_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          name?: string
          packet_key?: string
          reference_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notice_packets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_packets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_packets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_versions: {
        Row: {
          attachment_id_en: string | null
          attachment_id_es: string | null
          created_at: string
          created_by: string | null
          effective_from: string
          effective_to: string | null
          id: string
          notice_id: string
          page_count_en: number | null
          page_count_es: number | null
          reference_id: string
          sha256_en: string | null
          sha256_es: string | null
          source_url_en: string | null
          source_url_es: string | null
          updated_at: string
          updated_by: string | null
          version_label: string
        }
        Insert: {
          attachment_id_en?: string | null
          attachment_id_es?: string | null
          created_at?: string
          created_by?: string | null
          effective_from: string
          effective_to?: string | null
          id?: string
          notice_id: string
          page_count_en?: number | null
          page_count_es?: number | null
          reference_id: string
          sha256_en?: string | null
          sha256_es?: string | null
          source_url_en?: string | null
          source_url_es?: string | null
          updated_at?: string
          updated_by?: string | null
          version_label: string
        }
        Update: {
          attachment_id_en?: string | null
          attachment_id_es?: string | null
          created_at?: string
          created_by?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          notice_id?: string
          page_count_en?: number | null
          page_count_es?: number | null
          reference_id?: string
          sha256_en?: string | null
          sha256_es?: string | null
          source_url_en?: string | null
          source_url_es?: string | null
          updated_at?: string
          updated_by?: string | null
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_versions_attachment_id_en_fkey"
            columns: ["attachment_id_en"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_versions_attachment_id_es_fkey"
            columns: ["attachment_id_es"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_versions_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notice_versions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          agency: string
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          form_number: string | null
          id: string
          is_active: boolean
          jurisdiction: string
          notice_key: string
          reference_id: string
          sort_order: number
          title: string
          title_es: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agency: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_number?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          notice_key: string
          reference_id: string
          sort_order?: number
          title: string
          title_es?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agency?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_number?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?: string
          notice_key?: string
          reference_id?: string
          sort_order?: number
          title?: string
          title_es?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          channel_key: string
          created_at: string
          description: string | null
          dispatch_mode: string
          handler_function: string | null
          is_active: boolean
          label: string
          updated_at: string | null
        }
        Insert: {
          channel_key: string
          created_at?: string
          description?: string | null
          dispatch_mode: string
          handler_function?: string | null
          is_active?: boolean
          label: string
          updated_at?: string | null
        }
        Update: {
          channel_key?: string
          created_at?: string
          description?: string | null
          dispatch_mode?: string
          handler_function?: string | null
          is_active?: boolean
          label?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          attempts: number
          channel_key: string
          company_id: string
          created_at: string
          error_text: string | null
          id: string
          notification_id: string
          provider_ref: string | null
          recipient_user_id: string
          result: Json | null
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          channel_key: string
          company_id: string
          created_at?: string
          error_text?: string | null
          id?: string
          notification_id: string
          provider_ref?: string | null
          recipient_user_id: string
          result?: Json | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          channel_key?: string
          company_id?: string
          created_at?: string
          error_text?: string | null
          id?: string
          notification_id?: string
          provider_ref?: string | null
          recipient_user_id?: string
          result?: Json | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_channel_key_fkey"
            columns: ["channel_key"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["channel_key"]
          },
          {
            foreignKeyName: "notification_deliveries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          actor_user_id: string | null
          body: string | null
          company_id: string
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          notification_type: string
          read_at: string | null
          recipient_user_id: string
          reference_id: string
          title: string
        }
        Insert: {
          action_url?: string | null
          actor_user_id?: string | null
          body?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          notification_type: string
          read_at?: string | null
          recipient_user_id: string
          reference_id: string
          title: string
        }
        Update: {
          action_url?: string | null
          actor_user_id?: string | null
          body?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          notification_type?: string
          read_at?: string | null
          recipient_user_id?: string
          reference_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offboarding_cases: {
        Row: {
          cancel_reason: string | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string
          eligible_for_rehire: boolean | null
          exit_interview_activity_id: string | null
          id: string
          initiated_by_user_id: string
          last_working_day: string | null
          person_id: string
          reason_summary: string | null
          reference_id: string
          separation_date: string
          separation_type: string
          status: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          cancel_reason?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          eligible_for_rehire?: boolean | null
          exit_interview_activity_id?: string | null
          id?: string
          initiated_by_user_id: string
          last_working_day?: string | null
          person_id: string
          reason_summary?: string | null
          reference_id: string
          separation_date: string
          separation_type: string
          status?: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          cancel_reason?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          eligible_for_rehire?: boolean | null
          exit_interview_activity_id?: string | null
          id?: string
          initiated_by_user_id?: string
          last_working_day?: string | null
          person_id?: string
          reason_summary?: string | null
          reference_id?: string
          separation_date?: string
          separation_type?: string
          status?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "offboarding_cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_cases_exit_interview_activity_id_fkey"
            columns: ["exit_interview_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_cases_initiated_by_user_id_fkey"
            columns: ["initiated_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_cases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_cases_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offboarding_checklist_items: {
        Row: {
          assigned_user_id: string | null
          case_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_required: boolean
          item_key: string | null
          linked_entity_id: string | null
          linked_entity_type: string | null
          reference_id: string
          sort_order: number
          status: string
          status_reason: string | null
          title: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          assigned_user_id?: string | null
          case_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean
          item_key?: string | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          reference_id: string
          sort_order?: number
          status?: string
          status_reason?: string | null
          title: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          assigned_user_id?: string | null
          case_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean
          item_key?: string | null
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          reference_id?: string
          sort_order?: number
          status?: string
          status_reason?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "offboarding_checklist_items_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklist_items_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "offboarding_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklist_items_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklist_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_checklist_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      official_instrument_field_map: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          instrument_id: string
          instrument_section: string | null
          is_employer_completed: boolean
          notes: string | null
          pdf_field_kind: string
          pdf_field_name: string
          source_column: string | null
          source_expression: string | null
          source_table: string | null
          transform: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          instrument_id: string
          instrument_section?: string | null
          is_employer_completed?: boolean
          notes?: string | null
          pdf_field_kind?: string
          pdf_field_name: string
          source_column?: string | null
          source_expression?: string | null
          source_table?: string | null
          transform?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          instrument_id?: string
          instrument_section?: string | null
          is_employer_completed?: boolean
          notes?: string | null
          pdf_field_kind?: string
          pdf_field_name?: string
          source_column?: string | null
          source_expression?: string | null
          source_table?: string | null
          transform?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_instrument_field_map_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_instrument_field_map_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "official_instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_instrument_field_map_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "v_official_instruments_expiring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_instrument_field_map_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      official_instruments: {
        Row: {
          asset_id: string | null
          created_at: string
          created_by: string | null
          edition_date: string | null
          edition_label: string | null
          expires_on: string | null
          form_number: string
          id: string
          instrument_key: string
          is_current: boolean
          issuing_agency: string
          jurisdiction: string
          language_code: string
          notes: string | null
          omb_control_number: string | null
          retired_at: string | null
          source_url: string | null
          superseded_by: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          created_by?: string | null
          edition_date?: string | null
          edition_label?: string | null
          expires_on?: string | null
          form_number: string
          id?: string
          instrument_key: string
          is_current?: boolean
          issuing_agency: string
          jurisdiction: string
          language_code?: string
          notes?: string | null
          omb_control_number?: string | null
          retired_at?: string | null
          source_url?: string | null
          superseded_by?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          created_by?: string | null
          edition_date?: string | null
          edition_label?: string | null
          expires_on?: string | null
          form_number?: string
          id?: string
          instrument_key?: string
          is_current?: boolean
          issuing_agency?: string
          jurisdiction?: string
          language_code?: string
          notes?: string | null
          omb_control_number?: string | null
          retired_at?: string | null
          source_url?: string | null
          superseded_by?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_instruments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_instruments_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "official_instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_instruments_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "v_official_instruments_expiring"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "official_instruments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_application_availability: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          day_of_week: string
          hours_available: string | null
          id: string
          is_available: boolean | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          day_of_week: string
          hours_available?: string | null
          id?: string
          is_available?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          day_of_week?: string
          hours_available?: string | null
          id?: string
          is_available?: boolean | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_application_availability_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "onboarding_employment_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_availability_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "onboarding_employment_applications_applicant_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_availability_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_employment_applications_validity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_availability_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_availability_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_application_education: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          degree_or_diploma: string | null
          education_level: string
          id: string
          major_or_field: string | null
          school_location: string | null
          school_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          degree_or_diploma?: string | null
          education_level: string
          id?: string
          major_or_field?: string | null
          school_location?: string | null
          school_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          degree_or_diploma?: string | null
          education_level?: string
          id?: string
          major_or_field?: string | null
          school_location?: string | null
          school_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_application_education_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "onboarding_employment_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_education_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "onboarding_employment_applications_applicant_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_education_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_employment_applications_validity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_education_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_education_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_application_employment_history: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          employer_address: string | null
          employer_name: string | null
          employer_ordinal: number
          employer_phone: string | null
          employment_from: string | null
          employment_to: string | null
          id: string
          is_most_recent: boolean
          job_duties: string | null
          job_title: string | null
          may_we_contact: boolean | null
          reason_for_leaving: string | null
          supervisor_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          employer_address?: string | null
          employer_name?: string | null
          employer_ordinal: number
          employer_phone?: string | null
          employment_from?: string | null
          employment_to?: string | null
          id?: string
          is_most_recent?: boolean
          job_duties?: string | null
          job_title?: string | null
          may_we_contact?: boolean | null
          reason_for_leaving?: string | null
          supervisor_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          employer_address?: string | null
          employer_name?: string | null
          employer_ordinal?: number
          employer_phone?: string | null
          employment_from?: string | null
          employment_to?: string | null
          id?: string
          is_most_recent?: boolean
          job_duties?: string | null
          job_title?: string | null
          may_we_contact?: boolean | null
          reason_for_leaving?: string | null
          supervisor_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_application_employment_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "onboarding_employment_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_employment_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "onboarding_employment_applications_applicant_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_employment_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_employment_applications_validity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_employment_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_employment_history_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_application_references: {
        Row: {
          application_id: string
          created_at: string
          created_by: string | null
          id: string
          phone_or_email: string | null
          reference_name: string | null
          reference_ordinal: number
          title_or_relationship: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          phone_or_email?: string | null
          reference_name?: string | null
          reference_ordinal: number
          title_or_relationship?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          phone_or_email?: string | null
          reference_name?: string | null
          reference_ordinal?: number
          title_or_relationship?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_application_references_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "onboarding_employment_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_references_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "onboarding_employment_applications_applicant_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_references_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "v_employment_applications_validity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_references_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_application_references_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_at_will_acknowledgments: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          person_id: string
          policy_version: string | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          policy_version?: string | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          policy_version?: string | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_at_will_acknowledgments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_at_will_acknowledgments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_at_will_acknowledgments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_at_will_acknowledgments_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_at_will_acknowledgments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_at_will_acknowledgments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_badge_acknowledgments: {
        Row: {
          badge_issued_at: string | null
          badge_number: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          payroll_user_id_no: string | null
          person_id: string
          reference_id: string
          replacement_fee_acknowledged: boolean
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge_issued_at?: string | null
          badge_number?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          payroll_user_id_no?: string | null
          person_id: string
          reference_id: string
          replacement_fee_acknowledged?: boolean
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge_issued_at?: string | null
          badge_number?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          payroll_user_id_no?: string | null
          person_id?: string
          reference_id?: string
          replacement_fee_acknowledged?: boolean
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_badge_acknowledgments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_badge_acknowledgments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_badge_acknowledgments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_badge_acknowledgments_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_badge_acknowledgments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_badge_acknowledgments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_candidate_evaluations: {
        Row: {
          candidate_email: string | null
          candidate_name: string | null
          candidate_phone: string | null
          company_id: string
          concerns_notes: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          designation: string | null
          designation_type: string | null
          document_generation_id: string | null
          esignature_request_id: string | null
          evaluation_notes: string | null
          evaluator_email: string | null
          evaluator_phone: string | null
          evaluator_signature_at: string | null
          evaluator_signature_name: string | null
          evaluator_title: string | null
          flsa_classification: string | null
          form_submission_id: string | null
          id: string
          interview_date: string | null
          interviewer_name: string | null
          is_deleted: boolean
          is_supervisory: boolean | null
          not_hired_reason: string | null
          overall_rating: number | null
          pay_basis: string | null
          person_id: string
          position_applied_for: string | null
          rate_of_pay: number | null
          recommendation: string | null
          recommendation_comments: string | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          start_date: string | null
          start_time: string | null
          status: string
          strengths_notes: string | null
          updated_at: string
          updated_by: string | null
          was_hired: boolean | null
        }
        Insert: {
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          company_id: string
          concerns_notes?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          designation?: string | null
          designation_type?: string | null
          document_generation_id?: string | null
          esignature_request_id?: string | null
          evaluation_notes?: string | null
          evaluator_email?: string | null
          evaluator_phone?: string | null
          evaluator_signature_at?: string | null
          evaluator_signature_name?: string | null
          evaluator_title?: string | null
          flsa_classification?: string | null
          form_submission_id?: string | null
          id?: string
          interview_date?: string | null
          interviewer_name?: string | null
          is_deleted?: boolean
          is_supervisory?: boolean | null
          not_hired_reason?: string | null
          overall_rating?: number | null
          pay_basis?: string | null
          person_id: string
          position_applied_for?: string | null
          rate_of_pay?: number | null
          recommendation?: string | null
          recommendation_comments?: string | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          strengths_notes?: string | null
          updated_at?: string
          updated_by?: string | null
          was_hired?: boolean | null
        }
        Update: {
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          company_id?: string
          concerns_notes?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          designation?: string | null
          designation_type?: string | null
          document_generation_id?: string | null
          esignature_request_id?: string | null
          evaluation_notes?: string | null
          evaluator_email?: string | null
          evaluator_phone?: string | null
          evaluator_signature_at?: string | null
          evaluator_signature_name?: string | null
          evaluator_title?: string | null
          flsa_classification?: string | null
          form_submission_id?: string | null
          id?: string
          interview_date?: string | null
          interviewer_name?: string | null
          is_deleted?: boolean
          is_supervisory?: boolean | null
          not_hired_reason?: string | null
          overall_rating?: number | null
          pay_basis?: string | null
          person_id?: string
          position_applied_for?: string | null
          rate_of_pay?: number | null
          recommendation?: string | null
          recommendation_comments?: string | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          strengths_notes?: string | null
          updated_at?: string
          updated_by?: string | null
          was_hired?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_candidate_evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_candidate_evaluations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_candidate_evaluations_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_candidate_evaluations_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_candidate_evaluations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_candidate_evaluations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklist_items: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          document_key: string
          document_record_id: string | null
          due_date: string | null
          id: string
          is_required: boolean
          person_id: string
          reference_id: string
          status: string
          updated_at: string
          updated_by: string | null
          voided_reason: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          document_key: string
          document_record_id?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean
          person_id: string
          reference_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          voided_reason?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          document_key?: string
          document_record_id?: string | null
          due_date?: string | null
          id?: string
          is_required?: boolean
          person_id?: string
          reference_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_items_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_consumer_report_disclosures: {
        Row: {
          address: string | null
          applicant_email: string | null
          applicant_full_legal_name: string | null
          applicant_is_minor: boolean | null
          applicant_phone: string | null
          applicant_signature_at: string | null
          applicant_signature_name: string | null
          authorization_granted: boolean
          background_check_provider: string | null
          city: string | null
          company_id: string
          county: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          deleted_at: string | null
          deleted_by: string | null
          disclosure_acknowledged: boolean
          document_generation_id: string | null
          drivers_license_number: string | null
          drivers_license_state: string | null
          esignature_request_id: string | null
          fcra_summary_version: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          name_on_license: string | null
          other_or_former_names: string | null
          person_id: string
          postal_code: string | null
          reference_id: string
          requests_free_report_copy: boolean | null
          requires_signature: boolean
          screening_provider_address: string | null
          screening_provider_name: string | null
          screening_provider_phone: string | null
          signed_at: string | null
          ssn_encrypted: string | null
          state: string | null
          state_disclosure_jurisdiction: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          applicant_email?: string | null
          applicant_full_legal_name?: string | null
          applicant_is_minor?: boolean | null
          applicant_phone?: string | null
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          authorization_granted?: boolean
          background_check_provider?: string | null
          city?: string | null
          company_id: string
          county?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          disclosure_acknowledged?: boolean
          document_generation_id?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          esignature_request_id?: string | null
          fcra_summary_version?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          name_on_license?: string | null
          other_or_former_names?: string | null
          person_id: string
          postal_code?: string | null
          reference_id: string
          requests_free_report_copy?: boolean | null
          requires_signature?: boolean
          screening_provider_address?: string | null
          screening_provider_name?: string | null
          screening_provider_phone?: string | null
          signed_at?: string | null
          ssn_encrypted?: string | null
          state?: string | null
          state_disclosure_jurisdiction?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          applicant_email?: string | null
          applicant_full_legal_name?: string | null
          applicant_is_minor?: boolean | null
          applicant_phone?: string | null
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          authorization_granted?: boolean
          background_check_provider?: string | null
          city?: string | null
          company_id?: string
          county?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          disclosure_acknowledged?: boolean
          document_generation_id?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          esignature_request_id?: string | null
          fcra_summary_version?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          name_on_license?: string | null
          other_or_former_names?: string | null
          person_id?: string
          postal_code?: string | null
          reference_id?: string
          requests_free_report_copy?: boolean | null
          requires_signature?: boolean
          screening_provider_address?: string | null
          screening_provider_name?: string | null
          screening_provider_phone?: string | null
          signed_at?: string | null
          ssn_encrypted?: string | null
          state?: string | null
          state_disclosure_jurisdiction?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_consumer_report_disclosures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_consumer_report_disclosures_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_consumer_report_disclosures_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_consumer_report_disclosures_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_consumer_report_disclosures_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_consumer_report_disclosures_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_direct_deposits: {
        Row: {
          account_number: string | null
          account_type: string | null
          bank_address_line1: string | null
          bank_address_line2: string | null
          bank_city: string | null
          bank_name: string | null
          bank_phone: string | null
          bank_postal_code: string | null
          bank_state: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          deposit_allocation_type: string
          deposit_amount: number | null
          deposit_percentage: number | null
          document_generation_id: string | null
          employee_address_line1: string | null
          employee_address_line2: string | null
          employee_birthdate: string | null
          employee_city: string | null
          employee_email: string | null
          employee_first_name: string | null
          employee_last_name: string | null
          employee_middle_name: string | null
          employee_other_last_name: string | null
          employee_phone: string | null
          employee_postal_code: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          employee_ssn_encrypted: string | null
          employee_state: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          person_id: string
          reference_id: string
          requires_signature: boolean
          routing_number: string | null
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          bank_address_line1?: string | null
          bank_address_line2?: string | null
          bank_city?: string | null
          bank_name?: string | null
          bank_phone?: string | null
          bank_postal_code?: string | null
          bank_state?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deposit_allocation_type?: string
          deposit_amount?: number | null
          deposit_percentage?: number | null
          document_generation_id?: string | null
          employee_address_line1?: string | null
          employee_address_line2?: string | null
          employee_birthdate?: string | null
          employee_city?: string | null
          employee_email?: string | null
          employee_first_name?: string | null
          employee_last_name?: string | null
          employee_middle_name?: string | null
          employee_other_last_name?: string | null
          employee_phone?: string | null
          employee_postal_code?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employee_ssn_encrypted?: string | null
          employee_state?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          reference_id: string
          requires_signature?: boolean
          routing_number?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          bank_address_line1?: string | null
          bank_address_line2?: string | null
          bank_city?: string | null
          bank_name?: string | null
          bank_phone?: string | null
          bank_postal_code?: string | null
          bank_state?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deposit_allocation_type?: string
          deposit_amount?: number | null
          deposit_percentage?: number | null
          document_generation_id?: string | null
          employee_address_line1?: string | null
          employee_address_line2?: string | null
          employee_birthdate?: string | null
          employee_city?: string | null
          employee_email?: string | null
          employee_first_name?: string | null
          employee_last_name?: string | null
          employee_middle_name?: string | null
          employee_other_last_name?: string | null
          employee_phone?: string | null
          employee_postal_code?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employee_ssn_encrypted?: string | null
          employee_state?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          routing_number?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_direct_deposits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_direct_deposits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_direct_deposits_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_direct_deposits_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_direct_deposits_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_direct_deposits_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_dispute_resolution_acks: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          person_id: string
          policy_version: string | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          policy_version?: string | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          policy_version?: string | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_dispute_resolution_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_dispute_resolution_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_dispute_resolution_acks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_dispute_resolution_acks_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_dispute_resolution_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_dispute_resolution_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_document_clause_acks: {
        Row: {
          authoritative_subject_id: string | null
          authoritative_subject_table: string | null
          capture_mode: string
          captured_at: string | null
          clause_heading: string | null
          clause_key: string
          clause_ordinal: number
          clause_text_snapshot: string
          clause_version: string | null
          company_id: string
          created_at: string
          created_by: string | null
          document_key: string | null
          id: string
          initials: string | null
          is_checked: boolean | null
          is_pointer: boolean
          person_id: string
          subject_id: string
          subject_table: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          authoritative_subject_id?: string | null
          authoritative_subject_table?: string | null
          capture_mode: string
          captured_at?: string | null
          clause_heading?: string | null
          clause_key: string
          clause_ordinal: number
          clause_text_snapshot: string
          clause_version?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          document_key?: string | null
          id?: string
          initials?: string | null
          is_checked?: boolean | null
          is_pointer?: boolean
          person_id: string
          subject_id: string
          subject_table: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          authoritative_subject_id?: string | null
          authoritative_subject_table?: string | null
          capture_mode?: string
          captured_at?: string | null
          clause_heading?: string | null
          clause_key?: string
          clause_ordinal?: number
          clause_text_snapshot?: string
          clause_version?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          document_key?: string | null
          id?: string
          initials?: string | null
          is_checked?: boolean | null
          is_pointer?: boolean
          person_id?: string
          subject_id?: string
          subject_table?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_document_clause_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_document_clause_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_document_clause_acks_document_key_fkey"
            columns: ["document_key"]
            isOneToOne: false
            referencedRelation: "onboarding_document_keys"
            referencedColumns: ["document_key"]
          },
          {
            foreignKeyName: "onboarding_document_clause_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_document_clause_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_document_keys: {
        Row: {
          created_at: string
          destination_table: string
          document_key: string
          is_active: boolean
          is_official_instrument: boolean
          is_required_by_default: boolean
          label: string
          official_instrument_key: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_table: string
          document_key: string
          is_active?: boolean
          is_official_instrument?: boolean
          is_required_by_default?: boolean
          label: string
          official_instrument_key?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_table?: string
          document_key?: string
          is_active?: boolean
          is_official_instrument?: boolean
          is_required_by_default?: boolean
          label?: string
          official_instrument_key?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_emergency_contacts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_id: string
          contact_email: string | null
          contact_name: string
          contact_priority: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_address: string | null
          employee_email: string | null
          employee_first_name: string | null
          employee_last_name: string | null
          employee_middle_initial: string | null
          employee_phone: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_date: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          is_primary_contact: boolean
          person_id: string
          phone_alternate: string | null
          phone_primary: string
          postal_code: string | null
          reference_id: string
          relationship: string | null
          requires_signature: boolean
          signed_at: string | null
          state: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_id: string
          contact_email?: string | null
          contact_name: string
          contact_priority?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_address?: string | null
          employee_email?: string | null
          employee_first_name?: string | null
          employee_last_name?: string | null
          employee_middle_initial?: string | null
          employee_phone?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_date?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          is_primary_contact?: boolean
          person_id: string
          phone_alternate?: string | null
          phone_primary: string
          postal_code?: string | null
          reference_id: string
          relationship?: string | null
          requires_signature?: boolean
          signed_at?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_id?: string
          contact_email?: string | null
          contact_name?: string
          contact_priority?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_address?: string | null
          employee_email?: string | null
          employee_first_name?: string | null
          employee_last_name?: string | null
          employee_middle_initial?: string | null
          employee_phone?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_date?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          is_primary_contact?: boolean
          person_id?: string
          phone_alternate?: string | null
          phone_primary?: string
          postal_code?: string | null
          reference_id?: string
          relationship?: string | null
          requires_signature?: boolean
          signed_at?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_emergency_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_emergency_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_emergency_contacts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_emergency_contacts_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_emergency_contacts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_emergency_contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_employment_applications: {
        Row: {
          able_to_work_overtime: boolean | null
          address_line1: string | null
          address_line2: string | null
          applicant_email: string | null
          applicant_first_name: string | null
          applicant_last_name: string | null
          applicant_middle_name: string | null
          applicant_phone: string | null
          applicant_signature_at: string | null
          applicant_signature_name: string | null
          availability_date: string | null
          california_clauses_applicable: boolean | null
          city: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          desired_pay_rate: number | null
          desired_position: string | null
          document_generation_id: string | null
          education_summary: string | null
          employment_gap_details: string | null
          employment_type_desired: string | null
          esignature_request_id: string | null
          ever_terminated_or_asked_to_resign: boolean | null
          form_submission_id: string | null
          has_employment_gaps_30_days: boolean | null
          how_heard_about_position: string | null
          id: string
          is_18_or_has_work_permit: boolean | null
          is_deleted: boolean
          languages_spoken: string | null
          legally_eligible_to_work: boolean | null
          licenses_certifications_skills: string | null
          office_date_received: string | null
          office_interview_date: string | null
          office_interviewers: string | null
          office_notes: string | null
          office_received_by: string | null
          person_id: string
          postal_code: string | null
          previous_employment_dates: string | null
          previous_positions_held: string | null
          previously_worked_here: boolean | null
          prior_employer_name: string | null
          prior_employer_phone: string | null
          prior_employment_dates: string | null
          prior_name_used: string | null
          reference_contacts_json: Json | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          state: string | null
          status: string
          submitted_on: string | null
          termination_explanation: string | null
          updated_at: string
          updated_by: string | null
          valid_through: string | null
          worked_here_under_different_name: boolean | null
        }
        Insert: {
          able_to_work_overtime?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          applicant_email?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_middle_name?: string | null
          applicant_phone?: string | null
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          availability_date?: string | null
          california_clauses_applicable?: boolean | null
          city?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          desired_pay_rate?: number | null
          desired_position?: string | null
          document_generation_id?: string | null
          education_summary?: string | null
          employment_gap_details?: string | null
          employment_type_desired?: string | null
          esignature_request_id?: string | null
          ever_terminated_or_asked_to_resign?: boolean | null
          form_submission_id?: string | null
          has_employment_gaps_30_days?: boolean | null
          how_heard_about_position?: string | null
          id?: string
          is_18_or_has_work_permit?: boolean | null
          is_deleted?: boolean
          languages_spoken?: string | null
          legally_eligible_to_work?: boolean | null
          licenses_certifications_skills?: string | null
          office_date_received?: string | null
          office_interview_date?: string | null
          office_interviewers?: string | null
          office_notes?: string | null
          office_received_by?: string | null
          person_id: string
          postal_code?: string | null
          previous_employment_dates?: string | null
          previous_positions_held?: string | null
          previously_worked_here?: boolean | null
          prior_employer_name?: string | null
          prior_employer_phone?: string | null
          prior_employment_dates?: string | null
          prior_name_used?: string | null
          reference_contacts_json?: Json | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          state?: string | null
          status?: string
          submitted_on?: string | null
          termination_explanation?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_through?: string | null
          worked_here_under_different_name?: boolean | null
        }
        Update: {
          able_to_work_overtime?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          applicant_email?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_middle_name?: string | null
          applicant_phone?: string | null
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          availability_date?: string | null
          california_clauses_applicable?: boolean | null
          city?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          desired_pay_rate?: number | null
          desired_position?: string | null
          document_generation_id?: string | null
          education_summary?: string | null
          employment_gap_details?: string | null
          employment_type_desired?: string | null
          esignature_request_id?: string | null
          ever_terminated_or_asked_to_resign?: boolean | null
          form_submission_id?: string | null
          has_employment_gaps_30_days?: boolean | null
          how_heard_about_position?: string | null
          id?: string
          is_18_or_has_work_permit?: boolean | null
          is_deleted?: boolean
          languages_spoken?: string | null
          legally_eligible_to_work?: boolean | null
          licenses_certifications_skills?: string | null
          office_date_received?: string | null
          office_interview_date?: string | null
          office_interviewers?: string | null
          office_notes?: string | null
          office_received_by?: string | null
          person_id?: string
          postal_code?: string | null
          previous_employment_dates?: string | null
          previous_positions_held?: string | null
          previously_worked_here?: boolean | null
          prior_employer_name?: string | null
          prior_employer_phone?: string | null
          prior_employment_dates?: string | null
          prior_name_used?: string | null
          reference_contacts_json?: Json | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          state?: string | null
          status?: string
          submitted_on?: string | null
          termination_explanation?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_through?: string | null
          worked_here_under_different_name?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_employment_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_employment_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_employment_applications_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_employment_applications_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_employment_applications_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_employment_applications_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_evaluation_criteria_scores: {
        Row: {
          comments: string | null
          created_at: string
          created_by: string | null
          criterion_key: string
          criterion_ordinal: number
          evaluation_id: string
          id: string
          score: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          created_by?: string | null
          criterion_key: string
          criterion_ordinal: number
          evaluation_id: string
          id?: string
          score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          created_by?: string | null
          criterion_key?: string
          criterion_ordinal?: number
          evaluation_id?: string
          id?: string
          score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_evaluation_criteria_scores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_evaluation_criteria_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "onboarding_candidate_evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_evaluation_criteria_scores_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_handbook_acknowledgments: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          handbook_version: string | null
          id: string
          is_deleted: boolean
          person_id: string
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          handbook_version?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          handbook_version?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_handbook_acknowledgments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_handbook_acknowledgments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_handbook_acknowledgments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_handbook_acknowledgments_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_handbook_acknowledgments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_handbook_acknowledgments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_harassment_policy_acks: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          payroll_user_id_no: string | null
          person_id: string
          policy_version: string | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          payroll_user_id_no?: string | null
          person_id: string
          policy_version?: string | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          payroll_user_id_no?: string | null
          person_id?: string
          policy_version?: string | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_harassment_policy_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_harassment_policy_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_harassment_policy_acks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_harassment_policy_acks_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_harassment_policy_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_harassment_policy_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_health_marketplace_notice_acks: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          notice_variant: string
          person_id: string
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          notice_variant: string
          person_id: string
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          notice_variant?: string
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_health_marketplace_notice_ac_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_health_marketplace_notice_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_health_marketplace_notice_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_health_marketplace_notice_acks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_health_marketplace_notice_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_health_marketplace_notice_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_i9_records: {
        Row: {
          alien_registration_number: string | null
          citizenship_status: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          person_id: string
          reference_id: string
          requires_signature: boolean
          section1_completed_at: string | null
          section2_document_expiration: string | null
          section2_document_number: string | null
          section2_document_title: string | null
          section2_issuing_authority: string | null
          section2_reviewed_at: string | null
          section2_reviewed_by: string | null
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
          work_authorization_expiration: string | null
        }
        Insert: {
          alien_registration_number?: string | null
          citizenship_status?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          reference_id: string
          requires_signature?: boolean
          section1_completed_at?: string | null
          section2_document_expiration?: string | null
          section2_document_number?: string | null
          section2_document_title?: string | null
          section2_issuing_authority?: string | null
          section2_reviewed_at?: string | null
          section2_reviewed_by?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          work_authorization_expiration?: string | null
        }
        Update: {
          alien_registration_number?: string | null
          citizenship_status?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          section1_completed_at?: string | null
          section2_document_expiration?: string | null
          section2_document_number?: string | null
          section2_document_title?: string | null
          section2_issuing_authority?: string | null
          section2_reviewed_at?: string | null
          section2_reviewed_by?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          work_authorization_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_i9_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_i9_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_i9_records_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_i9_records_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_i9_records_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_i9_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_meal_waiver_acks: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          payroll_user_id_no: string | null
          person_id: string
          reference_id: string
          requires_signature: boolean
          revocable_flag: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
          voluntary_flag: boolean
          waiver_type: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          payroll_user_id_no?: string | null
          person_id: string
          reference_id: string
          requires_signature?: boolean
          revocable_flag?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          voluntary_flag?: boolean
          waiver_type?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          payroll_user_id_no?: string | null
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          revocable_flag?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          voluntary_flag?: boolean
          waiver_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_meal_waiver_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_meal_waiver_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_meal_waiver_acks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_meal_waiver_acks_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_meal_waiver_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_meal_waiver_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_offer_letters: {
        Row: {
          base_salary: number | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_acceptance_status: string
          employee_signature_at: string | null
          employee_signature_name: string | null
          employment_type: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          job_title: string | null
          offer_expiration_date: string | null
          pay_frequency: string | null
          person_id: string
          reference_id: string
          reporting_manager_name: string | null
          requires_signature: boolean
          signed_at: string | null
          start_date: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_salary?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_acceptance_status?: string
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employment_type?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          job_title?: string | null
          offer_expiration_date?: string | null
          pay_frequency?: string | null
          person_id: string
          reference_id: string
          reporting_manager_name?: string | null
          requires_signature?: boolean
          signed_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_salary?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_acceptance_status?: string
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employment_type?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          job_title?: string | null
          offer_expiration_date?: string | null
          pay_frequency?: string | null
          person_id?: string
          reference_id?: string
          reporting_manager_name?: string | null
          requires_signature?: boolean
          signed_at?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_offer_letters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_offer_letters_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_offer_letters_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_offer_letters_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_offer_letters_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_required_notice_ack_clauses: {
        Row: {
          ack_id: string
          authoritative_ack_id: string | null
          clause_key: string
          clause_version: string | null
          created_at: string
          created_by: string | null
          id: string
          initialed_at: string | null
          initials: string | null
          is_pointer: boolean
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ack_id: string
          authoritative_ack_id?: string | null
          clause_key: string
          clause_version?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          initialed_at?: string | null
          initials?: string | null
          is_pointer?: boolean
          sort_order: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ack_id?: string
          authoritative_ack_id?: string | null
          clause_key?: string
          clause_version?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          initialed_at?: string | null
          initials?: string | null
          is_pointer?: boolean
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_required_notice_ack_clause_authoritative_ack_id_fkey"
            columns: ["authoritative_ack_id"]
            isOneToOne: false
            referencedRelation: "onboarding_at_will_acknowledgments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notice_ack_clauses_ack_id_fkey"
            columns: ["ack_id"]
            isOneToOne: false
            referencedRelation: "onboarding_required_notices_acks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notice_ack_clauses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notice_ack_clauses_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_required_notice_ack_items: {
        Row: {
          ack_id: string
          acknowledged_at: string | null
          created_at: string
          created_by: string | null
          id: string
          initials: string | null
          notice_version_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          viewed_at: string | null
        }
        Insert: {
          ack_id: string
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          initials?: string | null
          notice_version_id: string
          sort_order: number
          updated_at?: string
          updated_by?: string | null
          viewed_at?: string | null
        }
        Update: {
          ack_id?: string
          acknowledged_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          initials?: string | null
          notice_version_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_required_notice_ack_items_ack_id_fkey"
            columns: ["ack_id"]
            isOneToOne: false
            referencedRelation: "onboarding_required_notices_acks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notice_ack_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notice_ack_items_notice_version_id_fkey"
            columns: ["notice_version_id"]
            isOneToOne: false
            referencedRelation: "notice_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notice_ack_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_required_notices_acks: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_first_name: string | null
          employee_last_name: string | null
          employee_position: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          employment_start_date: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          language_attested: string | null
          notices_included_json: Json | null
          packet_version_id: string | null
          person_id: string
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_first_name?: string | null
          employee_last_name?: string | null
          employee_position?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employment_start_date?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          language_attested?: string | null
          notices_included_json?: Json | null
          packet_version_id?: string | null
          person_id: string
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_first_name?: string | null
          employee_last_name?: string | null
          employee_position?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employment_start_date?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          language_attested?: string | null
          notices_included_json?: Json | null
          packet_version_id?: string | null
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_required_notices_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notices_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notices_acks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notices_acks_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notices_acks_packet_version_id_fkey"
            columns: ["packet_version_id"]
            isOneToOne: false
            referencedRelation: "notice_packet_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notices_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_required_notices_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_self_identification_forms: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          disability_status: string | null
          document_generation_id: string | null
          election: string | null
          employee_name: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          employment_start_date: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          gender_identity: string | null
          id: string
          is_deleted: boolean
          is_hispanic_or_latino: boolean | null
          payroll_user_id_no: string | null
          person_id: string
          race_ethnicity: string | null
          reference_id: string
          requires_signature: boolean
          self_identification_declined: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
          veteran_status: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          disability_status?: string | null
          document_generation_id?: string | null
          election?: string | null
          employee_name?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employment_start_date?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          gender_identity?: string | null
          id?: string
          is_deleted?: boolean
          is_hispanic_or_latino?: boolean | null
          payroll_user_id_no?: string | null
          person_id: string
          race_ethnicity?: string | null
          reference_id: string
          requires_signature?: boolean
          self_identification_declined?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          veteran_status?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          disability_status?: string | null
          document_generation_id?: string | null
          election?: string | null
          employee_name?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employment_start_date?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          gender_identity?: string | null
          id?: string
          is_deleted?: boolean
          is_hispanic_or_latino?: boolean | null
          payroll_user_id_no?: string | null
          person_id?: string
          race_ethnicity?: string | null
          reference_id?: string
          requires_signature?: boolean
          self_identification_declined?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          veteran_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_self_identification_forms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_self_identification_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_self_identification_forms_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_self_identification_forms_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_self_identification_forms_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_self_identification_forms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_surveillance_policy_acks: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          person_id: string
          policy_version: string | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          policy_version?: string | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          policy_version?: string | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_surveillance_policy_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_surveillance_policy_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_surveillance_policy_acks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_surveillance_policy_acks_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_surveillance_policy_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_surveillance_policy_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_time_of_hire_pamphlet_acks: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          person_id: string
          policy_version: string | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          policy_version?: string | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          policy_version?: string | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_time_of_hire_pamphlet_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_time_of_hire_pamphlet_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_time_of_hire_pamphlet_acks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_time_of_hire_pamphlet_acks_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_time_of_hire_pamphlet_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_time_of_hire_pamphlet_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_w4_elections: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deductions_amount: number
          deleted_at: string | null
          deleted_by: string | null
          dependents_amount: number
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          exempt_flag: boolean
          extra_withholding_amount: number
          filing_status: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          multiple_jobs_flag: boolean
          other_income_amount: number
          person_id: string
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          tax_year: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deductions_amount?: number
          deleted_at?: string | null
          deleted_by?: string | null
          dependents_amount?: number
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          exempt_flag?: boolean
          extra_withholding_amount?: number
          filing_status?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          multiple_jobs_flag?: boolean
          other_income_amount?: number
          person_id: string
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          tax_year: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deductions_amount?: number
          deleted_at?: string | null
          deleted_by?: string | null
          dependents_amount?: number
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          exempt_flag?: boolean
          extra_withholding_amount?: number
          filing_status?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          multiple_jobs_flag?: boolean
          other_income_amount?: number
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          tax_year?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_w4_elections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_w4_elections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_w4_elections_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_w4_elections_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_w4_elections_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_w4_elections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_wage_notice_acks: {
        Row: {
          acknowledged_flag: boolean
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          employer_address: string | null
          employer_dba_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          pay_designated_payday: string | null
          pay_rate: number | null
          pay_rate_basis: string | null
          person_id: string
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          acknowledged_flag?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employer_address?: string | null
          employer_dba_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          pay_designated_payday?: string | null
          pay_rate?: number | null
          pay_rate_basis?: string | null
          person_id: string
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          acknowledged_flag?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          employer_address?: string | null
          employer_dba_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          pay_designated_payday?: string | null
          pay_rate?: number | null
          pay_rate_basis?: string | null
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_wage_notice_acks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wage_notice_acks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wage_notice_acks_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wage_notice_acks_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wage_notice_acks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wage_notice_acks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_wotc_8850_forms: {
        Row: {
          age: string | null
          applicant_signature_at: string | null
          applicant_signature_name: string | null
          city_state_zip: string | null
          company_id: string
          conditional_certification_flag: boolean
          created_at: string
          created_by: string | null
          date_hired: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          eligibility_line_1: string | null
          eligibility_line_2: string | null
          eligibility_line_3: string | null
          eligibility_line_4: string | null
          eligibility_line_5: string | null
          eligibility_line_6: string | null
          eligibility_line_7: string | null
          employee_name: string | null
          employee_signature_at_text: string | null
          employer_signature_at: string | null
          employer_signature_name: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          job_offer_date: string | null
          payroll_user_id_no: string | null
          person_id: string
          phone: string | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          ssn_encrypted: string | null
          start_date: string | null
          status: string
          street_address: string | null
          target_group_category: string | null
          todays_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          age?: string | null
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          city_state_zip?: string | null
          company_id: string
          conditional_certification_flag?: boolean
          created_at?: string
          created_by?: string | null
          date_hired?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          eligibility_line_1?: string | null
          eligibility_line_2?: string | null
          eligibility_line_3?: string | null
          eligibility_line_4?: string | null
          eligibility_line_5?: string | null
          eligibility_line_6?: string | null
          eligibility_line_7?: string | null
          employee_name?: string | null
          employee_signature_at_text?: string | null
          employer_signature_at?: string | null
          employer_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          job_offer_date?: string | null
          payroll_user_id_no?: string | null
          person_id: string
          phone?: string | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          ssn_encrypted?: string | null
          start_date?: string | null
          status?: string
          street_address?: string | null
          target_group_category?: string | null
          todays_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          age?: string | null
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          city_state_zip?: string | null
          company_id?: string
          conditional_certification_flag?: boolean
          created_at?: string
          created_by?: string | null
          date_hired?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          eligibility_line_1?: string | null
          eligibility_line_2?: string | null
          eligibility_line_3?: string | null
          eligibility_line_4?: string | null
          eligibility_line_5?: string | null
          eligibility_line_6?: string | null
          eligibility_line_7?: string | null
          employee_name?: string | null
          employee_signature_at_text?: string | null
          employer_signature_at?: string | null
          employer_signature_name?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          job_offer_date?: string | null
          payroll_user_id_no?: string | null
          person_id?: string
          phone?: string | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          ssn_encrypted?: string | null
          start_date?: string | null
          status?: string
          street_address?: string | null
          target_group_category?: string | null
          todays_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_wotc_8850_forms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_8850_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_8850_forms_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_8850_forms_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_8850_forms_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_8850_forms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_wotc_9061_forms: {
        Row: {
          applicant_signature_at: string | null
          applicant_signature_name: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_generation_id: string | null
          esignature_request_id: string | null
          form_submission_id: string | null
          id: string
          is_deleted: boolean
          person_id: string
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          submission_date: string | null
          ta_agency_name: string | null
          target_group_category: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          submission_date?: string | null
          ta_agency_name?: string | null
          target_group_category?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_generation_id?: string | null
          esignature_request_id?: string | null
          form_submission_id?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          submission_date?: string | null
          ta_agency_name?: string | null
          target_group_category?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_wotc_9061_forms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_9061_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_9061_forms_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_9061_forms_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_9061_forms_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_wotc_9061_forms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          display_name: string
          first_name: string
          id: string
          last_name: string
          manager_id: string | null
          middle_name: string | null
          photo_path: string | null
          preferred_name: string | null
          reference_id: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          display_name: string
          first_name: string
          id?: string
          last_name: string
          manager_id?: string | null
          middle_name?: string | null
          photo_path?: string | null
          preferred_name?: string | null
          reference_id: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          display_name?: string
          first_name?: string
          id?: string
          last_name?: string
          manager_id?: string | null
          middle_name?: string | null
          photo_path?: string | null
          preferred_name?: string | null
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
          {
            foreignKeyName: "people_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people_medical_provider_designations: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          designation_type: string
          document_generation_id: string | null
          effective_from: string
          effective_to: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          esignature_request_id: string | null
          form_number: string
          form_submission_id: string | null
          health_plan_name: string | null
          id: string
          is_deleted: boolean
          person_id: string
          physician_signature_at: string | null
          physician_signature_name: string | null
          provider_city: string | null
          provider_name: string | null
          provider_phone: string | null
          provider_postal_code: string | null
          provider_state: string | null
          provider_street: string | null
          reference_id: string
          requires_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          designation_type: string
          document_generation_id?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_number: string
          form_submission_id?: string | null
          health_plan_name?: string | null
          id?: string
          is_deleted?: boolean
          person_id: string
          physician_signature_at?: string | null
          physician_signature_name?: string | null
          provider_city?: string | null
          provider_name?: string | null
          provider_phone?: string | null
          provider_postal_code?: string | null
          provider_state?: string | null
          provider_street?: string | null
          reference_id: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          designation_type?: string
          document_generation_id?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          esignature_request_id?: string | null
          form_number?: string
          form_submission_id?: string | null
          health_plan_name?: string | null
          id?: string
          is_deleted?: boolean
          person_id?: string
          physician_signature_at?: string | null
          physician_signature_name?: string | null
          provider_city?: string | null
          provider_name?: string | null
          provider_phone?: string | null
          provider_postal_code?: string | null
          provider_state?: string | null
          provider_street?: string | null
          reference_id?: string
          requires_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_medical_provider_designations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_medical_provider_designations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_medical_provider_designations_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_medical_provider_designations_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_medical_provider_designations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_medical_provider_designations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_feedback_responses: {
        Row: {
          comment: string | null
          competency_id: string | null
          created_at: string | null
          id: string
          participant_id: string
          rating: number | null
          review_id: string
          section_id: string | null
        }
        Insert: {
          comment?: string | null
          competency_id?: string | null
          created_at?: string | null
          id?: string
          participant_id: string
          rating?: number | null
          review_id: string
          section_id?: string | null
        }
        Update: {
          comment?: string | null
          competency_id?: string | null
          created_at?: string | null
          id?: string
          participant_id?: string
          rating?: number | null
          review_id?: string
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_feedback_responses_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_feedback_responses_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "performance_review_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_feedback_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_feedback_responses_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "performance_review_template_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_feedback_settings: {
        Row: {
          company_id: string
          min_responses_for_release: number
          release_verbatim_comments: boolean
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          company_id: string
          min_responses_for_release?: number
          release_verbatim_comments?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          min_responses_for_release?: number
          release_verbatim_comments?: boolean
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_feedback_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_feedback_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_review_competencies: {
        Row: {
          comments: string | null
          competency_id: string
          created_at: string | null
          id: string
          is_inherited: boolean
          rating: number | null
          review_id: string
          sort_order: number
        }
        Insert: {
          comments?: string | null
          competency_id: string
          created_at?: string | null
          id?: string
          is_inherited?: boolean
          rating?: number | null
          review_id: string
          sort_order?: number
        }
        Update: {
          comments?: string | null
          competency_id?: string
          created_at?: string | null
          id?: string
          is_inherited?: boolean
          rating?: number | null
          review_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_review_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_review_competencies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_review_participants: {
        Row: {
          approved_by: string | null
          company_id: string
          created_at: string | null
          declined_reason: string | null
          id: string
          invited_by: string | null
          nominated_by: string | null
          participant_type: string
          person_id: string
          responded_at: string | null
          review_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          created_at?: string | null
          declined_reason?: string | null
          id?: string
          invited_by?: string | null
          nominated_by?: string | null
          participant_type: string
          person_id: string
          responded_at?: string | null
          review_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          created_at?: string | null
          declined_reason?: string | null
          id?: string
          invited_by?: string | null
          nominated_by?: string | null
          participant_type?: string
          person_id?: string
          responded_at?: string | null
          review_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_review_participants_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_review_participants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_review_participants_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_review_participants_nominated_by_fkey"
            columns: ["nominated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_review_participants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_review_participants_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_review_template_sections: {
        Row: {
          created_at: string | null
          id: string
          prompt: string | null
          response_type: string
          section_title: string
          sort_order: number
          template_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt?: string | null
          response_type?: string
          section_title: string
          sort_order?: number
          template_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt?: string | null
          response_type?: string
          section_title?: string
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_review_template_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "performance_review_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_review_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          effective_from: string | null
          id: string
          reference_id: string
          status: string
          template_name: string
          updated_at: string | null
          version_number: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          effective_from?: string | null
          id?: string
          reference_id: string
          status?: string
          template_name: string
          updated_at?: string | null
          version_number?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          effective_from?: string | null
          id?: string
          reference_id?: string
          status?: string
          template_name?: string
          updated_at?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_review_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_review_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          acknowledged_at: string | null
          company_id: string
          created_at: string | null
          created_by: string
          document_generation_id: string | null
          due_date: string | null
          employee_comments: string | null
          esignature_request_id: string | null
          feedback_closed_at: string | null
          feedback_closed_reason: string | null
          goals_summary: string | null
          id: string
          improvement_summary: string | null
          is_multi_rater: boolean
          job_description_id: string | null
          overall_rating: number | null
          person_id: string
          reference_id: string
          review_activity_id: string | null
          review_period_end: string
          review_period_start: string
          review_type: string
          reviewer_comments: string | null
          reviewer_user_id: string
          status: string
          strengths_summary: string | null
          template_id: string | null
          updated_at: string | null
          updated_by: string
          waiver_reason: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          document_generation_id?: string | null
          due_date?: string | null
          employee_comments?: string | null
          esignature_request_id?: string | null
          feedback_closed_at?: string | null
          feedback_closed_reason?: string | null
          goals_summary?: string | null
          id?: string
          improvement_summary?: string | null
          is_multi_rater?: boolean
          job_description_id?: string | null
          overall_rating?: number | null
          person_id: string
          reference_id: string
          review_activity_id?: string | null
          review_period_end: string
          review_period_start: string
          review_type: string
          reviewer_comments?: string | null
          reviewer_user_id: string
          status?: string
          strengths_summary?: string | null
          template_id?: string | null
          updated_at?: string | null
          updated_by: string
          waiver_reason?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          document_generation_id?: string | null
          due_date?: string | null
          employee_comments?: string | null
          esignature_request_id?: string | null
          feedback_closed_at?: string | null
          feedback_closed_reason?: string | null
          goals_summary?: string | null
          id?: string
          improvement_summary?: string | null
          is_multi_rater?: boolean
          job_description_id?: string | null
          overall_rating?: number | null
          person_id?: string
          reference_id?: string
          review_activity_id?: string | null
          review_period_end?: string
          review_period_start?: string
          review_type?: string
          reviewer_comments?: string | null
          reviewer_user_id?: string
          status?: string
          strengths_summary?: string | null
          template_id?: string | null
          updated_at?: string | null
          updated_by?: string
          waiver_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_job_description_id_fkey"
            columns: ["job_description_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_review_activity_id_fkey"
            columns: ["review_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_template_fk"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "performance_review_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      person_employment_states: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          effective_from: string
          effective_to: string | null
          id: string
          person_id: string
          reason: string | null
          reference_id: string
          source_entity_id: string | null
          source_entity_type: string | null
          source_module: string | null
          state: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          person_id: string
          reason?: string | null
          reference_id: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string | null
          state: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          person_id?: string
          reason?: string | null
          reference_id?: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_module?: string | null
          state?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_employment_states_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_employment_states_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_employment_states_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_employment_states_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      priorities: {
        Row: {
          color_token: string | null
          created_at: string
          display_order: number | null
          id: string
          priority_name: string
        }
        Insert: {
          color_token?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          priority_name: string
        }
        Update: {
          color_token?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          priority_name?: string
        }
        Relationships: []
      }
      property_assignments: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          employee_ack_maintain: boolean
          employee_ack_policy: boolean
          employee_ack_receipt: boolean
          employee_ack_report_loss: boolean
          employee_return_signature_at: string | null
          employee_return_signature_name: string | null
          employee_signature_at: string | null
          employee_signature_name: string | null
          id: string
          is_deleted: boolean
          issuance_condition_notes: string | null
          issued_at: string
          issued_by: string
          issuer_title: string | null
          person_id: string
          property_item_id: string
          quantity: number
          received_by: string | null
          receiver_title: string | null
          reference_id: string
          return_ack_liability: boolean | null
          return_ack_maintained: boolean | null
          return_ack_returned: boolean | null
          return_condition_notes: string | null
          returned_at: string | null
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          employee_ack_maintain?: boolean
          employee_ack_policy?: boolean
          employee_ack_receipt?: boolean
          employee_ack_report_loss?: boolean
          employee_return_signature_at?: string | null
          employee_return_signature_name?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          id?: string
          is_deleted?: boolean
          issuance_condition_notes?: string | null
          issued_at?: string
          issued_by: string
          issuer_title?: string | null
          person_id: string
          property_item_id: string
          quantity?: number
          received_by?: string | null
          receiver_title?: string | null
          reference_id: string
          return_ack_liability?: boolean | null
          return_ack_maintained?: boolean | null
          return_ack_returned?: boolean | null
          return_condition_notes?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          employee_ack_maintain?: boolean
          employee_ack_policy?: boolean
          employee_ack_receipt?: boolean
          employee_ack_report_loss?: boolean
          employee_return_signature_at?: string | null
          employee_return_signature_name?: string | null
          employee_signature_at?: string | null
          employee_signature_name?: string | null
          id?: string
          is_deleted?: boolean
          issuance_condition_notes?: string | null
          issued_at?: string
          issued_by?: string
          issuer_title?: string | null
          person_id?: string
          property_item_id?: string
          quantity?: number
          received_by?: string | null
          receiver_title?: string | null
          reference_id?: string
          return_ack_liability?: boolean | null
          return_ack_maintained?: boolean | null
          return_ack_returned?: boolean | null
          return_condition_notes?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_property_item_id_fkey"
            columns: ["property_item_id"]
            isOneToOne: false
            referencedRelation: "property_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      property_items: {
        Row: {
          acquisition_date: string | null
          category: string
          company_id: string
          condition_notes: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          is_deleted: boolean
          name: string
          quantity_available: number
          quantity_total: number
          reference_id: string
          serial_number: string | null
          status: string
          unit_cost: number | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          acquisition_date?: string | null
          category?: string
          company_id: string
          condition_notes?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          quantity_available: number
          quantity_total?: number
          reference_id: string
          serial_number?: string | null
          status?: string
          unit_cost?: number | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          acquisition_date?: string | null
          category?: string
          company_id?: string
          condition_notes?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          quantity_available?: number
          quantity_total?: number
          reference_id?: string
          serial_number?: string | null
          status?: string
          unit_cost?: number | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_items_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          author: string | null
          created_at: string
          id: string
          is_active: boolean
          quote_text: string
          source_citation: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          quote_text: string
          source_citation?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          quote_text?: string
          source_citation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recruiting_application_stage_history: {
        Row: {
          application_id: string
          from_stage_id: string | null
          id: string
          moved_at: string | null
          moved_by: string | null
          note: string | null
          to_stage_id: string | null
        }
        Insert: {
          application_id: string
          from_stage_id?: string | null
          id?: string
          moved_at?: string | null
          moved_by?: string | null
          note?: string | null
          to_stage_id?: string | null
        }
        Update: {
          application_id?: string
          from_stage_id?: string | null
          id?: string
          moved_at?: string | null
          moved_by?: string | null
          note?: string | null
          to_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_application_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recruiting_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_application_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "recruiting_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_application_stage_history_moved_by_fkey"
            columns: ["moved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_application_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "recruiting_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_applications: {
        Row: {
          availability_date: string | null
          company_id: string
          cover_note: string | null
          created_at: string | null
          created_by: string | null
          current_stage_id: string | null
          desired_pay_rate: number | null
          employment_type_desired: string | null
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_at: string | null
          lifecycle: string
          person_id: string
          reference_id: string
          rejection_note: string | null
          rejection_reason_id: string | null
          requisition_id: string
          source: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          availability_date?: string | null
          company_id: string
          cover_note?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage_id?: string | null
          desired_pay_rate?: number | null
          employment_type_desired?: string | null
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          lifecycle?: string
          person_id: string
          reference_id: string
          rejection_note?: string | null
          rejection_reason_id?: string | null
          requisition_id: string
          source?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          availability_date?: string | null
          company_id?: string
          cover_note?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stage_id?: string | null
          desired_pay_rate?: number | null
          employment_type_desired?: string | null
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_at?: string | null
          lifecycle?: string
          person_id?: string
          reference_id?: string
          rejection_note?: string | null
          rejection_reason_id?: string | null
          requisition_id?: string
          source?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_applications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_applications_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "recruiting_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_applications_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_applications_rejection_reason_id_fkey"
            columns: ["rejection_reason_id"]
            isOneToOne: false
            referencedRelation: "recruiting_rejection_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_applications_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "recruiting_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_eeo_self_identification: {
        Row: {
          application_id: string
          company_id: string
          declined_to_state: boolean
          disability_status: string | null
          gender: string | null
          id: string
          race_ethnicity: string | null
          submitted_at: string | null
          veteran_status: string | null
        }
        Insert: {
          application_id: string
          company_id: string
          declined_to_state?: boolean
          disability_status?: string | null
          gender?: string | null
          id?: string
          race_ethnicity?: string | null
          submitted_at?: string | null
          veteran_status?: string | null
        }
        Update: {
          application_id?: string
          company_id?: string
          declined_to_state?: boolean
          disability_status?: string | null
          gender?: string | null
          id?: string
          race_ethnicity?: string | null
          submitted_at?: string | null
          veteran_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_eeo_self_identification_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "recruiting_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_eeo_self_identification_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_offers: {
        Row: {
          accepted_at: string | null
          application_id: string
          base_salary: number | null
          company_id: string
          created_at: string | null
          created_by: string | null
          decline_reason: string | null
          declined_at: string | null
          document_generation_id: string | null
          employment_type: string | null
          esignature_request_id: string | null
          id: string
          job_assignment_id: string | null
          job_title: string
          offer_expiration_date: string | null
          pay_frequency: string | null
          reference_id: string
          reporting_manager_person_id: string | null
          requires_approval: boolean
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          application_id: string
          base_salary?: number | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          document_generation_id?: string | null
          employment_type?: string | null
          esignature_request_id?: string | null
          id?: string
          job_assignment_id?: string | null
          job_title: string
          offer_expiration_date?: string | null
          pay_frequency?: string | null
          reference_id: string
          reporting_manager_person_id?: string | null
          requires_approval?: boolean
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          application_id?: string
          base_salary?: number | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          decline_reason?: string | null
          declined_at?: string | null
          document_generation_id?: string | null
          employment_type?: string | null
          esignature_request_id?: string | null
          id?: string
          job_assignment_id?: string | null
          job_title?: string
          offer_expiration_date?: string | null
          pay_frequency?: string | null
          reference_id?: string
          reporting_manager_person_id?: string | null
          requires_approval?: boolean
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recruiting_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_offers_document_generation_id_fkey"
            columns: ["document_generation_id"]
            isOneToOne: false
            referencedRelation: "document_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_offers_esignature_request_id_fkey"
            columns: ["esignature_request_id"]
            isOneToOne: false
            referencedRelation: "esignature_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_offers_job_assignment_id_fkey"
            columns: ["job_assignment_id"]
            isOneToOne: false
            referencedRelation: "job_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_offers_reporting_manager_person_id_fkey"
            columns: ["reporting_manager_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_pipeline_stages: {
        Row: {
          category: string
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          sort_order: number
          stage_key: string
          stage_name: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          stage_key: string
          stage_name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          stage_key?: string
          stage_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_pipeline_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_rejection_reasons: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          reason_key: string
          reason_text: string
          sort_order: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          reason_key: string
          reason_text: string
          sort_order?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          reason_key?: string
          reason_text?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_rejection_reasons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiting_requisitions: {
        Row: {
          closed_at: string | null
          company_id: string
          created_at: string | null
          created_by: string
          department: string | null
          employment_type: string | null
          headcount: number
          hiring_manager_person_id: string | null
          id: string
          job_id: string | null
          location: string | null
          opened_at: string | null
          reference_id: string
          requires_approval: boolean
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          department?: string | null
          employment_type?: string | null
          headcount?: number
          hiring_manager_person_id?: string | null
          id?: string
          job_id?: string | null
          location?: string | null
          opened_at?: string | null
          reference_id: string
          requires_approval?: boolean
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          department?: string | null
          employment_type?: string | null
          headcount?: number
          hiring_manager_person_id?: string | null
          id?: string
          job_id?: string | null
          location?: string | null
          opened_at?: string | null
          reference_id?: string
          requires_approval?: boolean
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiting_requisitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_requisitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_requisitions_hiring_manager_person_id_fkey"
            columns: ["hiring_manager_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruiting_requisitions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      role_auth_policies: {
        Row: {
          allowed_factors: string[]
          notes: string | null
          requires_mfa: boolean
          role_name: string
          updated_at: string
        }
        Insert: {
          allowed_factors?: string[]
          notes?: string | null
          requires_mfa?: boolean
          role_name: string
          updated_at?: string
        }
        Update: {
          allowed_factors?: string[]
          notes?: string | null
          requires_mfa?: boolean
          role_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          role_name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          role_name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
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
      schedule_assignments: {
        Row: {
          assignment_note: string | null
          company_id: string
          created_at: string | null
          created_by: string
          effective_from: string
          effective_to: string | null
          id: string
          person_id: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          assignment_note?: string | null
          company_id: string
          created_at?: string | null
          created_by: string
          effective_from: string
          effective_to?: string | null
          id?: string
          person_id: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          assignment_note?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          person_id?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_template_days: {
        Row: {
          day_of_week: number
          end_time: string | null
          id: string
          is_working_day: boolean
          start_time: string | null
          template_id: string
          unpaid_break_minutes: number
        }
        Insert: {
          day_of_week: number
          end_time?: string | null
          id?: string
          is_working_day?: boolean
          start_time?: string | null
          template_id: string
          unpaid_break_minutes?: number
        }
        Update: {
          day_of_week?: number
          end_time?: string | null
          id?: string
          is_working_day?: boolean
          start_time?: string | null
          template_id?: string
          unpaid_break_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_template_days_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          reference_id: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          reference_id: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reference_id?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_shifts: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          is_holiday: boolean
          override_reason: string | null
          person_id: string
          shift_date: string
          source: string
          source_assignment_id: string | null
          start_time: string
          unpaid_break_minutes: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          is_holiday?: boolean
          override_reason?: string | null
          person_id: string
          shift_date: string
          source?: string
          source_assignment_id?: string | null
          start_time: string
          unpaid_break_minutes?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          is_holiday?: boolean
          override_reason?: string | null
          person_id?: string
          shift_date?: string
          source?: string
          source_assignment_id?: string | null
          start_time?: string
          unpaid_break_minutes?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_shifts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_shifts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_shifts_source_assignment_id_fkey"
            columns: ["source_assignment_id"]
            isOneToOne: false
            referencedRelation: "schedule_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      statuses: {
        Row: {
          category: string
          color_token: string | null
          created_at: string
          display_order: number | null
          id: string
          status_name: string
        }
        Insert: {
          category: string
          color_token?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          status_name: string
        }
        Update: {
          category?: string
          color_token?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          status_name?: string
        }
        Relationships: []
      }
      sub_activities: {
        Row: {
          activity_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string
          description_plain_text: string | null
          id: string
          reference_id: string
          scheduled_at: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          activity_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description_plain_text?: string | null
          id?: string
          reference_id: string
          scheduled_at?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          activity_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description_plain_text?: string | null
          id?: string
          reference_id?: string
          scheduled_at?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_activities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_activities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          calculated_progress_percent: number
          created_at: string
          created_by: string
          description_plain_text: string | null
          description_rich_text: Json | null
          due_date: string | null
          id: string
          manual_progress_percent: number
          overall_progress_percent: number
          priority_id: string | null
          reference_id: string
          sort_order: number
          status_id: string
          task_id: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          calculated_progress_percent?: number
          created_at?: string
          created_by: string
          description_plain_text?: string | null
          description_rich_text?: Json | null
          due_date?: string | null
          id?: string
          manual_progress_percent?: number
          overall_progress_percent?: number
          priority_id?: string | null
          reference_id: string
          sort_order?: number
          status_id: string
          task_id: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          calculated_progress_percent?: number
          created_at?: string
          created_by?: string
          description_plain_text?: string | null
          description_rich_text?: Json | null
          due_date?: string | null
          id?: string
          manual_progress_percent?: number
          overall_progress_percent?: number
          priority_id?: string | null
          reference_id?: string
          sort_order?: number
          status_id?: string
          task_id?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
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
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          reference_id: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          assignment_type: string
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          reference_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          assignment_type?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reference_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
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
          assigned_date: string
          calculated_progress_percent: number | null
          company_id: string
          completed_date: string | null
          created_at: string
          created_by: string
          description_plain_text: string | null
          description_rich_text: Json | null
          detailed_instructions_plain_text: string | null
          detailed_instructions_rich_text: Json | null
          due_date: string | null
          id: string
          manual_progress_percent: number | null
          priority_id: string | null
          reference_id: string
          start_date: string | null
          status_id: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          assigned_date?: string
          calculated_progress_percent?: number | null
          company_id: string
          completed_date?: string | null
          created_at?: string
          created_by: string
          description_plain_text?: string | null
          description_rich_text?: Json | null
          detailed_instructions_plain_text?: string | null
          detailed_instructions_rich_text?: Json | null
          due_date?: string | null
          id?: string
          manual_progress_percent?: number | null
          priority_id?: string | null
          reference_id: string
          start_date?: string | null
          status_id: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          assigned_date?: string
          calculated_progress_percent?: number | null
          company_id?: string
          completed_date?: string | null
          created_at?: string
          created_by?: string
          description_plain_text?: string | null
          description_rich_text?: Json | null
          detailed_instructions_plain_text?: string | null
          detailed_instructions_rich_text?: Json | null
          due_date?: string | null
          id?: string
          manual_progress_percent?: number | null
          priority_id?: string | null
          reference_id?: string
          start_date?: string | null
          status_id?: string
          title?: string
          updated_at?: string
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
      training_assignments: {
        Row: {
          assigned_by: string
          company_id: string
          course_id: string
          created_at: string | null
          due_date: string | null
          id: string
          person_id: string
          reference_id: string
          status: string
          updated_at: string | null
          waived_reason: string | null
        }
        Insert: {
          assigned_by: string
          company_id: string
          course_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          person_id: string
          reference_id: string
          status?: string
          updated_at?: string | null
          waived_reason?: string | null
        }
        Update: {
          assigned_by?: string
          company_id?: string
          course_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          person_id?: string
          reference_id?: string
          status?: string
          updated_at?: string | null
          waived_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      training_completions: {
        Row: {
          assignment_id: string | null
          attachment_id: string | null
          company_id: string
          completed_at: string
          completion_method: string
          course_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          person_id: string
          recorded_by: string
          recurrence_months_at_completion: number | null
          reference_id: string
        }
        Insert: {
          assignment_id?: string | null
          attachment_id?: string | null
          company_id: string
          completed_at?: string
          completion_method: string
          course_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          person_id: string
          recorded_by: string
          recurrence_months_at_completion?: number | null
          reference_id: string
        }
        Update: {
          assignment_id?: string | null
          attachment_id?: string | null
          company_id?: string
          completed_at?: string
          completion_method?: string
          course_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          person_id?: string
          recorded_by?: string
          recurrence_months_at_completion?: number | null
          reference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_completions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "training_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_completions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_completions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_completions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          category: string
          company_id: string | null
          course_key: string
          created_at: string | null
          created_by: string
          delivery_mode: string
          description: string | null
          duration_minutes: number | null
          external_url: string | null
          id: string
          is_active: boolean
          recurrence_months: number | null
          reference_id: string
          requires_evidence: boolean
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          company_id?: string | null
          course_key: string
          created_at?: string | null
          created_by: string
          delivery_mode?: string
          description?: string | null
          duration_minutes?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          recurrence_months?: number | null
          reference_id: string
          requires_evidence?: boolean
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          course_key?: string
          created_at?: string | null
          created_by?: string
          delivery_mode?: string
          description?: string | null
          duration_minutes?: number | null
          external_url?: string | null
          id?: string
          is_active?: boolean
          recurrence_months?: number | null
          reference_id?: string
          requires_evidence?: boolean
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mfa_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mfa_recovery_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trusted_devices: {
        Row: {
          device_token: string
          first_seen_at: string
          id: string
          label: string | null
          last_seen_at: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          device_token: string
          first_seen_at?: string
          id?: string
          label?: string | null
          last_seen_at?: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          device_token?: string
          first_seen_at?: string
          id?: string
          label?: string | null
          last_seen_at?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          email: string
          id: string
          is_admin: boolean | null
          person_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          person_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          person_id?: string | null
          updated_at?: string
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
            foreignKeyName: "users_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users"
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
          created_at: string
          created_by: string
          from_status_id: string | null
          id: string
          reason: string | null
          task_id: string
          to_status_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          from_status_id?: string | null
          id?: string
          reason?: string | null
          task_id: string
          to_status_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
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
            foreignKeyName: "workflow_transitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
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
          {
            foreignKeyName: "workflow_transitions_to_status_id_fkey"
            columns: ["to_status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mhd_task_reference_options: {
        Row: {
          category: string | null
          color_token: string | null
          display_order: number | null
          id: string | null
          label: string | null
          option_group: string | null
        }
        Relationships: []
      }
      onboarding_employment_applications_applicant_view: {
        Row: {
          able_to_work_overtime: boolean | null
          address_line1: string | null
          address_line2: string | null
          applicant_email: string | null
          applicant_first_name: string | null
          applicant_last_name: string | null
          applicant_middle_name: string | null
          applicant_phone: string | null
          applicant_signature_at: string | null
          applicant_signature_name: string | null
          availability_date: string | null
          california_clauses_applicable: boolean | null
          city: string | null
          company_id: string | null
          created_at: string | null
          desired_pay_rate: number | null
          desired_position: string | null
          employment_gap_details: string | null
          employment_type_desired: string | null
          ever_terminated_or_asked_to_resign: boolean | null
          form_submission_id: string | null
          has_employment_gaps_30_days: boolean | null
          how_heard_about_position: string | null
          id: string | null
          is_18_or_has_work_permit: boolean | null
          languages_spoken: string | null
          legally_eligible_to_work: boolean | null
          licenses_certifications_skills: string | null
          person_id: string | null
          postal_code: string | null
          previous_employment_dates: string | null
          previous_positions_held: string | null
          previously_worked_here: boolean | null
          prior_name_used: string | null
          reference_id: string | null
          requires_signature: boolean | null
          signed_at: string | null
          state: string | null
          status: string | null
          submitted_on: string | null
          termination_explanation: string | null
          updated_at: string | null
          valid_through: string | null
          worked_here_under_different_name: boolean | null
        }
        Insert: {
          able_to_work_overtime?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          applicant_email?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_middle_name?: string | null
          applicant_phone?: string | null
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          availability_date?: string | null
          california_clauses_applicable?: boolean | null
          city?: string | null
          company_id?: string | null
          created_at?: string | null
          desired_pay_rate?: number | null
          desired_position?: string | null
          employment_gap_details?: string | null
          employment_type_desired?: string | null
          ever_terminated_or_asked_to_resign?: boolean | null
          form_submission_id?: string | null
          has_employment_gaps_30_days?: boolean | null
          how_heard_about_position?: string | null
          id?: string | null
          is_18_or_has_work_permit?: boolean | null
          languages_spoken?: string | null
          legally_eligible_to_work?: boolean | null
          licenses_certifications_skills?: string | null
          person_id?: string | null
          postal_code?: string | null
          previous_employment_dates?: string | null
          previous_positions_held?: string | null
          previously_worked_here?: boolean | null
          prior_name_used?: string | null
          reference_id?: string | null
          requires_signature?: boolean | null
          signed_at?: string | null
          state?: string | null
          status?: string | null
          submitted_on?: string | null
          termination_explanation?: string | null
          updated_at?: string | null
          valid_through?: string | null
          worked_here_under_different_name?: boolean | null
        }
        Update: {
          able_to_work_overtime?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          applicant_email?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_middle_name?: string | null
          applicant_phone?: string | null
          applicant_signature_at?: string | null
          applicant_signature_name?: string | null
          availability_date?: string | null
          california_clauses_applicable?: boolean | null
          city?: string | null
          company_id?: string | null
          created_at?: string | null
          desired_pay_rate?: number | null
          desired_position?: string | null
          employment_gap_details?: string | null
          employment_type_desired?: string | null
          ever_terminated_or_asked_to_resign?: boolean | null
          form_submission_id?: string | null
          has_employment_gaps_30_days?: boolean | null
          how_heard_about_position?: string | null
          id?: string | null
          is_18_or_has_work_permit?: boolean | null
          languages_spoken?: string | null
          legally_eligible_to_work?: boolean | null
          licenses_certifications_skills?: string | null
          person_id?: string | null
          postal_code?: string | null
          previous_employment_dates?: string | null
          previous_positions_held?: string | null
          previously_worked_here?: boolean | null
          prior_name_used?: string | null
          reference_id?: string | null
          requires_signature?: boolean | null
          signed_at?: string | null
          state?: string | null
          status?: string | null
          submitted_on?: string | null
          termination_explanation?: string | null
          updated_at?: string | null
          valid_through?: string | null
          worked_here_under_different_name?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_employment_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_employment_applications_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_employment_applications_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      v_employment_applications_validity: {
        Row: {
          applicant_first_name: string | null
          applicant_last_name: string | null
          company_id: string | null
          days_remaining: number | null
          desired_position: string | null
          id: string | null
          person_id: string | null
          submitted_on: string | null
          valid_through: string | null
          validity_status: string | null
        }
        Insert: {
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          company_id?: string | null
          days_remaining?: never
          desired_position?: string | null
          id?: string | null
          person_id?: string | null
          submitted_on?: string | null
          valid_through?: string | null
          validity_status?: never
        }
        Update: {
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          company_id?: string | null
          days_remaining?: never
          desired_position?: string | null
          id?: string | null
          person_id?: string | null
          submitted_on?: string | null
          valid_through?: string | null
          validity_status?: never
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_employment_applications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_employment_applications_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      v_official_instrument_readiness: {
        Row: {
          edition_label: string | null
          expires_on: string | null
          form_number: string | null
          has_asset: boolean | null
          instrument_key: string | null
          mapped_fields: number | null
          readiness: string | null
          unmapped_fields: number | null
        }
        Relationships: []
      }
      v_official_instruments_expiring: {
        Row: {
          days_remaining: number | null
          edition_label: string | null
          expires_on: string | null
          expiry_status: string | null
          form_number: string | null
          id: string | null
          instrument_key: string | null
          title: string | null
        }
        Insert: {
          days_remaining?: never
          edition_label?: string | null
          expires_on?: string | null
          expiry_status?: never
          form_number?: string | null
          id?: string | null
          instrument_key?: string | null
          title?: string | null
        }
        Update: {
          days_remaining?: never
          edition_label?: string | null
          expires_on?: string | null
          expiry_status?: never
          form_number?: string | null
          id?: string | null
          instrument_key?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      mhd_accommodation_add_interaction: {
        Args: {
          p_case_id: string
          p_channel: string
          p_employee_visible?: boolean
          p_next_step?: string
          p_next_step_due?: string
          p_occurred_at: string
          p_participants: Json
          p_summary: string
        }
        Returns: string
      }
      mhd_accommodation_add_option: {
        Args: {
          p_case_id: string
          p_description: string
          p_employee_preference?: boolean
          p_essential_function_ids?: string[]
          p_estimated_cost?: number
          p_expected_effectiveness: string
          p_operational_factors?: Json
          p_option_type: string
          p_removes_essential_function?: boolean
        }
        Returns: string
      }
      mhd_accommodation_can_see_medical: { Args: never; Returns: boolean }
      mhd_accommodation_case_create: {
        Args: {
          p_company_id: string
          p_leave_case_id?: string
          p_owner_user_id?: string
          p_person_id: string
          p_recruiting_application_id?: string
          p_request_channel: string
          p_request_source: string
          p_request_summary: string
          p_requested_at: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_accommodation_case_get: { Args: { p_case_id: string }; Returns: Json }
      mhd_accommodation_case_list: {
        Args: { p_company_id: string; p_person_id?: string; p_status?: string }
        Returns: {
          current_decision: string
          id: string
          leave_case_id: string
          owner_user_id: string
          person_display_name: string
          person_id: string
          reference_id: string
          request_channel: string
          request_source: string
          requested_at: string
          review_due_date: string
          status: string
        }[]
      }
      mhd_accommodation_complete_review: {
        Args: {
          p_effectiveness: string
          p_reengage_required: boolean
          p_review_id: string
          p_summary: string
        }
        Returns: undefined
      }
      mhd_accommodation_decide: {
        Args: {
          p_alternatives_considered?: boolean
          p_case_id: string
          p_decision_summary: string
          p_denial_reason_code?: string
          p_individualized_analysis?: Json
          p_interactive_process_continues?: boolean
          p_outcome: string
          p_selected_option_id?: string
        }
        Returns: string
      }
      mhd_accommodation_implement: {
        Args: {
          p_actual_cost?: number
          p_case_id: string
          p_end_date?: string
          p_manager_instruction: string
          p_option_id: string
          p_review_due_date?: string
          p_start_date: string
          p_vendor_name?: string
        }
        Returns: string
      }
      mhd_accommodation_is_privileged: { Args: never; Returns: boolean }
      mhd_accommodation_manager_projection: {
        Args: { p_person_id: string }
        Returns: {
          end_date: string
          implementation_id: string
          manager_instruction: string
          option_type: string
          review_due_date: string
          start_date: string
        }[]
      }
      mhd_accommodation_medical_record: {
        Args: {
          p_accommodation_need?: string
          p_case_id: string
          p_documentation_requested: boolean
          p_documentation_type: string
          p_due_date?: string
          p_functional_limitation?: string
          p_need_is_obvious: boolean
          p_received_at?: string
          p_requested_at?: string
          p_status: string
        }
        Returns: string
      }
      mhd_accommodation_medical_reveal: {
        Args: { p_documentation_id: string }
        Returns: Json
      }
      mhd_accommodation_transition: {
        Args: { p_case_id: string; p_new_status: string; p_reason?: string }
        Returns: undefined
      }
      mhd_activate_notice_packet_version: {
        Args: { p_packet_version_id: string }
        Returns: string
      }
      mhd_active_impersonation: {
        Args: never
        Returns: {
          impersonated_company_id: string
          impersonated_role: string
          session_id: string
        }[]
      }
      mhd_add_activity_participant: {
        Args: {
          p_activity_id: string
          p_person_id?: string
          p_role?: string
          p_user_id?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_add_approval_comment: {
        Args: {
          p_actor_user_id?: string
          p_approval_id: string
          p_comment: string
          p_is_internal?: boolean
        }
        Returns: {
          approval_id: string
          comment: string
          created_at: string
          id: string
          is_internal: boolean
          user_id: string
        }[]
      }
      mhd_add_business_days: {
        Args: { p_days: number; p_from: string }
        Returns: string
      }
      mhd_add_contact_method: {
        Args: {
          p_contact_type: string
          p_contact_value: string
          p_entity_id: string
          p_entity_type?: string
          p_is_primary?: boolean
        }
        Returns: {
          contact_type: string
          contact_value: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_add_message_thread_participants: {
        Args: { p_thread_id: string; p_user_ids: string[] }
        Returns: undefined
      }
      mhd_apply_form_submission_to_destination: {
        Args: { p_submission_id: string }
        Returns: {
          destination_record_id: string
          destination_table: string
        }[]
      }
      mhd_approve_approval_step: {
        Args: {
          p_actor_user_id?: string
          p_approval_id: string
          p_comment?: string
        }
        Returns: {
          current_level: number
          id: string
          reference_id: string
          status: string
          total_levels: number
        }[]
      }
      mhd_archive_form: { Args: { p_form_id: string }; Returns: undefined }
      mhd_archive_message_thread: {
        Args: { p_is_archived: boolean; p_thread_id: string }
        Returns: undefined
      }
      mhd_assemble_form_calculations: {
        Args: { p_form_id: string }
        Returns: Json
      }
      mhd_assemble_form_definition: {
        Args: { p_description: string; p_form_id: string; p_name: string }
        Returns: Json
      }
      mhd_assemble_form_fields: { Args: { p_form_id: string }; Returns: Json }
      mhd_assemble_form_logic: { Args: { p_form_id: string }; Returns: Json }
      mhd_assemble_form_pages: { Args: { p_form_id: string }; Returns: Json }
      mhd_assemble_form_workflow: { Args: { p_form_id: string }; Returns: Json }
      mhd_assert_accommodation_mutate: {
        Args: { p_case_id: string }
        Returns: undefined
      }
      mhd_assert_activity_access: {
        Args: { p_activity_id: string }
        Returns: undefined
      }
      mhd_assert_approval_company_access: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      mhd_assert_assignment_entity_access: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: undefined
      }
      mhd_assert_attendance_mutate: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      mhd_assert_attendance_person_access: {
        Args: { p_person_id: string }
        Returns: undefined
      }
      mhd_assert_audit_access: { Args: never; Returns: undefined }
      mhd_assert_case_document_access: {
        Args: { p_case_document_id: string }
        Returns: undefined
      }
      mhd_assert_coaching_plan_access: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
      mhd_assert_coaching_plan_mutate: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
      mhd_assert_conduct_case_access: {
        Args: { p_case_id: string }
        Returns: undefined
      }
      mhd_assert_conduct_case_mutate: {
        Args: { p_case_id: string }
        Returns: undefined
      }
      mhd_assert_conduct_case_mutate_company: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      mhd_assert_investigation_access: {
        Args: { p_case_id: string }
        Returns: undefined
      }
      mhd_assert_investigation_grantholder: {
        Args: { p_case_id: string }
        Returns: undefined
      }
      mhd_assert_job_mutate: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      mhd_assert_leaves_mutate: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      mhd_assert_message_thread_owner: {
        Args: { p_thread_id: string }
        Returns: undefined
      }
      mhd_assert_message_thread_participant: {
        Args: { p_thread_id: string }
        Returns: undefined
      }
      mhd_assert_offboarding_case_access: {
        Args: { p_case_id: string }
        Returns: undefined
      }
      mhd_assert_offboarding_case_mutate: {
        Args: { p_case_id: string }
        Returns: undefined
      }
      mhd_assert_performance_review_access: {
        Args: { p_review_id: string }
        Returns: undefined
      }
      mhd_assert_performance_review_mutate: {
        Args: { p_review_id: string }
        Returns: undefined
      }
      mhd_assert_subtask_access: {
        Args: { p_subtask_id: string }
        Returns: undefined
      }
      mhd_assert_task_access: {
        Args: { p_task_id: string }
        Returns: undefined
      }
      mhd_assert_task_audit_timeline_access: { Args: never; Returns: undefined }
      mhd_assert_task_company_access: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      mhd_assign_user_to_entity: {
        Args: {
          p_actor_user_id?: string
          p_assignment_type?: string
          p_entity_id: string
          p_entity_type: string
          p_user_id: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_attachment_scope_access: {
        Args: {
          p_company_id: string
          p_sensitivity_level: string
          p_subject_person_id: string
        }
        Returns: boolean
      }
      mhd_attachment_target_defaults: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: Record<string, unknown>
      }
      mhd_attendance_adjust_points: {
        Args: {
          p_effective_date?: string
          p_occurrence_id?: string
          p_person_id: string
          p_points_delta: number
          p_reason: string
        }
        Returns: string
      }
      mhd_attendance_create_policy_version: {
        Args: {
          p_company_id: string
          p_effective_from: string
          p_excused_paid_accrues: boolean
          p_excused_unpaid_accrues: boolean
          p_point_rules: Json
          p_policy_name: string
          p_roll_off_months: number
          p_thresholds: Json
        }
        Returns: string
      }
      mhd_attendance_evaluate_thresholds: {
        Args: { p_company_id: string; p_person_id: string }
        Returns: number
      }
      mhd_attendance_get_policy: {
        Args: { p_company_id: string }
        Returns: {
          effective_from: string
          excused_paid_accrues: boolean
          excused_unpaid_accrues: boolean
          id: string
          point_rules: Json
          policy_name: string
          roll_off_months: number
          thresholds: Json
        }[]
      }
      mhd_attendance_hr_recipients: {
        Args: { p_company_id: string }
        Returns: string[]
      }
      mhd_attendance_is_privileged: { Args: never; Returns: boolean }
      mhd_attendance_list_occurrences: {
        Args: {
          p_classification?: string
          p_company_id: string
          p_from?: string
          p_include_voided?: boolean
          p_occurrence_type?: string
          p_person_id?: string
          p_to?: string
        }
        Returns: {
          classification: string
          id: string
          minutes_variance: number
          occurrence_date: string
          occurrence_type: string
          person_display_name: string
          person_id: string
          points_assessed: number
          protected_leave_category: string
          reason_note: string
          reference_id: string
          voided_at: string
        }[]
      }
      mhd_attendance_list_point_ledger: {
        Args: { p_from?: string; p_person_id: string; p_to?: string }
        Returns: {
          created_at: string
          effective_date: string
          entry_type: string
          expires_on: string
          id: string
          occurrence_id: string
          occurrence_reference: string
          points_delta: number
          reason: string
          reversal_of_entry_id: string
        }[]
      }
      mhd_attendance_list_reassessment_events: {
        Args: { p_company_id: string; p_status?: string }
        Returns: {
          decision_note: string
          from_classification: string
          id: string
          occurrence_date: string
          occurrence_id: string
          occurrence_reference: string
          occurrence_type: string
          person_display_name: string
          person_id: string
          points_assessed: number
          projected_points: number
          raised_at: string
          resolved_at: string
          status: string
          to_classification: string
        }[]
      }
      mhd_attendance_list_threshold_events: {
        Args: { p_company_id: string; p_status?: string }
        Returns: {
          action_level: string
          crossed_at: string
          id: string
          linked_task_id: string
          person_display_name: string
          person_id: string
          points_at: number
          points_at_crossing: number
          resolution_note: string
          status: string
        }[]
      }
      mhd_attendance_maybe_raise_reassessment: {
        Args: { p_from_classification: string; p_occurrence_id: string }
        Returns: undefined
      }
      mhd_attendance_point_balance: {
        Args: { p_as_of?: string; p_person_id: string }
        Returns: number
      }
      mhd_attendance_reclassify_occurrence: {
        Args: {
          p_classification: string
          p_occurrence_id: string
          p_protected_leave_category?: string
          p_reason?: string
        }
        Returns: undefined
      }
      mhd_attendance_record_occurrence: {
        Args: {
          p_classification: string
          p_minutes_variance?: number
          p_occurrence_date: string
          p_occurrence_type: string
          p_person_id: string
          p_protected_leave_category?: string
          p_reason_note?: string
          p_scheduled_shift_id?: string
        }
        Returns: {
          id: string
          points_assessed: number
          reference_id: string
        }[]
      }
      mhd_attendance_resolve_reassessment_event: {
        Args: {
          p_decision: string
          p_decision_note: string
          p_effective_date?: string
          p_event_id: string
          p_points?: number
        }
        Returns: string
      }
      mhd_attendance_resolve_threshold_event: {
        Args: {
          p_event_id: string
          p_linked_task_id?: string
          p_resolution_note?: string
          p_status: string
        }
        Returns: undefined
      }
      mhd_attendance_update_occurrence: {
        Args: {
          p_minutes_variance?: number
          p_occurrence_id: string
          p_occurrence_type?: string
          p_reason_note?: string
        }
        Returns: undefined
      }
      mhd_attendance_void_occurrence: {
        Args: { p_occurrence_id: string; p_reason: string }
        Returns: undefined
      }
      mhd_automation_action_create_task: {
        Args: { p_config: Json; p_event_id: string; p_run_id: string }
        Returns: Json
      }
      mhd_automation_action_emit_event: {
        Args: { p_config: Json; p_event_id: string; p_run_id: string }
        Returns: Json
      }
      mhd_automation_action_notify: {
        Args: { p_config: Json; p_event_id: string; p_run_id: string }
        Returns: Json
      }
      mhd_automation_action_onboarding_start_packet: {
        Args: { p_config: Json; p_event_id: string; p_run_id: string }
        Returns: Json
      }
      mhd_automation_action_set_employment_state: {
        Args: { p_config: Json; p_event_id: string; p_run_id: string }
        Returns: Json
      }
      mhd_automation_author_satisfies_role: {
        Args: { p_author_user_id: string; p_min_role: string }
        Returns: boolean
      }
      mhd_automation_drain: {
        Args: { p_limit?: number }
        Returns: {
          event_id: string
          event_type_key: string
          runs_created: number
          status: string
          steps_failed: number
          steps_succeeded: number
        }[]
      }
      mhd_automation_emit_overdue_tasks: {
        Args: { p_company_id: string }
        Returns: number
      }
      mhd_automation_entity_defaults: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: Record<string, unknown>
      }
      mhd_automation_evaluate_conditions: {
        Args: { p_payload: Json; p_rule_id: string }
        Returns: boolean
      }
      mhd_automation_filter_payload: {
        Args: { p_allowlist: string[]; p_payload: Json }
        Returns: Json
      }
      mhd_automation_get_rule: { Args: { p_rule_id: string }; Returns: Json }
      mhd_automation_get_run: { Args: { p_run_id: string }; Returns: Json }
      mhd_automation_list_catalog: { Args: never; Returns: Json }
      mhd_automation_list_rules: {
        Args: { p_company_id: string }
        Returns: {
          action_count: number
          authored_by: string
          authorized_at: string
          authorized_by: string
          company_id: string
          condition_count: number
          created_at: string
          description: string
          event_label: string
          event_type_key: string
          id: string
          is_active: boolean
          last_run_at: string
          max_sensitivity: string
          name: string
          reference_id: string
        }[]
      }
      mhd_automation_list_runs: {
        Args: { p_company_id: string; p_limit?: number }
        Returns: {
          error_text: string
          event_id: string
          event_reference_id: string
          event_type_key: string
          finished_at: string
          id: string
          matched: boolean
          reference_id: string
          rule_id: string
          rule_name: string
          sensitivity_level: string
          started_at: string
          status: string
          steps_failed: number
          steps_succeeded: number
          steps_total: number
        }[]
      }
      mhd_automation_provision_default_rules: {
        Args: { p_actor_user_id?: string; p_company_id: string }
        Returns: {
          is_active: boolean
          name: string
          reference_id: string
          rule_id: string
        }[]
      }
      mhd_automation_recipients_explicit_users: {
        Args: { p_config: Json; p_event_id: string }
        Returns: string[]
      }
      mhd_automation_recipients_manager_of_subject: {
        Args: { p_config: Json; p_event_id: string }
        Returns: string[]
      }
      mhd_automation_recipients_role_at_company: {
        Args: { p_config: Json; p_event_id: string }
        Returns: string[]
      }
      mhd_automation_recipients_rule_author: {
        Args: { p_config: Json; p_event_id: string }
        Returns: string[]
      }
      mhd_automation_recipients_subject_user: {
        Args: { p_config: Json; p_event_id: string }
        Returns: string[]
      }
      mhd_automation_render_template: {
        Args: { p_event_id: string; p_text: string }
        Returns: string
      }
      mhd_automation_resolve_recipients: {
        Args: { p_event_id: string; p_recipients: Json }
        Returns: string[]
      }
      mhd_automation_sensitivity_rank: {
        Args: { p_level: string }
        Returns: number
      }
      mhd_automation_set_rule_active: {
        Args: { p_is_active: boolean; p_rule_id: string }
        Returns: {
          authorized_at: string
          authorized_by: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      mhd_bulk_update_task_fields: {
        Args: {
          p_actor_user_id?: string
          p_assigned_user_ids?: string[]
          p_priority_id?: string
          p_status_id?: string
          p_task_ids: string[]
          p_update_assignees?: boolean
          p_update_priority?: boolean
        }
        Returns: {
          reference_id: string
          task_id: string
        }[]
      }
      mhd_calendar_list_events: {
        Args: {
          p_company_id?: string
          p_end: string
          p_person_ids?: string[]
          p_source_types?: string[]
          p_start: string
        }
        Returns: {
          company_id: string
          event_date: string
          event_end: string
          event_id: string
          link_path: string
          person_id: string
          person_name: string
          source_id: string
          source_type: string
          status: string
          title: string
        }[]
      }
      mhd_can_access_assignment_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      mhd_can_access_case_document: {
        Args: { p_case_document_id: string }
        Returns: boolean
      }
      mhd_can_access_company: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      mhd_can_view_accommodation_case: {
        Args: { p_case_id: string }
        Returns: boolean
      }
      mhd_can_view_activity: {
        Args: { p_activity_id: string }
        Returns: boolean
      }
      mhd_can_view_attendance_person: {
        Args: { p_person_id: string }
        Returns: boolean
      }
      mhd_can_view_coaching_plan: {
        Args: { p_plan_id: string }
        Returns: boolean
      }
      mhd_can_view_conduct_case: {
        Args: { p_case_id: string }
        Returns: boolean
      }
      mhd_can_view_correspondence_message: {
        Args: { p_message_id: string }
        Returns: boolean
      }
      mhd_can_view_correspondence_thread: {
        Args: { p_thread_id: string }
        Returns: boolean
      }
      mhd_can_view_form_submission: {
        Args: { p_submission_id: string }
        Returns: boolean
      }
      mhd_can_view_investigation: {
        Args: { p_case_id: string }
        Returns: boolean
      }
      mhd_can_view_job: { Args: { p_job_id: string }; Returns: boolean }
      mhd_can_view_leave_admin_event: {
        Args: { p_case_id: string; p_visibility: string }
        Returns: boolean
      }
      mhd_can_view_leave_case: { Args: { p_case_id: string }; Returns: boolean }
      mhd_can_view_leave_person: {
        Args: { p_person_id: string }
        Returns: boolean
      }
      mhd_can_view_linked_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      mhd_can_view_message_thread: {
        Args: { p_thread_id: string }
        Returns: boolean
      }
      mhd_can_view_mileage_person: {
        Args: { p_person_id: string }
        Returns: boolean
      }
      mhd_can_view_offboarding_case: {
        Args: { p_case_id: string }
        Returns: boolean
      }
      mhd_can_view_performance_review: {
        Args: { p_review_id: string }
        Returns: boolean
      }
      mhd_can_write_packet_evidence: {
        Args: { p_company_id: string; p_person_id: string }
        Returns: boolean
      }
      mhd_capture_clause_ack: {
        Args: {
          p_authoritative_subject_id?: string
          p_authoritative_subject_table?: string
          p_capture_mode: string
          p_clause_heading?: string
          p_clause_key: string
          p_clause_ordinal: number
          p_clause_text: string
          p_clause_version?: string
          p_company_id: string
          p_document_key?: string
          p_initials?: string
          p_is_checked?: boolean
          p_person_id: string
          p_subject_id: string
          p_subject_table: string
        }
        Returns: string
      }
      mhd_check_trusted_device: {
        Args: { p_device_token: string }
        Returns: boolean
      }
      mhd_competency_list: {
        Args: {
          p_active_only?: boolean
          p_company_id: string
          p_industry?: string
        }
        Returns: {
          category: string
          company_id: string
          competency_name: string
          description: string
          id: string
          industry: string
          is_active: boolean
          is_global: boolean
          is_regulated: boolean
          reference_id: string
        }[]
      }
      mhd_competency_upsert: {
        Args: {
          p_category?: string
          p_company_id: string
          p_competency_id?: string
          p_competency_name: string
          p_description?: string
          p_industry?: string
          p_is_regulated?: boolean
        }
        Returns: string
      }
      mhd_complete_audit_certificate: {
        Args: {
          p_certificate_document_generation_id: string
          p_certificate_id: string
          p_digitally_signed?: boolean
          p_merged_document_hash: string
          p_merged_drive_file_id: string
          p_signing_certificate_fingerprint?: string
        }
        Returns: {
          id: string
          status: string
        }[]
      }
      mhd_complete_document_generation: {
        Args: {
          p_actor_user_id?: string
          p_generation_id: string
          p_output_document_hash?: string
          p_output_drive_file_id: string
          p_output_file_name: string
        }
        Returns: {
          generated_at: string
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_compliance_assert_content_enabled: {
        Args: { p_content_key: string; p_module_key: string }
        Returns: undefined
      }
      mhd_compliance_module_readiness: {
        Args: { p_module_key: string }
        Returns: {
          blocker_count: number
          blockers: Json
          module_key: string
          release_ready: boolean
        }[]
      }
      mhd_compliance_release_blockers: {
        Args: never
        Returns: {
          blocker: string
          content_key: string
          module_key: string
          production_enabled: boolean
          review_status: string
          version: number
        }[]
      }
      mhd_compliance_set_review: {
        Args: {
          p_content_key: string
          p_module_key: string
          p_production_enabled: boolean
          p_review_note: string
          p_review_status: string
          p_version: number
        }
        Returns: {
          authority_name: string
          content_key: string
          created_at: string
          created_by: string | null
          id: string
          last_verified_at: string
          module_key: string
          production_enabled: boolean
          review_note: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_effective_at: string | null
          source_url: string
          updated_at: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "compliance_content_registry"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_compute_i9_retention_date: {
        Args: { p_hire_date: string; p_termination_date?: string }
        Returns: string
      }
      mhd_conduct_create_action: {
        Args: {
          p_action_summary?: string
          p_case_id: string
          p_document_payload?: Json
          p_requires_document?: boolean
          p_severity: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_conduct_create_case: {
        Args: {
          p_category: string
          p_company_id: string
          p_concern_summary?: string
          p_person_id: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_conduct_delete_action: {
        Args: { p_action_id: string }
        Returns: undefined
      }
      mhd_conduct_is_privileged: { Args: never; Returns: boolean }
      mhd_conduct_issue_action: {
        Args: {
          p_action_id: string
          p_document_generation_id?: string
          p_esignature_request_id?: string
        }
        Returns: undefined
      }
      mhd_conduct_list_actions: {
        Args: { p_case_id: string }
        Returns: {
          acknowledgment_type: string
          action_summary: string
          document_payload: Json
          esignature_request_id: string
          esignature_status: string
          id: string
          issued_at: string
          outcome_reason: string
          reference_id: string
          requires_document: boolean
          severity: string
          sort_order: number
          status: string
        }[]
      }
      mhd_conduct_list_cases: {
        Args: {
          p_category?: string
          p_company_id: string
          p_person_id?: string
          p_status?: string
        }
        Returns: {
          action_count: number
          category: string
          created_at: string
          id: string
          person_display_name: string
          person_id: string
          reference_id: string
          status: string
          terminal_count: number
        }[]
      }
      mhd_conduct_open_from_threshold: {
        Args: { p_threshold_event_id: string }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_conduct_record_outcome: {
        Args: {
          p_action_id: string
          p_outcome: string
          p_reason?: string
          p_witness_user_id?: string
        }
        Returns: undefined
      }
      mhd_conduct_transition_case: {
        Args: {
          p_case_id: string
          p_new_status: string
          p_rescind_reason?: string
        }
        Returns: undefined
      }
      mhd_conduct_update_action: {
        Args: {
          p_action_id: string
          p_action_summary?: string
          p_document_payload?: Json
          p_severity?: string
        }
        Returns: undefined
      }
      mhd_consume_mfa_recovery_code: {
        Args: { p_code: string }
        Returns: undefined
      }
      mhd_correspondence_notify_inbound: {
        Args: {
          p_action_url?: string
          p_actor_user_id?: string
          p_body: string
          p_company_id: string
          p_entity_id: string
          p_entity_type: string
          p_recipient_user_ids: string[]
          p_title: string
        }
        Returns: number
      }
      mhd_correspondence_recipients_platform_admins: {
        Args: never
        Returns: string[]
      }
      mhd_correspondence_recipients_role_at_company: {
        Args: { p_company_id: string; p_role: string }
        Returns: string[]
      }
      mhd_correspondence_renew_gmail_watches: { Args: never; Returns: number }
      mhd_correspondence_target_defaults: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          sensitivity_level: string
          subject_person_id: string
        }[]
      }
      mhd_count_unused_recovery_codes: { Args: never; Returns: number }
      mhd_create_activity: {
        Args: {
          p_activity_type: string
          p_actor_user_id?: string
          p_company_id: string
          p_description_plain_text?: string
          p_description_rich_text?: Json
          p_is_confidential?: boolean
          p_location?: string
          p_parent_task_id?: string
          p_participants?: Json
          p_person_id?: string
          p_scheduled_at?: string
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_approval_request: {
        Args: {
          p_actor_user_id?: string
          p_approval_type: string
          p_approver_ids: string[]
          p_chain_mode: string
          p_company_id: string
          p_entity_id: string
          p_entity_type: string
          p_reason?: string
          p_task_id?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_attachment: {
        Args: {
          p_description_plain_text: string
          p_description_rich_text: Json
          p_drive_file_id: string
          p_drive_folder_id: string
          p_drive_web_content_link: string
          p_drive_web_view_link: string
          p_entity_id: string
          p_entity_type: string
          p_file_extension?: string
          p_file_size_bytes: number
          p_mime_type: string
          p_original_file_name: string
          p_stored_file_name?: string
          p_version_number?: number
        }
        Returns: {
          drive_file_id: string
          drive_web_view_link: string
          id: string
          reference_id: string
        }[]
      }
      mhd_create_audit_certificate: {
        Args: {
          p_actor_user_id?: string
          p_company_id: string
          p_entity_id: string
          p_entity_type: string
          p_source_document_generation_id?: string
          p_source_document_hash?: string
          p_source_drive_file_id?: string
        }
        Returns: {
          id: string
          reference_id: string
          verification_code: string
        }[]
      }
      mhd_create_case_document: {
        Args: {
          p_company_id: string
          p_confidentiality_level?: string
          p_document_kind: string
          p_payload?: Json
          p_source_entity_id: string
          p_source_entity_type: string
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_create_coaching_plan: {
        Args: {
          p_coach_user_id: string
          p_company_id: string
          p_objective?: string
          p_person_id: string
          p_source_review_id?: string
          p_start_date?: string
          p_target_date?: string
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_coaching_plan_item: {
        Args: {
          p_activity_id?: string
          p_description?: string
          p_due_date?: string
          p_plan_id: string
          p_sort_order?: number
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_company: {
        Args: {
          p_company_name: string
          p_employee_count?: number
          p_headquarters_location?: string
          p_industry?: string
        }
        Returns: {
          company_name: string
          created_at: string
          created_by: string
          employee_count: number
          headquarters_location: string
          id: string
          industry: string
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_create_correspondence_mailbox_alias: {
        Args: {
          p_alias_address: string
          p_company_id: string
          p_is_primary?: boolean
          p_mailbox_id: string
        }
        Returns: {
          alias_address: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          mailbox_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "correspondence_mailbox_aliases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_create_correspondence_thread: {
        Args: {
          p_company_id: string
          p_entity_id?: string
          p_entity_type?: string
          p_mailbox_id?: string
          p_subject?: string
        }
        Returns: {
          company_id: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_archived: boolean
          last_message_at: string | null
          linked_at: string | null
          linked_by: string | null
          mailbox_id: string
          origin: string
          reference_id: string
          sensitivity_level: string
          subject: string | null
          subject_person_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "correspondence_threads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_create_document_template: {
        Args: {
          p_actor_user_id?: string
          p_applicable_entity_type?: string
          p_company_id: string
          p_content: string
          p_content_format: string
          p_description?: string
          p_merge_fields?: Json
          p_name: string
          p_requires_signature?: boolean
          p_template_type: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_form: {
        Args: {
          p_company_id: string
          p_definition?: Json
          p_description?: string
          p_employee_file_category?: string
          p_esignature_document_template_id?: string
          p_name: string
          p_requires_esignature?: boolean
        }
        Returns: {
          id: string
        }[]
      }
      mhd_create_form_revision: {
        Args: { p_form_id: string }
        Returns: {
          id: string
        }[]
      }
      mhd_create_message_thread: {
        Args: {
          p_company_id: string
          p_entity_id: string
          p_entity_type: string
          p_initial_body: string
          p_participant_user_ids: string[]
          p_subject: string
          p_thread_type: string
        }
        Returns: string
      }
      mhd_create_note: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_note_plain_text: string
          p_note_rich_text: Json
          p_parent_note_id?: string
          p_visibility?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_offboarding_case: {
        Args: {
          p_actor_user_id?: string
          p_company_id: string
          p_last_working_day?: string
          p_person_id: string
          p_reason_summary?: string
          p_separation_date: string
          p_separation_type: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_offboarding_item: {
        Args: {
          p_assigned_user_id?: string
          p_case_id: string
          p_description?: string
          p_due_date?: string
          p_is_required?: boolean
          p_sort_order?: number
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_performance_review: {
        Args: {
          p_company_id: string
          p_due_date?: string
          p_person_id: string
          p_review_activity_id?: string
          p_review_period_end: string
          p_review_period_start: string
          p_review_type: string
          p_reviewer_user_id: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_person: {
        Args: {
          p_actor_user_id?: string
          p_company_id: string
          p_email?: string
          p_first_name: string
          p_last_name: string
          p_manager_id?: string
          p_middle_name?: string
          p_mobile?: string
          p_phone?: string
          p_preferred_name?: string
        }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          display_name: string
          first_name: string
          id: string
          last_name: string
          manager_display_name: string
          manager_id: string
          middle_name: string
          preferred_name: string
          primary_email: string
          primary_mobile: string
          primary_phone: string
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_create_property_item: {
        Args: {
          p_acquisition_date?: string
          p_category: string
          p_company_id: string
          p_description?: string
          p_name: string
          p_quantity_total?: number
          p_serial_number?: string
          p_unit_cost?: number
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_quote: {
        Args: { p_author?: string; p_is_active?: boolean; p_quote_text: string }
        Returns: {
          author: string | null
          created_at: string
          id: string
          is_active: boolean
          quote_text: string
          source_citation: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_create_signature_request: {
        Args: {
          p_actor_user_id?: string
          p_company_id: string
          p_disclosure_text?: string
          p_disclosure_version?: string
          p_document_drive_file_id: string
          p_document_generation_id: string
          p_document_hash?: string
          p_document_name: string
          p_expires_at?: string
          p_signers: Json
          p_signing_order?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_sub_activity: {
        Args: {
          p_activity_id: string
          p_description_plain_text?: string
          p_scheduled_at?: string
          p_sort_order?: number
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_submission: {
        Args: {
          p_employee_file_category?: string
          p_employee_file_person_id?: string
          p_employee_file_user_id?: string
          p_form_id: string
          p_task_id?: string
        }
        Returns: {
          id: string
        }[]
      }
      mhd_create_subtask: {
        Args: {
          p_actor_user_id?: string
          p_description_plain_text?: string
          p_description_rich_text?: Json
          p_due_date?: string
          p_manual_progress_percent?: number
          p_priority_id?: string
          p_sort_order?: number
          p_status_id?: string
          p_task_id: string
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_create_task: {
        Args: {
          p_actor_user_id?: string
          p_assigned_user_ids?: string[]
          p_company_id: string
          p_description_plain_text?: string
          p_description_rich_text?: Json
          p_detailed_instructions_plain_text?: string
          p_detailed_instructions_rich_text?: Json
          p_due_date?: string
          p_manual_progress_percent?: number
          p_priority_id?: string
          p_start_date?: string
          p_status_id?: string
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_current_person_id: { Args: never; Returns: string }
      mhd_current_user_id: { Args: never; Returns: string }
      mhd_current_user_roles: { Args: never; Returns: string[] }
      mhd_dashboard_company_summary: {
        Args: { p_company_id?: string }
        Returns: {
          avg_tenure_years: number
          contractor_count: number
          distinct_department_count: number
          full_time_count: number
          intern_count: number
          part_time_count: number
          total_people: number
          turnover_rate_ytd: number
        }[]
      }
      mhd_dashboard_headcount_trend: {
        Args: { p_company_id?: string; p_months?: number }
        Returns: {
          headcount: number
          month_start: string
        }[]
      }
      mhd_dashboard_my_tasks: {
        Args: { p_company_id?: string; p_limit?: number }
        Returns: {
          company_name: string
          due_date: string
          is_overdue: boolean
          overall_progress_percent: number
          priority_color_token: string
          priority_name: string
          reference_id: string
          status_color_token: string
          status_name: string
          task_id: string
          title: string
        }[]
      }
      mhd_dashboard_overdue_count: {
        Args: { p_company_id?: string }
        Returns: number
      }
      mhd_dashboard_random_quote: {
        Args: never
        Returns: {
          author: string | null
          created_at: string
          id: string
          is_active: boolean
          quote_text: string
          source_citation: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_dashboard_recent_activity: {
        Args: { p_company_id?: string; p_limit?: number }
        Returns: {
          action_type: string
          entity_type: string
          event_id: string
          performed_at: string
          performed_by: string
          reference_id: string
          summary: string
        }[]
      }
      mhd_dashboard_task_summary: {
        Args: { p_company_id?: string }
        Returns: {
          cancelled: number
          completed: number
          completion_rate: number
          in_progress: number
          not_started: number
          on_hold: number
          overdue_count: number
          total_tasks: number
          waiting_on_client: number
        }[]
      }
      mhd_dashboard_tasks_by_priority: {
        Args: { p_company_id?: string }
        Returns: {
          color_token: string
          display_order: number
          priority_name: string
          task_count: number
        }[]
      }
      mhd_decline_via_token: {
        Args: {
          p_ip_address?: string
          p_reason: string
          p_signing_token: string
          p_user_agent?: string
        }
        Returns: {
          request_id: string
          request_status: string
        }[]
      }
      mhd_delete_activity: {
        Args: { p_activity_id: string; p_actor_user_id?: string }
        Returns: undefined
      }
      mhd_delete_attachment: {
        Args: { p_attachment_id: string }
        Returns: undefined
      }
      mhd_delete_coaching_plan: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
      mhd_delete_coaching_plan_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      mhd_delete_contact_method: {
        Args: { p_contact_method_id: string }
        Returns: boolean
      }
      mhd_delete_document_template: {
        Args: { p_actor_user_id?: string; p_template_id: string }
        Returns: undefined
      }
      mhd_delete_message: { Args: { p_message_id: string }; Returns: undefined }
      mhd_delete_note: { Args: { p_note_id: string }; Returns: undefined }
      mhd_delete_offboarding_case: {
        Args: { p_case_id: string }
        Returns: undefined
      }
      mhd_delete_offboarding_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      mhd_delete_performance_review: {
        Args: { p_review_id: string }
        Returns: undefined
      }
      mhd_delete_property_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      mhd_delete_quote: { Args: { p_quote_id: string }; Returns: undefined }
      mhd_delete_sub_activity: {
        Args: { p_sub_activity_id: string }
        Returns: undefined
      }
      mhd_delete_subtask: {
        Args: { p_actor_user_id?: string; p_subtask_id: string }
        Returns: undefined
      }
      mhd_delete_task: {
        Args: { p_actor_user_id?: string; p_task_id: string }
        Returns: undefined
      }
      mhd_dispatch_form_workflow_webhooks: { Args: never; Returns: number }
      mhd_dispatch_notification_emails: { Args: never; Returns: number }
      mhd_edit_message: {
        Args: { p_body: string; p_message_id: string }
        Returns: undefined
      }
      mhd_emit_event: {
        Args: {
          p_actor_user_id?: string
          p_company_id: string
          p_dedupe_key?: string
          p_depth?: number
          p_entity_id: string
          p_entity_type: string
          p_event_type_key: string
          p_parent_run_id?: string
          p_payload?: Json
          p_subject_person_id?: string
        }
        Returns: string
      }
      mhd_encrypt_field_value: { Args: { p_plain: string }; Returns: string }
      mhd_end_impersonation: { Args: never; Returns: undefined }
      mhd_esignature_send_expiring_soon: { Args: never; Returns: number }
      mhd_export_audit_events: {
        Args: { p_company_id: string; p_date_from: string; p_date_to: string }
        Returns: {
          action_type: string
          actor_name: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          metadata: Json
          new_value: string
          old_value: string
          performed_at: string
          reference_id: string
          source_module: string
          summary: string
        }[]
      }
      mhd_fail_document_generation: {
        Args: {
          p_actor_user_id?: string
          p_generation_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      mhd_form_workflow_action_recipient_user_ids: {
        Args: { p_action_id: string; p_company_id: string }
        Returns: string[]
      }
      mhd_generate_mfa_recovery_codes: { Args: never; Returns: string[] }
      mhd_get_active_notice_packet_version: {
        Args: { p_company_id?: string; p_packet_key: string }
        Returns: string
      }
      mhd_get_activity_by_id: {
        Args: { p_activity_id: string }
        Returns: {
          activity_type: string
          attachment_count: number
          company_id: string
          company_name: string
          created_at: string
          created_by: string
          description_plain_text: string
          description_rich_text: Json
          duration_minutes: number
          follow_up_task_id: string
          id: string
          is_confidential: boolean
          location: string
          note_count: number
          occurred_at: string
          outcome_summary: string
          parent_task_id: string
          participant_display_names: string[]
          person_display_name: string
          person_id: string
          reference_id: string
          scheduled_at: string
          status: string
          sub_activity_done_count: number
          sub_activity_total_count: number
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_get_approval_by_id: {
        Args: { p_approval_id: string }
        Returns: {
          approval_type: string
          company_id: string
          created_at: string
          created_by: string
          current_level: number
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reference_id: string
          requester_id: string
          requester_name: string
          resolved_at: string
          resolved_by: string
          status: string
          task_id: string
          total_levels: number
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_get_approval_chain: {
        Args: { p_approval_id: string }
        Returns: {
          approval_id: string
          approver_name: string
          created_at: string
          decided_at: string
          decided_by: string
          id: string
          level: number
          rejection_reason: string
          status: string
          user_id: string
        }[]
      }
      mhd_get_audit_certificate: {
        Args: { p_certificate_id: string }
        Returns: {
          certificate_document_generation_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          digitally_signed: boolean
          entity_id: string
          entity_type: string
          generated_at: string | null
          id: string
          merged_document_hash: string | null
          merged_drive_file_id: string | null
          reference_id: string
          signing_certificate_fingerprint: string | null
          source_document_generation_id: string | null
          source_document_hash: string | null
          source_drive_file_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
          verification_code: string
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_certificates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_get_audit_timeline_for_entity: {
        Args: { p_entity_id: string; p_entity_type: string; p_limit?: number }
        Returns: {
          action_type: string
          actor_name: string
          company_id: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          ip_address: string
          metadata: Json
          new_value: string
          old_value: string
          performed_at: string
          performed_by: string
          reference_id: string
          source_module: string
          summary: string
          user_agent: string
        }[]
      }
      mhd_get_coaching_plan: {
        Args: { p_plan_id: string }
        Returns: {
          coach_display_name: string
          coach_user_id: string
          company_id: string
          company_name: string
          created_at: string
          created_by: string
          id: string
          item_done_count: number
          item_total_count: number
          objective: string
          outcome_summary: string
          person_display_name: string
          person_id: string
          reference_id: string
          source_review_id: string
          source_review_reference_id: string
          start_date: string
          status: string
          target_date: string
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_get_corrective_action_template_id: {
        Args: { p_severity: string }
        Returns: string
      }
      mhd_get_correspondence_thread: {
        Args: { p_thread_id: string }
        Returns: {
          company_id: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_archived: boolean
          last_message_at: string | null
          linked_at: string | null
          linked_by: string | null
          mailbox_id: string
          origin: string
          reference_id: string
          sensitivity_level: string
          subject: string | null
          subject_person_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "correspondence_threads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_get_default_task_priority_id: { Args: never; Returns: string }
      mhd_get_default_task_status_id: { Args: never; Returns: string }
      mhd_get_document_generation: {
        Args: { p_generation_id: string }
        Returns: {
          company_id: string
          entity_id: string
          entity_type: string
          esignature_request_id: string
          generated_at: string
          id: string
          output_drive_file_id: string
          output_file_name: string
          reference_id: string
          status: string
          template_id: string
        }[]
      }
      mhd_get_document_template: {
        Args: { p_template_id: string }
        Returns: {
          applicable_entity_type: string
          company_id: string
          content: string
          content_format: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          merge_fields: Json
          name: string
          reference_id: string
          requires_signature: boolean
          template_type: string
          updated_at: string
          version: number
        }[]
      }
      mhd_get_document_template_by_key: {
        Args: { p_company_id?: string; p_template_key: string }
        Returns: string
      }
      mhd_get_exit_acknowledgment_template_id: { Args: never; Returns: string }
      mhd_get_field_encryption_key: { Args: never; Returns: string }
      mhd_get_form: {
        Args: { p_form_id: string }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          definition: Json
          description: string
          employee_file_category: string
          esignature_document_template_id: string
          id: string
          name: string
          previous_version_id: string
          published_at: string
          published_by: string
          reference_id: string
          requires_esignature: boolean
          status: string
          updated_at: string
          updated_by: string
          version: number
        }[]
      }
      mhd_get_impersonation_status: {
        Args: never
        Returns: {
          impersonated_company_id: string
          impersonated_company_name: string
          impersonated_role: string
          is_impersonating: boolean
          session_id: string
          started_at: string
        }[]
      }
      mhd_get_message_thread: { Args: { p_thread_id: string }; Returns: Json }
      mhd_get_notice_packet_version: {
        Args: { p_packet_version_id: string }
        Returns: {
          agency: string
          attachment_id_en: string
          attachment_id_es: string
          effective_from: string
          effective_to: string
          form_number: string
          is_required: boolean
          item_id: string
          jurisdiction: string
          notice_id: string
          notice_key: string
          notice_reference_id: string
          notice_version_id: string
          notice_version_reference_id: string
          page_count_en: number
          page_count_es: number
          sort_order: number
          source_url_en: string
          source_url_es: string
          title: string
          title_es: string
          version_label: string
        }[]
      }
      mhd_get_offboarding_case: {
        Args: { p_case_id: string }
        Returns: {
          cancel_reason: string
          company_id: string
          company_name: string
          completed_at: string
          created_at: string
          created_by: string
          eligible_for_rehire: boolean
          exit_interview_activity_id: string
          id: string
          initiated_by_user_id: string
          initiator_display_name: string
          last_working_day: string
          outstanding_property_count: number
          person_display_name: string
          person_id: string
          person_primary_email: string
          reason_summary: string
          reference_id: string
          required_done_count: number
          required_total_count: number
          separation_date: string
          separation_type: string
          status: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_get_onboarding_checklist_for_person: {
        Args: { p_person_id: string }
        Returns: {
          company_id: string
          completed_at: string
          document_key: string
          document_record_id: string
          due_date: string
          id: string
          is_required: boolean
          person_id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_get_or_create_entity_message_thread: {
        Args: {
          p_company_id: string
          p_entity_id: string
          p_entity_type: string
          p_initial_participant_ids?: string[]
        }
        Returns: string
      }
      mhd_get_performance_review: {
        Args: { p_review_id: string }
        Returns: {
          acknowledged_at: string
          company_id: string
          company_name: string
          created_at: string
          created_by: string
          document_generation_id: string
          document_generation_reference_id: string
          document_generation_status: string
          due_date: string
          employee_comments: string
          esignature_request_id: string
          esignature_request_reference_id: string
          esignature_request_status: string
          goals_summary: string
          id: string
          improvement_summary: string
          overall_rating: number
          person_display_name: string
          person_id: string
          reference_id: string
          review_activity_id: string
          review_period_end: string
          review_period_start: string
          review_type: string
          reviewer_comments: string
          reviewer_display_name: string
          reviewer_user_id: string
          status: string
          strengths_summary: string
          updated_at: string
          updated_by: string
          waiver_reason: string
        }[]
      }
      mhd_get_performance_review_template_id: { Args: never; Returns: string }
      mhd_get_person_by_id: {
        Args: { p_person_id: string }
        Returns: {
          company_id: string
          company_name: string
          created_at: string
          created_by: string
          display_name: string
          first_name: string
          id: string
          last_name: string
          manager_display_name: string
          manager_id: string
          middle_name: string
          photo_path: string
          preferred_name: string
          primary_email: string
          primary_mobile: string
          primary_phone: string
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_get_required_notice_ack_detail: {
        Args: { p_ack_id: string }
        Returns: {
          agency: string
          authoritative_subject_id: string
          authoritative_subject_table: string
          clause_heading: string
          clause_key: string
          clause_text: string
          clause_version: string
          form_number: string
          initials: string
          is_pointer: boolean
          notice_key: string
          notice_version_id: string
          recorded_at: string
          row_kind: string
          sort_order: number
          title: string
          title_es: string
          version_label: string
          viewed_at: string
        }[]
      }
      mhd_get_signature_events: {
        Args: { p_request_id: string }
        Returns: {
          event_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          request_id: string
          signer_id: string | null
          user_agent: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "esignature_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_get_signature_request: {
        Args: { p_request_id: string }
        Returns: {
          company_id: string
          completed_at: string
          created_at: string
          created_by: string
          disclosure_text: string
          disclosure_version: string
          document_drive_file_id: string
          document_generation_id: string
          document_hash: string
          document_name: string
          expires_at: string
          id: string
          reference_id: string
          signed_document_hash: string
          signed_drive_file_id: string
          signers: Json
          signing_order: string
          status: string
        }[]
      }
      mhd_get_signature_request_by_token: {
        Args: { p_signing_token: string }
        Returns: {
          company_id: string
          consented_at: string
          disclosure_text: string
          disclosure_version: string
          document_drive_file_id: string
          document_hash: string
          document_name: string
          reference_id: string
          request_id: string
          request_status: string
          signature_color: string
          signature_font: string
          signed_drive_file_id: string
          signer_id: string
          signer_name: string
          signer_order_position: number
          signer_status: string
          signing_order: string
        }[]
      }
      mhd_get_submission: {
        Args: { p_submission_id: string }
        Returns: {
          created_at: string
          employee_file_category: string
          employee_file_person_id: string
          employee_file_user_id: string
          form_id: string
          id: string
          is_draft: boolean
          reference_id: string
          status: string
          submitted_at: string
          submitter_id: string
          task_id: string
          updated_at: string
          values: Json
        }[]
      }
      mhd_get_task_audit_timeline: {
        Args: { p_task_id: string }
        Returns: {
          action_type: string
          actor_name: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          ip_address: string
          metadata: Json
          new_value: string
          old_value: string
          performed_at: string
          performed_by: string
          source_module: string
          summary: string
          user_agent: string
        }[]
      }
      mhd_get_task_by_id: {
        Args: { p_task_id: string }
        Returns: {
          assigned_date: string
          assigned_display_names: string[]
          assigned_user_ids: string[]
          attachment_count: number
          calculated_progress_percent: number
          company_id: string
          company_name: string
          completed_date: string
          created_at: string
          created_by: string
          description_plain_text: string
          description_rich_text: Json
          detailed_instructions_plain_text: string
          detailed_instructions_rich_text: Json
          due_date: string
          id: string
          manual_progress_percent: number
          note_count: number
          priority_color_token: string
          priority_id: string
          priority_name: string
          reference_id: string
          start_date: string
          status_color_token: string
          status_id: string
          status_name: string
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_handbook_ack_status: {
        Args: { p_version_id: string }
        Returns: {
          acknowledged_at: string
          id: string
          person_display_name: string
          person_id: string
          status: string
        }[]
      }
      mhd_handbook_acknowledge: {
        Args: { p_ack_id: string; p_esignature_request_id?: string }
        Returns: undefined
      }
      mhd_handbook_archive: {
        Args: { p_handbook_id: string }
        Returns: undefined
      }
      mhd_handbook_assign_acknowledgment: {
        Args: {
          p_esignature_request_id?: string
          p_person_id: string
          p_version_id: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_handbook_create: {
        Args: {
          p_company_id: string
          p_handbook_type: string
          p_jurisdictions: string[]
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_handbook_is_privileged: { Args: never; Returns: boolean }
      mhd_handbook_list: {
        Args: { p_company_id: string }
        Returns: {
          created_at: string
          current_version_id: string
          effective_date: string
          handbook_type: string
          id: string
          jurisdictions: string[]
          reference_id: string
          status: string
          title: string
        }[]
      }
      mhd_handbook_my_acknowledgments: {
        Args: never
        Returns: {
          acknowledged_at: string
          esignature_request_id: string
          handbook_title: string
          handbook_type: string
          handbook_version_id: string
          id: string
          status: string
          version_number: number
        }[]
      }
      mhd_handbook_preview: {
        Args: { p_handbook_id: string }
        Returns: {
          body_placeholder: string
          is_required: boolean
          jurisdiction: string
          section_id: string
          section_key: string
          sort_order: number
          title: string
        }[]
      }
      mhd_handbook_publish: {
        Args: {
          p_document_generation_id?: string
          p_effective_date?: string
          p_handbook_id: string
        }
        Returns: {
          content_hash: string
          id: string
          reference_id: string
          version_number: number
        }[]
      }
      mhd_handbook_section_list: {
        Args: { p_handbook_type: string; p_jurisdiction?: string }
        Returns: {
          body_placeholder: string
          handbook_type: string
          id: string
          is_active: boolean
          is_required: boolean
          jurisdiction: string
          section_key: string
          sort_order: number
          title: string
        }[]
      }
      mhd_handbook_toggle_section: {
        Args: {
          p_handbook_id: string
          p_included: boolean
          p_section_id: string
        }
        Returns: undefined
      }
      mhd_handbook_version_get: {
        Args: { p_version_id: string }
        Returns: {
          assembled_content: Json
          content_hash: string
          document_generation_id: string
          effective_date: string
          handbook_id: string
          id: string
          published_at: string
          reference_id: string
          version_number: number
        }[]
      }
      mhd_interview_can_access_interview: {
        Args: { p_interview_id: string }
        Returns: boolean
      }
      mhd_interview_category_list: {
        Args: { p_company_id: string }
        Returns: {
          category_key: string
          category_name: string
          id: string
          is_global: boolean
          sort_order: number
        }[]
      }
      mhd_interview_create: {
        Args: {
          p_application_id: string
          p_guide_id?: string
          p_interview_type?: string
          p_interviewer_person_id: string
          p_scheduled_date?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_interview_evaluation_finalize: {
        Args: {
          p_application_id: string
          p_recommendation: string
          p_status?: string
          p_summary?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_interview_evaluation_get: {
        Args: { p_application_id: string }
        Returns: {
          decided_at: string
          decided_by: string
          decision_summary: string
          id: string
          overall_recommendation: string
          overall_score: number
          reference_id: string
          status: string
        }[]
      }
      mhd_interview_evaluation_overall_score: {
        Args: { p_application_id: string }
        Returns: number
      }
      mhd_interview_evaluation_rollup: {
        Args: { p_application_id: string }
        Returns: {
          avg_rating: number
          competency_id: string
          competency_name: string
          response_count: number
          weight: number
        }[]
      }
      mhd_interview_get_worksheet: {
        Args: { p_interview_id: string }
        Returns: {
          competency_id: string
          competency_name: string
          compliance_guidance: string
          compliance_status: string
          existing_bool: boolean
          existing_rating: number
          existing_text: string
          guide_item_id: string
          question_text: string
          response_type: string
        }[]
      }
      mhd_interview_guide_add_custom: {
        Args: {
          p_category_id?: string
          p_competency_id?: string
          p_guide_id: string
          p_question_text: string
          p_response_type?: string
          p_save_to_bank?: boolean
        }
        Returns: string
      }
      mhd_interview_guide_add_question: {
        Args: { p_guide_id: string; p_question_id: string }
        Returns: string
      }
      mhd_interview_guide_assemble: {
        Args: { p_guide_id: string }
        Returns: number
      }
      mhd_interview_guide_get_or_create: {
        Args: { p_requisition_id: string }
        Returns: string
      }
      mhd_interview_guide_list_items: {
        Args: { p_guide_id: string }
        Returns: {
          competency_id: string
          competency_name: string
          compliance_status: string
          id: string
          question_id: string
          question_text: string
          response_type: string
          sort_order: number
          source: string
        }[]
      }
      mhd_interview_guide_remove_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      mhd_interview_job_competencies: {
        Args: { p_requisition_id: string }
        Returns: {
          competency_id: string
          weight: number
        }[]
      }
      mhd_interview_list: {
        Args: { p_application_id: string }
        Returns: {
          completed_at: string
          guide_id: string
          id: string
          interview_type: string
          interviewer_name: string
          interviewer_person_id: string
          reference_id: string
          scheduled_date: string
          status: string
        }[]
      }
      mhd_interview_question_create: {
        Args: {
          p_category_id: string
          p_company_id: string
          p_competency_id?: string
          p_compliance_guidance?: string
          p_compliance_status?: string
          p_guidance?: string
          p_question_key: string
          p_question_text: string
          p_response_type?: string
          p_scope?: string
        }
        Returns: string
      }
      mhd_interview_question_list: {
        Args: { p_category_id?: string; p_company_id: string; p_scope?: string }
        Returns: {
          category_id: string
          category_name: string
          company_id: string
          competency_id: string
          compliance_guidance: string
          compliance_status: string
          guidance: string
          id: string
          is_global: boolean
          question_key: string
          question_text: string
          response_type: string
          scope: string
        }[]
      }
      mhd_interview_submit_responses: {
        Args: { p_interview_id: string; p_responses: Json }
        Returns: number
      }
      mhd_investigation_add_party: {
        Args: {
          p_case_id: string
          p_external_name?: string
          p_is_confidential?: boolean
          p_party_role: string
          p_person_id?: string
          p_statement?: string
        }
        Returns: string
      }
      mhd_investigation_assign: {
        Args: { p_case_id: string; p_investigator: string }
        Returns: undefined
      }
      mhd_investigation_create: {
        Args: {
          p_allegation: string
          p_assigned_investigator?: string
          p_case_type: string
          p_company_id: string
          p_confidentiality?: string
          p_severity?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_investigation_get: {
        Args: { p_case_id: string }
        Returns: {
          assigned_investigator_user_id: string
          case_type: string
          closed_at: string
          company_id: string
          confidentiality_level: string
          created_at: string
          disposition: string
          finding_summary: string
          id: string
          opened_by: string
          reference_id: string
          severity: string
          status: string
          updated_at: string
        }[]
      }
      mhd_investigation_grant_access: {
        Args: { p_case_id: string; p_user_id: string }
        Returns: undefined
      }
      mhd_investigation_list: {
        Args: { p_company_id: string; p_status?: string }
        Returns: {
          assigned_investigator_user_id: string
          case_type: string
          confidentiality_level: string
          created_at: string
          disposition: string
          id: string
          reference_id: string
          severity: string
          status: string
        }[]
      }
      mhd_investigation_list_grants: {
        Args: { p_case_id: string }
        Returns: {
          granted_at: string
          granted_by: string
          user_id: string
        }[]
      }
      mhd_investigation_list_parties: {
        Args: { p_case_id: string }
        Returns: {
          display_name: string
          has_statement: boolean
          id: string
          is_confidential: boolean
          party_role: string
          person_id: string
        }[]
      }
      mhd_investigation_reveal_allegation: {
        Args: { p_case_id: string }
        Returns: string
      }
      mhd_investigation_reveal_statement: {
        Args: { p_party_id: string }
        Returns: string
      }
      mhd_investigation_revoke_access: {
        Args: { p_case_id: string; p_user_id: string }
        Returns: undefined
      }
      mhd_investigation_transition: {
        Args: {
          p_case_id: string
          p_disposition?: string
          p_finding?: string
          p_new_status: string
        }
        Returns: undefined
      }
      mhd_is_activity_facilitator: {
        Args: { p_activity_id: string }
        Returns: boolean
      }
      mhd_is_hr_administrator: { Args: never; Returns: boolean }
      mhd_is_medical_administrator: { Args: never; Returns: boolean }
      mhd_is_platform_admin: { Args: never; Returns: boolean }
      mhd_is_real_platform_admin: { Args: never; Returns: boolean }
      mhd_issue_property: {
        Args: {
          p_employee_ack_maintain: boolean
          p_employee_ack_policy: boolean
          p_employee_ack_receipt: boolean
          p_employee_ack_report_loss: boolean
          p_employee_signature_name: string
          p_issuance_condition_notes: string
          p_issuer_title: string
          p_person_id: string
          p_property_item_id: string
          p_quantity: number
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_job_assignment_assign: {
        Args: {
          p_effective_from: string
          p_job_id: string
          p_manager_person_id?: string
          p_note?: string
          p_person_id: string
        }
        Returns: string
      }
      mhd_job_assignment_list_for_person: {
        Args: { p_person_id: string }
        Returns: {
          assignment_note: string
          effective_from: string
          effective_to: string
          flsa_classification: string
          id: string
          is_safety_sensitive: boolean
          job_id: string
          job_reference: string
          job_title: string
          manager_person_id: string
        }[]
      }
      mhd_job_can_see_pay: { Args: never; Returns: boolean }
      mhd_job_create_job: {
        Args: {
          p_company_id: string
          p_department?: string
          p_employment_type?: string
          p_flsa_classification?: string
          p_industry?: string
          p_is_safety_sensitive?: boolean
          p_job_code?: string
          p_job_family?: string
          p_job_level?: string
          p_job_title: string
          p_pay_max?: number
          p_pay_min?: number
          p_pay_period?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_job_current_job_for_user: { Args: never; Returns: string }
      mhd_job_delete_job: { Args: { p_job_id: string }; Returns: undefined }
      mhd_job_description_create_draft: {
        Args: { p_copy_from?: string; p_job_id: string }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_job_description_publish: {
        Args: { p_description_id: string; p_effective_from?: string }
        Returns: undefined
      }
      mhd_job_description_set_competencies: {
        Args: { p_competencies: Json; p_description_id: string }
        Returns: undefined
      }
      mhd_job_description_set_functions: {
        Args: { p_description_id: string; p_functions: Json }
        Returns: undefined
      }
      mhd_job_description_set_qualifications: {
        Args: { p_description_id: string; p_qualifications: Json }
        Returns: undefined
      }
      mhd_job_description_update_draft: {
        Args: {
          p_description_id: string
          p_physical_requirements?: string
          p_scope_of_role?: string
          p_summary?: string
          p_supervisory_responsibility?: string
          p_travel_requirement?: string
          p_work_environment?: string
        }
        Returns: undefined
      }
      mhd_job_get_published_for_person: {
        Args: { p_as_of?: string; p_person_id: string }
        Returns: {
          competencies: Json
          description_id: string
          description_reference: string
          effective_from: string
          essential_functions: Json
          flsa_classification: string
          industry: string
          is_safety_sensitive: boolean
          job_id: string
          job_title: string
          marginal_functions: Json
          qualifications: Json
          summary: string
          version_number: number
        }[]
      }
      mhd_job_is_privileged: { Args: never; Returns: boolean }
      mhd_job_list_jobs: {
        Args: {
          p_active_only?: boolean
          p_company_id: string
          p_search?: string
        }
        Returns: {
          department: string
          employment_type: string
          flsa_classification: string
          id: string
          incumbent_count: number
          industry: string
          is_active: boolean
          is_safety_sensitive: boolean
          job_code: string
          job_family: string
          job_level: string
          job_title: string
          pay_max: number
          pay_min: number
          pay_period: string
          published_description_id: string
          reference_id: string
        }[]
      }
      mhd_job_set_pay_range: {
        Args: {
          p_job_id: string
          p_pay_max: number
          p_pay_min: number
          p_pay_period: string
        }
        Returns: undefined
      }
      mhd_job_update_job: {
        Args: {
          p_department?: string
          p_employment_type?: string
          p_flsa_classification?: string
          p_industry?: string
          p_is_active?: boolean
          p_is_safety_sensitive?: boolean
          p_job_code?: string
          p_job_family?: string
          p_job_id: string
          p_job_level?: string
          p_job_title?: string
        }
        Returns: undefined
      }
      mhd_jsonb_set_path: {
        Args: { p_path: string[]; p_target: Json; p_value: Json }
        Returns: Json
      }
      mhd_jsonb_text_first: {
        Args: { p_keys: string[]; p_values: Json }
        Returns: string
      }
      mhd_jsonb_uuid_first: {
        Args: { p_keys: string[]; p_values: Json }
        Returns: string
      }
      mhd_leave_adjust: {
        Args: {
          p_effective_date?: string
          p_hours_delta: number
          p_leave_type_id: string
          p_person_id: string
          p_reason: string
        }
        Returns: string
      }
      mhd_leave_balance: {
        Args: { p_as_of?: string; p_leave_type_id: string; p_person_id: string }
        Returns: number
      }
      mhd_leave_benefit_obligation_record: {
        Args: {
          p_benefit_type: string
          p_case_id: string
          p_coverage_end: string
          p_coverage_start: string
          p_employee_amount: number
          p_employer_amount: number
          p_frequency: string
        }
        Returns: string
      }
      mhd_leave_benefit_transaction_record: {
        Args: {
          p_amount: number
          p_effective_date: string
          p_obligation_id: string
          p_reference_note?: string
          p_reversal_of?: string
          p_transaction_type: string
        }
        Returns: string
      }
      mhd_leave_case_create: {
        Args: {
          p_company_id: string
          p_is_intermittent?: boolean
          p_person_id: string
          p_reason_category: string
          p_requested_end?: string
          p_requested_start?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_leave_case_get_bases: {
        Args: { p_case_id: string }
        Returns: {
          entitlement_hours: number
          jurisdiction: string
          leave_type_id: string
          type_key: string
          type_name: string
        }[]
      }
      mhd_leave_case_list: {
        Args: { p_company_id: string; p_person_id?: string; p_status?: string }
        Returns: {
          basis_count: number
          id: string
          person_display_name: string
          person_id: string
          reason_category: string
          reference_id: string
          requested_end: string
          requested_start: string
          status: string
        }[]
      }
      mhd_leave_case_set_bases: {
        Args: { p_case_id: string; p_type_ids: string[] }
        Returns: undefined
      }
      mhd_leave_case_transition: {
        Args: {
          p_case_id: string
          p_decision_reason?: string
          p_new_status: string
        }
        Returns: undefined
      }
      mhd_leave_cert_list: {
        Args: { p_case_id: string }
        Returns: {
          certification_type: string
          drive_file_id: string
          due_date: string
          id: string
          provider_note: string
          received_at: string
          sufficient: boolean
        }[]
      }
      mhd_leave_cert_mark_sufficient: {
        Args: {
          p_cert_id: string
          p_provider_note?: string
          p_received_at?: string
          p_sufficient: boolean
        }
        Returns: undefined
      }
      mhd_leave_cert_record: {
        Args: {
          p_case_id: string
          p_certification_type: string
          p_due_date?: string
        }
        Returns: string
      }
      mhd_leave_certification_update_status: {
        Args: {
          p_certification_id: string
          p_cure_due_date?: string
          p_deficiency_notified_at?: string
          p_received_at?: string
          p_review_note?: string
          p_status: string
        }
        Returns: undefined
      }
      mhd_leave_designate: {
        Args: { p_case_id: string; p_effective_date: string; p_hours: number }
        Returns: number
      }
      mhd_leave_eligibility_confirm: {
        Args: { p_snapshot_id: string }
        Returns: number
      }
      mhd_leave_eligibility_evaluate: {
        Args: {
          p_as_of_date: string
          p_case_id: string
          p_designated_person_selected?: boolean
          p_eligibility_context?: Json
          p_employer_employee_count: number
          p_facts_source?: string
          p_family_relationship?: string
          p_hours_worked_12_months: number
          p_months_of_service: number
          p_reason_code: string
          p_scheduled_weekly_hours: number
          p_worksite_employee_count_75: number
        }
        Returns: {
          determination_id: string
          entitlement_hours: number
          evaluated_outcome: string
          findings: Json
          leave_type_id: string
          snapshot_id: string
          type_key: string
        }[]
      }
      mhd_leave_eligibility_override: {
        Args: {
          p_determination_id: string
          p_effective_outcome: string
          p_override_reason: string
        }
        Returns: undefined
      }
      mhd_leave_event_record: {
        Args: {
          p_case_id: string
          p_channel?: string
          p_event_type: string
          p_occurred_at: string
          p_summary: string
          p_visibility?: string
        }
        Returns: string
      }
      mhd_leave_list_ledger: {
        Args: { p_leave_type_id?: string; p_person_id: string }
        Returns: {
          created_at: string
          effective_date: string
          entry_type: string
          hours_delta: number
          id: string
          leave_case_id: string
          leave_type_id: string
          reason: string
          reference_id: string
          type_name: string
        }[]
      }
      mhd_leave_notice_mark_delivery: {
        Args: {
          p_delivery_method?: string
          p_delivery_reference?: string
          p_notice_id: string
          p_status: string
        }
        Returns: undefined
      }
      mhd_leave_notice_record: {
        Args: {
          p_authority_name?: string
          p_authority_source_url?: string
          p_case_id: string
          p_content_registry_id?: string
          p_due_at?: string
          p_leave_type_id?: string
          p_notice_type: string
          p_snapshot?: Json
          p_template_key: string
          p_template_version: number
        }
        Returns: string
      }
      mhd_leave_return_to_work_record: {
        Args: {
          p_accommodation_referral_required?: boolean
          p_actual_return_date?: string
          p_case_id: string
          p_expected_return_date: string
          p_fitness_required?: boolean
          p_reinstatement_note?: string
          p_restrictions_present?: boolean
          p_same_or_comparable_job?: boolean
        }
        Returns: string
      }
      mhd_leave_schedule_record: {
        Args: {
          p_actual_hours?: number
          p_case_id: string
          p_end_at?: string
          p_planned_hours?: number
          p_segment_mode: string
          p_start_at: string
          p_status?: string
        }
        Returns: string
      }
      mhd_leave_type_list: {
        Args: { p_company_id: string }
        Returns: {
          citation: string
          company_id: string
          entitlement_hours: number
          id: string
          is_global: boolean
          jurisdiction: string
          measurement_method: string
          measurement_months: number
          requires_certification: boolean
          type_key: string
          type_name: string
        }[]
      }
      mhd_leave_workflow_get: { Args: { p_case_id: string }; Returns: Json }
      mhd_leaves_can_see_medical: { Args: never; Returns: boolean }
      mhd_leaves_is_privileged: { Args: never; Returns: boolean }
      mhd_link_correspondence_thread: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_thread_id: string
        }
        Returns: {
          company_id: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_archived: boolean
          last_message_at: string | null
          linked_at: string | null
          linked_by: string | null
          mailbox_id: string
          origin: string
          reference_id: string
          sensitivity_level: string
          subject: string | null
          subject_person_id: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "correspondence_threads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_link_form_submission_to_entity: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_submission_id: string
        }
        Returns: undefined
      }
      mhd_link_required_notice_pointer_clauses: {
        Args: { p_company_id: string; p_person_id: string }
        Returns: number
      }
      mhd_link_review_documents: {
        Args: {
          p_document_generation_id?: string
          p_esignature_request_id?: string
          p_review_id: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_link_submission_esignature_request: {
        Args: { p_esignature_request_id: string; p_submission_id: string }
        Returns: {
          esignature_request_id: string
          id: string
        }[]
      }
      mhd_list_activity_board: {
        Args: {
          p_activity_type?: string
          p_company_id?: string
          p_from?: string
          p_person_id?: string
          p_search_term?: string
          p_status?: string
          p_task_id?: string
          p_to?: string
        }
        Returns: {
          activity_type: string
          attachment_count: number
          company_id: string
          company_name: string
          created_at: string
          created_by: string
          description_plain_text: string
          description_rich_text: Json
          duration_minutes: number
          follow_up_task_id: string
          id: string
          is_confidential: boolean
          location: string
          note_count: number
          occurred_at: string
          outcome_summary: string
          parent_task_id: string
          participant_display_names: string[]
          person_display_name: string
          person_id: string
          reference_id: string
          scheduled_at: string
          status: string
          sub_activity_done_count: number
          sub_activity_total_count: number
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_activity_participants: {
        Args: { p_activity_id: string }
        Returns: {
          activity_id: string
          created_at: string
          created_by: string
          display_name: string
          id: string
          participant_role: string
          person_id: string
          reference_id: string
          user_id: string
        }[]
      }
      mhd_list_approval_comments: {
        Args: { p_approval_id: string }
        Returns: {
          approval_id: string
          author_name: string
          comment: string
          created_at: string
          id: string
          is_internal: boolean
          user_id: string
        }[]
      }
      mhd_list_approvals_for_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          approval_type: string
          company_id: string
          created_at: string
          created_by: string
          current_level: number
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reference_id: string
          requester_id: string
          requester_name: string
          resolved_at: string
          resolved_by: string
          status: string
          task_id: string
          total_levels: number
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_assignments_for_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          assignment_type: string
          created_at: string
          created_by: string
          display_name: string
          email: string
          entity_id: string
          entity_type: string
          id: string
          reference_id: string
          updated_at: string
          updated_by: string
          user_id: string
        }[]
      }
      mhd_list_attachments_for_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          can_delete: boolean
          created_at: string
          description_plain_text: string
          description_rich_text: Json
          drive_file_id: string
          drive_folder_id: string
          drive_web_content_link: string
          drive_web_view_link: string
          entity_id: string
          entity_type: string
          file_extension: string
          file_size_bytes: number
          id: string
          is_current_version: boolean
          mime_type: string
          original_file_name: string
          reference_id: string
          storage_provider: string
          stored_file_name: string
          uploaded_at: string
          uploaded_by: string
          uploader_display_name: string
          version_number: number
        }[]
      }
      mhd_list_audit_certificates_for_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          certificate_document_generation_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          digitally_signed: boolean
          entity_id: string
          entity_type: string
          generated_at: string | null
          id: string
          merged_document_hash: string | null
          merged_drive_file_id: string | null
          reference_id: string
          signing_certificate_fingerprint: string | null
          source_document_generation_id: string | null
          source_document_hash: string | null
          source_drive_file_id: string | null
          status: string
          updated_at: string
          updated_by: string | null
          verification_code: string
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_certificates"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_list_audit_events: {
        Args: {
          p_company_id: string
          p_date_from?: string
          p_date_to?: string
          p_entity_type?: string
          p_event_type?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          action_type: string
          actor_name: string
          company_id: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          ip_address: string
          metadata: Json
          new_value: string
          old_value: string
          performed_at: string
          performed_by: string
          reference_id: string
          source_module: string
          summary: string
          user_agent: string
        }[]
      }
      mhd_list_case_documents_for_source: {
        Args: { p_source_entity_id: string; p_source_entity_type: string }
        Returns: {
          company_id: string
          confidentiality_level: string
          created_at: string
          document_generation_id: string
          document_kind: string
          generation_status: string
          id: string
          output_drive_file_id: string
          payload: Json
          reference_id: string
          source_entity_id: string
          source_entity_type: string
          status: string
          title: string
          updated_at: string
        }[]
      }
      mhd_list_coaching_plan_items: {
        Args: { p_plan_id: string }
        Returns: {
          activity_id: string
          activity_reference_id: string
          activity_status: string
          completed_at: string
          created_at: string
          created_by: string
          description: string
          due_date: string
          id: string
          plan_id: string
          reference_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_coaching_plans: {
        Args: {
          p_coach_user_id?: string
          p_company_id?: string
          p_person_id?: string
          p_search_term?: string
          p_status?: string
        }
        Returns: {
          coach_display_name: string
          coach_user_id: string
          company_id: string
          company_name: string
          created_at: string
          created_by: string
          id: string
          item_done_count: number
          item_total_count: number
          objective: string
          outcome_summary: string
          person_display_name: string
          person_id: string
          reference_id: string
          source_review_id: string
          source_review_reference_id: string
          start_date: string
          status: string
          target_date: string
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_companies_for_impersonation: {
        Args: never
        Returns: {
          company_name: string
          id: string
          is_platform_org: boolean
          reference_id: string
        }[]
      }
      mhd_list_contact_methods_for_person: {
        Args: { p_person_id: string }
        Returns: {
          contact_type: string
          contact_value: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_correspondence_mailbox_aliases: {
        Args: { p_company_id?: string }
        Returns: {
          alias_address: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          mailbox_id: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "correspondence_mailbox_aliases"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_list_correspondence_messages: {
        Args: { p_limit?: number; p_offset?: number; p_thread_id: string }
        Returns: {
          body_html: string | null
          body_text: string | null
          cc_emails: string[]
          company_id: string | null
          created_at: string
          direction: string
          external_in_reply_to: string | null
          external_message_id: string | null
          external_references: string[] | null
          failure_reason: string | null
          id: string
          is_system: boolean
          provider_message_id: string | null
          received_at: string | null
          recipient_emails: string[]
          reference_id: string
          reply_token: string | null
          sender_display_name: string | null
          sender_email: string
          sender_user_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          thread_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "correspondence_messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_list_correspondence_threads: {
        Args: {
          p_company_id: string
          p_entity_id?: string
          p_entity_type?: string
          p_include_general?: boolean
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          is_archived: boolean
          last_message_at: string
          last_message_preview: string
          linked_at: string
          linked_by: string
          mailbox_id: string
          origin: string
          reference_id: string
          sensitivity_level: string
          subject: string
          subject_person_id: string
          updated_at: string
        }[]
      }
      mhd_list_direct_reports: {
        Args: { p_person_id: string }
        Returns: {
          display_name: string
          job_title: string
          person_id: string
          reference_id: string
        }[]
      }
      mhd_list_document_generations: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          company_id: string
          created_at: string
          esignature_request_id: string
          generated_at: string
          id: string
          output_drive_file_id: string
          output_file_name: string
          reference_id: string
          status: string
          template_id: string
          template_name: string
        }[]
      }
      mhd_list_document_templates: {
        Args: {
          p_company_id?: string
          p_entity_type?: string
          p_include_inactive?: boolean
          p_template_type?: string
        }
        Returns: {
          applicable_entity_type: string
          company_id: string
          content_format: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          merge_fields: Json
          name: string
          reference_id: string
          requires_signature: boolean
          template_type: string
          updated_at: string
          version: number
        }[]
      }
      mhd_list_employee_file_submissions: {
        Args: { p_person_id: string }
        Returns: {
          attachment_count: number
          certificate_digitally_signed: boolean
          certificate_status: string
          certificate_verification_code: string
          created_at: string
          employee_file_category: string
          employee_file_person_id: string
          employee_file_user_id: string
          esignature_request_id: string
          form_id: string
          form_name: string
          id: string
          reference_id: string
          status: string
          submitted_at: string
          submitter_display_name: string
          submitter_id: string
          updated_at: string
        }[]
      }
      mhd_list_forms: {
        Args: { p_company_id: string; p_status?: string }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          definition: Json
          description: string
          employee_file_category: string
          esignature_document_template_id: string
          id: string
          name: string
          previous_version_id: string
          published_at: string
          published_by: string
          reference_id: string
          requires_esignature: boolean
          status: string
          updated_at: string
          updated_by: string
          version: number
        }[]
      }
      mhd_list_impersonation_sessions: {
        Args: { p_limit?: number }
        Returns: {
          admin_display_name: string
          admin_user_id: string
          ended_at: string
          id: string
          impersonated_company_id: string
          impersonated_company_name: string
          impersonated_role: string
          started_at: string
        }[]
      }
      mhd_list_medical_provider_designations: {
        Args: { p_as_of?: string; p_person_id: string }
        Returns: {
          designation_type: string
          effective_from: string
          effective_to: string
          employee_signature_at: string
          employee_signature_name: string
          form_number: string
          health_plan_name: string
          id: string
          is_in_effect: boolean
          physician_signature_at: string
          physician_signature_name: string
          provider_city: string
          provider_name: string
          provider_phone: string
          provider_postal_code: string
          provider_state: string
          provider_street: string
          reference_id: string
          status: string
        }[]
      }
      mhd_list_message_replies: {
        Args: { p_limit?: number; p_parent_message_id: string }
        Returns: {
          body: string
          company_id: string
          created_at: string
          deleted_at: string
          edited_at: string
          id: string
          is_system: boolean
          parent_message_id: string
          reference_id: string
          reply_count: number
          sender_user_id: string
          thread_id: string
        }[]
      }
      mhd_list_message_threads: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_include_archived?: boolean
          p_limit?: number
          p_thread_type?: string
        }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          is_archived: boolean
          last_message_at: string
          last_message_body: string
          participant_count: number
          participants: Json
          reference_id: string
          subject: string
          thread_type: string
          unread_count: number
          updated_at: string
        }[]
      }
      mhd_list_messages: {
        Args: { p_before?: string; p_limit?: number; p_thread_id: string }
        Returns: {
          body: string
          company_id: string
          created_at: string
          deleted_at: string
          edited_at: string
          id: string
          is_system: boolean
          parent_message_id: string
          reference_id: string
          reply_count: number
          sender_user_id: string
          thread_id: string
        }[]
      }
      mhd_list_my_draft_submissions: {
        Args: never
        Returns: {
          created_at: string
          employee_file_category: string
          employee_file_person_id: string
          employee_file_user_id: string
          form_id: string
          id: string
          is_draft: boolean
          reference_id: string
          status: string
          submitted_at: string
          submitter_id: string
          task_id: string
          updated_at: string
          values: Json
        }[]
      }
      mhd_list_notes_for_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          can_delete: boolean
          can_edit: boolean
          company_id: string
          created_at: string
          created_by: string
          created_by_display_name: string
          entity_id: string
          entity_type: string
          id: string
          note_plain_text: string
          note_rich_text: Json
          parent_note_id: string
          reference_id: string
          updated_at: string
          updated_by: string
          visibility: string
        }[]
      }
      mhd_list_notifications: {
        Args: { p_limit?: number }
        Returns: {
          action_url: string | null
          actor_user_id: string | null
          body: string | null
          company_id: string
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          notification_type: string
          read_at: string | null
          recipient_user_id: string
          reference_id: string
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_list_offboarding_cases: {
        Args: {
          p_company_id?: string
          p_from?: string
          p_person_id?: string
          p_search?: string
          p_separation_type?: string
          p_status?: string
          p_to?: string
        }
        Returns: {
          cancel_reason: string
          company_id: string
          company_name: string
          completed_at: string
          created_at: string
          created_by: string
          eligible_for_rehire: boolean
          exit_interview_activity_id: string
          id: string
          initiated_by_user_id: string
          initiator_display_name: string
          last_working_day: string
          outstanding_property_count: number
          person_display_name: string
          person_id: string
          person_primary_email: string
          reason_summary: string
          reference_id: string
          required_done_count: number
          required_total_count: number
          separation_date: string
          separation_type: string
          status: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_offboarding_items: {
        Args: { p_case_id: string }
        Returns: {
          assigned_user_id: string
          assignee_display_name: string
          case_id: string
          completed_at: string
          completed_by: string
          created_at: string
          created_by: string
          description: string
          due_date: string
          id: string
          is_required: boolean
          item_key: string
          linked_drive_file_id: string
          linked_entity_id: string
          linked_entity_type: string
          linked_esignature_status: string
          reference_id: string
          sort_order: number
          status: string
          status_reason: string
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_onboarding_progress_for_company: {
        Args: { p_company_id: string }
        Returns: {
          last_activity_at: string
          next_due_date: string
          person_id: string
          required_completed: number
          required_items: number
          signed_count: number
          submitted_count: number
          total_items: number
          voided_count: number
        }[]
      }
      mhd_list_pending_approvals_for_user: {
        Args: { p_user_id: string }
        Returns: {
          approval_type: string
          company_id: string
          created_at: string
          created_by: string
          current_level: number
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reference_id: string
          requester_id: string
          requester_name: string
          resolved_at: string
          resolved_by: string
          status: string
          task_id: string
          total_levels: number
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_people_directory: {
        Args: { p_company_id?: string; p_search_term?: string }
        Returns: {
          company_id: string
          company_name: string
          created_at: string
          created_by: string
          display_name: string
          first_name: string
          id: string
          last_name: string
          middle_name: string
          photo_path: string
          preferred_name: string
          primary_email: string
          primary_mobile: string
          primary_phone: string
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_people_directory_paged: {
        Args: {
          p_company_id?: string
          p_limit?: number
          p_offset?: number
          p_search_term?: string
          p_sort_column?: string
          p_sort_direction?: string
        }
        Returns: {
          company_id: string
          company_name: string
          created_at: string
          display_name: string
          first_name: string
          id: string
          last_name: string
          middle_name: string
          preferred_name: string
          primary_email: string
          primary_mobile: string
          primary_phone: string
          reference_id: string
          total_count: number
          updated_at: string
        }[]
      }
      mhd_list_people_downline: {
        Args: { p_root_person_id: string }
        Returns: {
          person_id: string
        }[]
      }
      mhd_list_people_org_chart: {
        Args: { p_company_id?: string }
        Returns: {
          company_id: string
          display_name: string
          job_title: string
          manager_id: string
          person_id: string
          reference_id: string
        }[]
      }
      mhd_list_performance_reviews: {
        Args: {
          p_company_id?: string
          p_due_from?: string
          p_due_to?: string
          p_person_id?: string
          p_review_type?: string
          p_reviewer_user_id?: string
          p_search_term?: string
          p_status?: string
        }
        Returns: {
          acknowledged_at: string
          company_id: string
          company_name: string
          created_at: string
          created_by: string
          document_generation_id: string
          document_generation_reference_id: string
          document_generation_status: string
          due_date: string
          employee_comments: string
          esignature_request_id: string
          esignature_request_reference_id: string
          esignature_request_status: string
          goals_summary: string
          id: string
          improvement_summary: string
          overall_rating: number
          person_display_name: string
          person_id: string
          reference_id: string
          review_activity_id: string
          review_period_end: string
          review_period_start: string
          review_type: string
          reviewer_comments: string
          reviewer_display_name: string
          reviewer_user_id: string
          status: string
          strengths_summary: string
          updated_at: string
          updated_by: string
          waiver_reason: string
        }[]
      }
      mhd_list_property_assignments: {
        Args: { p_person_id?: string; p_property_item_id?: string }
        Returns: {
          company_id: string
          employee_ack_maintain: boolean
          employee_ack_policy: boolean
          employee_ack_receipt: boolean
          employee_ack_report_loss: boolean
          employee_return_signature_at: string
          employee_return_signature_name: string
          employee_signature_at: string
          employee_signature_name: string
          id: string
          issuance_condition_notes: string
          issued_at: string
          issued_by: string
          issuer_display_name: string
          issuer_title: string
          item_name: string
          person_display_name: string
          person_id: string
          property_item_id: string
          quantity: number
          received_by: string
          receiver_display_name: string
          receiver_title: string
          reference_id: string
          return_ack_liability: boolean
          return_ack_maintained: boolean
          return_ack_returned: boolean
          return_condition_notes: string
          returned_at: string
          status: string
        }[]
      }
      mhd_list_property_items: {
        Args: { p_company_id: string }
        Returns: {
          acquisition_date: string
          category: string
          company_id: string
          condition_notes: string
          created_at: string
          created_by: string
          description: string
          id: string
          name: string
          quantity_available: number
          quantity_total: number
          reference_id: string
          serial_number: string
          status: string
          unit_cost: number
        }[]
      }
      mhd_list_quotes: {
        Args: never
        Returns: {
          author: string | null
          created_at: string
          id: string
          is_active: boolean
          quote_text: string
          source_citation: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_list_roles: {
        Args: { p_company_id?: string }
        Returns: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          role_name: string
        }[]
        SetofOptions: {
          from: "*"
          to: "roles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_list_signature_requests_for_company: {
        Args: { p_company_id: string }
        Returns: {
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          disclosure_text: string
          disclosure_version: string
          document_drive_file_id: string
          document_generation_id: string
          document_hash: string | null
          document_name: string
          expires_at: string | null
          id: string
          reference_id: string
          signed_document_hash: string | null
          signed_drive_file_id: string | null
          signing_order: string
          status: string
          updated_at: string
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "esignature_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mhd_list_sub_activities: {
        Args: { p_activity_id: string }
        Returns: {
          activity_id: string
          completed_at: string
          created_at: string
          created_by: string
          description_plain_text: string
          id: string
          reference_id: string
          scheduled_at: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_submissions_for_form: {
        Args: { p_form_id: string }
        Returns: {
          created_at: string
          employee_file_category: string
          employee_file_person_id: string
          employee_file_user_id: string
          form_id: string
          id: string
          is_draft: boolean
          reference_id: string
          status: string
          submitted_at: string
          submitter_id: string
          task_id: string
          updated_at: string
          values: Json
        }[]
      }
      mhd_list_subtasks_for_task: {
        Args: { p_task_id: string }
        Returns: {
          calculated_progress_percent: number
          created_at: string
          created_by: string
          description_plain_text: string
          description_rich_text: Json
          due_date: string
          id: string
          manual_progress_percent: number
          overall_progress_percent: number
          priority_color_token: string
          priority_id: string
          priority_name: string
          reference_id: string
          sort_order: number
          status_category: string
          status_color_token: string
          status_id: string
          status_name: string
          task_id: string
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_task_assignable_users: {
        Args: { p_company_id?: string }
        Returns: {
          company_id: string
          display_name: string
          email: string
          id: string
          person_id: string
        }[]
      }
      mhd_list_task_board: {
        Args: {
          p_assigned_user_id?: string
          p_company_id?: string
          p_due_from?: string
          p_due_to?: string
          p_priority_id?: string
          p_search_term?: string
          p_status_id?: string
        }
        Returns: {
          assigned_date: string
          assigned_display_names: string[]
          assigned_user_ids: string[]
          attachment_count: number
          calculated_progress_percent: number
          company_id: string
          company_name: string
          completed_date: string
          created_at: string
          created_by: string
          description_plain_text: string
          description_rich_text: Json
          detailed_instructions_plain_text: string
          detailed_instructions_rich_text: Json
          due_date: string
          id: string
          manual_progress_percent: number
          note_count: number
          priority_color_token: string
          priority_id: string
          priority_name: string
          reference_id: string
          start_date: string
          status_color_token: string
          status_id: string
          status_name: string
          title: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_list_task_priority_options: {
        Args: never
        Returns: {
          color_token: string
          display_order: number
          id: string
          priority_name: string
        }[]
      }
      mhd_list_task_status_options: {
        Args: never
        Returns: {
          category: string
          color_token: string
          display_order: number
          id: string
          status_name: string
        }[]
      }
      mhd_list_trusted_devices: {
        Args: never
        Returns: {
          first_seen_at: string
          id: string
          label: string
          last_seen_at: string
          revoked_at: string
        }[]
      }
      mhd_list_visible_people_scope: {
        Args: { p_company_id?: string }
        Returns: {
          company_id: string
          person_id: string
        }[]
      }
      mhd_mark_all_notifications_read: { Args: never; Returns: undefined }
      mhd_mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
      }
      mhd_mark_property_lost_or_damaged: {
        Args: {
          p_assignment_id: string
          p_new_status: string
          p_notes?: string
        }
        Returns: undefined
      }
      mhd_mark_thread_read: {
        Args: { p_thread_id: string }
        Returns: undefined
      }
      mhd_mileage_add_trip_to_claim: {
        Args: { p_claim_id: string; p_trip_id: string }
        Returns: undefined
      }
      mhd_mileage_cancel_claim: {
        Args: { p_claim_id: string; p_reason: string }
        Returns: undefined
      }
      mhd_mileage_confirm_rate: {
        Args: { p_rate_id: string }
        Returns: undefined
      }
      mhd_mileage_create_claim: {
        Args: {
          p_period_end: string
          p_period_start: string
          p_person_id: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_mileage_decide_claim: {
        Args: {
          p_claim_id: string
          p_decision: string
          p_decision_note?: string
        }
        Returns: undefined
      }
      mhd_mileage_get_claim: {
        Args: { p_claim_id: string }
        Returns: {
          decision_note: string
          exported_at: string
          id: string
          lines: Json
          period_end: string
          period_start: string
          person_display_name: string
          person_id: string
          reference_id: string
          status: string
          taxable_excess: number
          total_company_amount: number
          total_irs_amount: number
          total_miles: number
        }[]
      }
      mhd_mileage_get_effective_rate: {
        Args: { p_company_id: string; p_on_date?: string }
        Returns: {
          company_rate: number
          irs_rate: number
          irs_rate_id: string
          policy_id: string
          rate_mode: string
        }[]
      }
      mhd_mileage_is_privileged: { Args: never; Returns: boolean }
      mhd_mileage_list_claims: {
        Args: { p_company_id: string; p_person_id?: string; p_status?: string }
        Returns: {
          id: string
          line_count: number
          period_end: string
          period_start: string
          person_display_name: string
          person_id: string
          reference_id: string
          status: string
          total_company_amount: number
        }[]
      }
      mhd_mileage_list_rates: {
        Args: { p_category?: string; p_status?: string }
        Returns: {
          category: string
          confirmed_at: string
          effective_from: string
          effective_to: string
          fetch_source: string
          id: string
          notes: string
          notice_number: string
          rate_per_mile: number
          reference_id: string
          retrieved_at: string
          source_document_date: string
          source_url: string
          status: string
        }[]
      }
      mhd_mileage_list_trips: {
        Args: {
          p_company_id: string
          p_from?: string
          p_include_voided?: boolean
          p_person_id?: string
          p_to?: string
          p_unclaimed_only?: boolean
        }
        Returns: {
          business_purpose: string
          claim_id: string
          claim_status: string
          destination: string
          id: string
          miles: number
          origin: string
          person_display_name: string
          person_id: string
          recorded_on_behalf: boolean
          reference_id: string
          reimbursable_miles: number
          trip_date: string
          voided_at: string
        }[]
      }
      mhd_mileage_mark_exported: {
        Args: { p_batch_reference: string; p_claim_id: string }
        Returns: undefined
      }
      mhd_mileage_propose_rate: {
        Args: {
          p_category: string
          p_effective_from: string
          p_notes?: string
          p_notice_number: string
          p_rate_per_mile: number
          p_source_document_date?: string
          p_source_url: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_mileage_record_trip: {
        Args: {
          p_business_purpose: string
          p_commute_deduction_miles?: number
          p_destination: string
          p_is_round_trip?: boolean
          p_miles: number
          p_not_ordinary_commuting: boolean
          p_notes?: string
          p_odometer_end?: number
          p_odometer_start?: number
          p_origin: string
          p_person_id: string
          p_trip_date: string
          p_vehicle_description?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_mileage_remove_trip_from_claim: {
        Args: { p_claim_id: string; p_trip_id: string }
        Returns: undefined
      }
      mhd_mileage_resolve_rate_for_date: {
        Args: { p_category: string; p_on_date: string }
        Returns: {
          rate_id: string
          rate_per_mile: number
        }[]
      }
      mhd_mileage_set_company_policy: {
        Args: {
          p_company_id: string
          p_effective_from: string
          p_fixed_rate_per_mile?: number
          p_policy_note?: string
          p_rate_mode: string
        }
        Returns: string
      }
      mhd_mileage_submit_claim: {
        Args: { p_claim_id: string }
        Returns: undefined
      }
      mhd_mileage_update_trip: {
        Args: {
          p_business_purpose?: string
          p_commute_deduction_miles?: number
          p_destination?: string
          p_miles?: number
          p_notes?: string
          p_odometer_end?: number
          p_odometer_start?: number
          p_origin?: string
          p_trip_date?: string
          p_trip_id: string
          p_vehicle_description?: string
        }
        Returns: undefined
      }
      mhd_mileage_void_trip: {
        Args: { p_reason: string; p_trip_id: string }
        Returns: undefined
      }
      mhd_next_business_day: { Args: { p_from: string }; Returns: string }
      mhd_next_reference_id: { Args: { p_prefix: string }; Returns: string }
      mhd_notification_channel_message: {
        Args: { p_delivery_id: string }
        Returns: Json
      }
      mhd_notification_channel_message_placeholder: {
        Args: { p_delivery_id: string }
        Returns: Json
      }
      mhd_notification_channel_task: {
        Args: { p_delivery_id: string }
        Returns: Json
      }
      mhd_notification_deliveries_pending: {
        Args: { p_channel_key: string; p_limit?: number }
        Returns: {
          action_url: string
          body: string
          company_id: string
          delivery_id: string
          notification_type: string
          recipient_email: string
          recipient_user_id: string
          title: string
        }[]
      }
      mhd_notification_delivery_complete: {
        Args: {
          p_delivery_id: string
          p_error_text?: string
          p_provider_ref?: string
          p_status: string
        }
        Returns: undefined
      }
      mhd_notification_dispatch: {
        Args: { p_limit?: number }
        Returns: {
          channel_key: string
          delivery_id: string
          status: string
        }[]
      }
      mhd_notification_unread_count: { Args: never; Returns: number }
      mhd_notify: {
        Args: {
          p_action_url?: string
          p_actor_user_id?: string
          p_body?: string
          p_channels?: string[]
          p_company_id: string
          p_entity_id?: string
          p_entity_type?: string
          p_notification_type: string
          p_recipient_user_ids: string[]
          p_title: string
        }
        Returns: string[]
      }
      mhd_onboarding_cancel_person: {
        Args: { p_person_id: string; p_reason: string }
        Returns: number
      }
      mhd_open_compliance_deadline: {
        Args: {
          p_basis_at: string
          p_basis_event: string
          p_company_id: string
          p_deadline_kind: string
          p_document_key?: string
          p_interval_amount: number
          p_interval_unit: string
          p_legal_citation?: string
          p_person_id?: string
          p_subject_id: string
          p_subject_table: string
        }
        Returns: string
      }
      mhd_open_packet_deadlines: {
        Args: {
          p_company_id: string
          p_first_day_of_work: string
          p_i9_record_id?: string
          p_person_id: string
          p_wage_notice_id?: string
          p_wotc_8850_id?: string
        }
        Returns: number
      }
      mhd_people_display_name: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_preferred_name?: string
        }
        Returns: string
      }
      mhd_performance_add_review_competency: {
        Args: { p_competency_id: string; p_review_id: string }
        Returns: string
      }
      mhd_performance_approve_participant: {
        Args: { p_participant_id: string }
        Returns: undefined
      }
      mhd_performance_close_feedback: {
        Args: { p_reason: string; p_review_id: string }
        Returns: undefined
      }
      mhd_performance_create_template: {
        Args: {
          p_company_id: string
          p_description?: string
          p_sections?: Json
          p_template_name: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_performance_decline_participation: {
        Args: { p_participant_id: string; p_reason?: string }
        Returns: undefined
      }
      mhd_performance_feedback_aggregate: {
        Args: { p_review_id: string }
        Returns: {
          comments: Json
          competency_id: string
          competency_name: string
          mean_rating: number
          participant_type: string
          response_count: number
          section_id: string
          section_title: string
        }[]
      }
      mhd_performance_feedback_threshold: {
        Args: { p_company_id: string }
        Returns: number
      }
      mhd_performance_get_settings: {
        Args: { p_company_id: string }
        Returns: {
          min_responses_for_release: number
          release_verbatim_comments: boolean
        }[]
      }
      mhd_performance_invite_participant: {
        Args: {
          p_participant_type: string
          p_person_id: string
          p_review_id: string
        }
        Returns: string
      }
      mhd_performance_is_privileged: { Args: never; Returns: boolean }
      mhd_performance_list_participants: {
        Args: { p_review_id: string }
        Returns: {
          id: string
          participant_type: string
          person_display_name: string
          person_id: string
          responded_at: string
          status: string
        }[]
      }
      mhd_performance_list_review_competencies: {
        Args: { p_review_id: string }
        Returns: {
          category: string
          comments: string
          competency_id: string
          competency_name: string
          id: string
          is_inherited: boolean
          is_regulated: boolean
          rating: number
        }[]
      }
      mhd_performance_list_templates: {
        Args: { p_company_id: string }
        Returns: {
          company_id: string
          id: string
          is_global: boolean
          reference_id: string
          section_count: number
          status: string
          template_name: string
          version_number: number
        }[]
      }
      mhd_performance_my_invitations: {
        Args: never
        Returns: {
          participant_id: string
          participant_type: string
          review_id: string
          review_period_end: string
          status: string
          subject_name: string
        }[]
      }
      mhd_performance_publish_template: {
        Args: { p_effective_from?: string; p_template_id: string }
        Returns: undefined
      }
      mhd_performance_rate_competency: {
        Args: {
          p_comments?: string
          p_rating: number
          p_review_competency_id: string
        }
        Returns: undefined
      }
      mhd_performance_seed_competencies: {
        Args: { p_review_id: string }
        Returns: number
      }
      mhd_performance_submit_feedback: {
        Args: { p_participant_id: string; p_responses: Json }
        Returns: undefined
      }
      mhd_performance_upsert_settings: {
        Args: {
          p_company_id: string
          p_min_responses_for_release: number
          p_release_verbatim_comments: boolean
        }
        Returns: undefined
      }
      mhd_person_current_employment_state: {
        Args: { p_person_id: string }
        Returns: {
          company_id: string
          effective_from: string
          id: string
          person_id: string
          reason: string
          reference_id: string
          source_entity_id: string
          source_entity_type: string
          source_module: string
          state: string
        }[]
      }
      mhd_person_employment_state_history: {
        Args: { p_person_id: string }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          effective_from: string
          effective_to: string
          id: string
          person_id: string
          reason: string
          reference_id: string
          source_entity_id: string
          source_entity_type: string
          source_module: string
          state: string
        }[]
      }
      mhd_person_set_employment_state: {
        Args: {
          p_actor_user_id: string
          p_company_id: string
          p_effective_from: string
          p_person_id: string
          p_reason: string
          p_source_entity_id: string
          p_source_entity_type: string
          p_source_module: string
          p_state: string
        }
        Returns: {
          company_id: string
          effective_from: string
          effective_to: string
          id: string
          person_id: string
          reason: string
          reference_id: string
          state: string
        }[]
      }
      mhd_provision_company_user: {
        Args: {
          p_actor_user_id?: string
          p_auth_user_id: string
          p_company_id: string
          p_email: string
          p_first_name: string
          p_last_name: string
          p_middle_name?: string
          p_mobile?: string
          p_phone?: string
          p_preferred_name?: string
          p_role_name: string
        }
        Returns: {
          person_id: string
          user_id: string
        }[]
      }
      mhd_provision_platform_admin: {
        Args: {
          p_auth_user_id: string
          p_company_name: string
          p_email: string
          p_first_name: string
          p_last_name: string
        }
        Returns: {
          company_id: string
          person_id: string
          user_id: string
        }[]
      }
      mhd_publish_form: { Args: { p_form_id: string }; Returns: undefined }
      mhd_recalculate_task_progress: {
        Args: { p_task_id: string }
        Returns: undefined
      }
      mhd_record_attestation_acknowledgment: {
        Args: {
          p_ip_address?: string
          p_signing_token: string
          p_user_agent?: string
        }
        Returns: {
          acknowledged_at: string
          request_id: string
          signer_id: string
        }[]
      }
      mhd_record_correspondence_message: {
        Args: {
          p_body_html?: string
          p_body_text?: string
          p_cc_emails?: string[]
          p_direction: string
          p_external_in_reply_to?: string
          p_external_message_id?: string
          p_external_references?: string[]
          p_failure_reason?: string
          p_is_system?: boolean
          p_provider_message_id?: string
          p_received_at?: string
          p_recipient_emails?: string[]
          p_reply_token?: string
          p_sender_display_name?: string
          p_sender_email?: string
          p_sender_user_id?: string
          p_sent_at?: string
          p_status?: string
          p_subject?: string
          p_thread_id: string
        }
        Returns: {
          body_html: string | null
          body_text: string | null
          cc_emails: string[]
          company_id: string | null
          created_at: string
          direction: string
          external_in_reply_to: string | null
          external_message_id: string | null
          external_references: string[] | null
          failure_reason: string | null
          id: string
          is_system: boolean
          provider_message_id: string | null
          received_at: string | null
          recipient_emails: string[]
          reference_id: string
          reply_token: string | null
          sender_display_name: string | null
          sender_email: string
          sender_user_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          thread_id: string
        }
        SetofOptions: {
          from: "*"
          to: "correspondence_messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_record_esign_consent: {
        Args: {
          p_company_id: string
          p_consent_ip?: unknown
          p_consent_text: string
          p_consent_user_agent?: string
          p_consent_version?: string
          p_document_key?: string
          p_person_id: string
          p_subject_id?: string
          p_subject_table?: string
        }
        Returns: string
      }
      mhd_record_printed_confirmation_delivered: {
        Args: { p_drive_file_id?: string; p_signer_id: string }
        Returns: {
          delivered_at: string
          request_id: string
          signer_id: string
        }[]
      }
      mhd_record_required_notice_ack_detail: {
        Args: {
          p_ack_id: string
          p_clauses: Json
          p_items: Json
          p_language: string
        }
        Returns: string
      }
      mhd_record_revocation: {
        Args: {
          p_company_id: string
          p_document_key?: string
          p_effective_rule?: string
          p_notice_received_at?: string
          p_person_id: string
          p_revocation_method: string
          p_revocation_note?: string
          p_subject_id: string
          p_subject_table: string
        }
        Returns: string
      }
      mhd_record_signatory: {
        Args: {
          p_company_id: string
          p_document_key?: string
          p_person_id?: string
          p_signatory_address?: string
          p_signatory_ordinal?: number
          p_signatory_role: string
          p_signatory_title?: string
          p_signature_asset_id?: string
          p_signature_method: string
          p_signed_ip?: unknown
          p_signed_name: string
          p_signed_user_agent?: string
          p_subject_id: string
          p_subject_table: string
        }
        Returns: string
      }
      mhd_record_signature_consent: {
        Args: {
          p_acknowledged_hardware_requirements: boolean
          p_acknowledged_paper_copy_right: boolean
          p_acknowledged_withdrawal_right: boolean
          p_agreed_to_use_electronic_signature: boolean
          p_consented_to_electronic_records: boolean
          p_ip_address?: string
          p_signing_token: string
          p_user_agent?: string
        }
        Returns: {
          consented_at: string
          request_id: string
          signer_id: string
        }[]
      }
      mhd_recruiting_application_get: {
        Args: { p_application_id: string }
        Returns: {
          availability_date: string
          cover_note: string
          created_at: string
          current_stage_id: string
          desired_pay_rate: number
          employment_type_desired: string
          id: string
          invited_at: string
          lifecycle: string
          person_display_name: string
          person_id: string
          reference_id: string
          rejection_note: string
          rejection_reason_id: string
          rejection_reason_text: string
          requisition_id: string
          requisition_title: string
          source: string
          stage_name: string
          submitted_at: string
        }[]
      }
      mhd_recruiting_application_history: {
        Args: { p_application_id: string }
        Returns: {
          from_stage_id: string
          from_stage_name: string
          id: string
          moved_at: string
          moved_by: string
          note: string
          to_stage_id: string
          to_stage_name: string
        }[]
      }
      mhd_recruiting_application_invite: {
        Args: {
          p_person_id: string
          p_requisition_id: string
          p_source?: string
        }
        Returns: {
          id: string
          invite_token: string
          reference_id: string
        }[]
      }
      mhd_recruiting_application_list: {
        Args: {
          p_lifecycle?: string
          p_requisition_id: string
          p_stage_id?: string
        }
        Returns: {
          created_at: string
          current_stage_id: string
          id: string
          lifecycle: string
          person_display_name: string
          person_id: string
          reference_id: string
          source: string
          stage_name: string
          submitted_at: string
        }[]
      }
      mhd_recruiting_application_move_stage: {
        Args: {
          p_application_id: string
          p_note?: string
          p_to_stage_id: string
        }
        Returns: undefined
      }
      mhd_recruiting_application_reject: {
        Args: {
          p_application_id: string
          p_note?: string
          p_reason_id?: string
        }
        Returns: undefined
      }
      mhd_recruiting_application_submit: {
        Args: {
          p_availability_date?: string
          p_cover_note?: string
          p_desired_pay_rate?: number
          p_employment_type_desired?: string
          p_invite_token: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_recruiting_can_view_requisition: {
        Args: { p_req_id: string }
        Returns: boolean
      }
      mhd_recruiting_eeo_report: {
        Args: { p_company_id: string; p_requisition_id?: string }
        Returns: {
          applicant_count: number
          bucket: string
          dimension: string
        }[]
      }
      mhd_recruiting_eeo_submit: {
        Args: {
          p_declined?: boolean
          p_disability_status?: string
          p_gender?: string
          p_invite_token: string
          p_race_ethnicity?: string
          p_veteran_status?: string
        }
        Returns: undefined
      }
      mhd_recruiting_hire_payload: {
        Args: { p_application_id: string }
        Returns: {
          base_salary: number
          employment_type: string
          evaluation_recommendation: string
          evaluation_summary: string
          offer_expiration_date: string
          offer_job_title: string
          onboarding_overall_rating: number
          onboarding_recommendation: string
          overall_score: number
          pay_frequency: string
          person_display_name: string
          person_id: string
          reporting_manager_name: string
          requisition_title: string
          start_date: string
        }[]
      }
      mhd_recruiting_is_privileged: { Args: never; Returns: boolean }
      mhd_recruiting_map_onboarding_recommendation: {
        Args: { p_rec: string }
        Returns: string
      }
      mhd_recruiting_offer_accept: {
        Args: { p_esignature_request_id?: string; p_offer_id: string }
        Returns: {
          job_assignment_id: string
          offer_id: string
          onboarding_candidate_evaluation_id: string
          onboarding_offer_letter_id: string
        }[]
      }
      mhd_recruiting_offer_create: {
        Args: {
          p_application_id: string
          p_base_salary?: number
          p_employment_type?: string
          p_job_title: string
          p_offer_expiration_date?: string
          p_pay_frequency?: string
          p_reporting_manager_person_id?: string
          p_requires_approval?: boolean
          p_start_date?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_recruiting_offer_decline: {
        Args: { p_offer_id: string; p_reason?: string }
        Returns: undefined
      }
      mhd_recruiting_offer_extend: {
        Args: {
          p_document_generation_id?: string
          p_esignature_request_id?: string
          p_offer_id: string
        }
        Returns: undefined
      }
      mhd_recruiting_offer_get: {
        Args: { p_offer_id: string }
        Returns: {
          accepted_at: string
          application_id: string
          base_salary: number
          company_id: string
          created_at: string
          decline_reason: string
          declined_at: string
          document_generation_id: string
          employment_type: string
          esignature_request_id: string
          id: string
          job_assignment_id: string
          job_title: string
          offer_expiration_date: string
          pay_frequency: string
          reference_id: string
          reporting_manager_person_id: string
          requires_approval: boolean
          start_date: string
          status: string
        }[]
      }
      mhd_recruiting_offer_list: {
        Args: { p_application_id: string }
        Returns: {
          accepted_at: string
          base_salary: number
          created_at: string
          declined_at: string
          employment_type: string
          esignature_request_id: string
          id: string
          job_title: string
          offer_expiration_date: string
          pay_frequency: string
          reference_id: string
          start_date: string
          status: string
        }[]
      }
      mhd_recruiting_offer_rescind: {
        Args: { p_offer_id: string; p_reason?: string }
        Returns: undefined
      }
      mhd_recruiting_reason_list: {
        Args: { p_company_id: string }
        Returns: {
          id: string
          is_global: boolean
          reason_key: string
          reason_text: string
          sort_order: number
        }[]
      }
      mhd_recruiting_requisition_create: {
        Args: {
          p_company_id: string
          p_department?: string
          p_employment_type?: string
          p_headcount?: number
          p_hiring_manager_person_id?: string
          p_job_id?: string
          p_location?: string
          p_requires_approval?: boolean
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_recruiting_requisition_list: {
        Args: { p_company_id: string; p_status?: string }
        Returns: {
          created_at: string
          department: string
          employment_type: string
          headcount: number
          hiring_manager_name: string
          hiring_manager_person_id: string
          id: string
          job_id: string
          location: string
          open_application_count: number
          opened_at: string
          reference_id: string
          requires_approval: boolean
          status: string
          title: string
        }[]
      }
      mhd_recruiting_requisition_transition: {
        Args: { p_new_status: string; p_req_id: string }
        Returns: undefined
      }
      mhd_recruiting_stage_list: {
        Args: { p_company_id: string }
        Returns: {
          category: string
          company_id: string
          id: string
          is_active: boolean
          is_global: boolean
          sort_order: number
          stage_key: string
          stage_name: string
        }[]
      }
      mhd_recruiting_stage_upsert: {
        Args: {
          p_category?: string
          p_company_id: string
          p_sort_order?: number
          p_stage_key: string
          p_stage_name: string
        }
        Returns: string
      }
      mhd_register_trusted_device: {
        Args: { p_device_token: string; p_label?: string }
        Returns: string
      }
      mhd_reject_approval_step: {
        Args: {
          p_actor_user_id?: string
          p_approval_id: string
          p_reason: string
        }
        Returns: {
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_remove_activity_participant: {
        Args: { p_participant_id: string }
        Returns: undefined
      }
      mhd_remove_message_thread_participant: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: undefined
      }
      mhd_replace_form_definition: {
        Args: { p_definition: Json; p_form_id: string }
        Returns: undefined
      }
      mhd_report_overdue_tasks: {
        Args: { p_company_id?: string }
        Returns: {
          company_id: string
          company_name: string
          days_overdue: number
          due_date: string
          priority_name: string
          reference_id: string
          status_name: string
          task_id: string
          title: string
        }[]
      }
      mhd_report_sla_compliance: {
        Args: { p_company_id?: string }
        Returns: {
          completed_late: number
          completed_on_time: number
          sla_compliance_percent: number
          total_completed: number
        }[]
      }
      mhd_report_task_summary: {
        Args: { p_company_id?: string }
        Returns: Json
      }
      mhd_report_workload: {
        Args: { p_company_id?: string }
        Returns: {
          completed: number
          display_name: string
          in_progress: number
          not_started: number
          overdue_count: number
          total_assigned: number
          user_id: string
        }[]
      }
      mhd_request_case_document_generation: {
        Args: {
          p_case_document_id: string
          p_merge_data?: Json
          p_template_key?: string
        }
        Returns: {
          document_generation_id: string
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_request_document_generation: {
        Args: {
          p_actor_user_id?: string
          p_company_id: string
          p_entity_id: string
          p_entity_type: string
          p_merge_data: Json
          p_template_id: string
        }
        Returns: {
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_request_submission_document_generation: {
        Args: { p_submission_id: string }
        Returns: {
          generation_id: string
          generation_reference_id: string
          status: string
        }[]
      }
      mhd_require_aal2: { Args: never; Returns: undefined }
      mhd_resolve_activity_company_id: {
        Args: { p_activity_id: string }
        Returns: string
      }
      mhd_resolve_attachment_company_id: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: string
      }
      mhd_resolve_correspondence_company_by_alias: {
        Args: { p_alias_address: string }
        Returns: string
      }
      mhd_resolve_entity_company_id: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: string
      }
      mhd_resolve_official_instrument: {
        Args: { p_instrument_key: string; p_language_code?: string }
        Returns: {
          asset_id: string | null
          created_at: string
          created_by: string | null
          edition_date: string | null
          edition_label: string | null
          expires_on: string | null
          form_number: string
          id: string
          instrument_key: string
          is_current: boolean
          issuing_agency: string
          jurisdiction: string
          language_code: string
          notes: string | null
          omb_control_number: string | null
          retired_at: string | null
          source_url: string | null
          superseded_by: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "official_instruments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_return_property: {
        Args: {
          p_assignment_id: string
          p_employee_return_signature_name: string
          p_receiver_title: string
          p_return_ack_liability: boolean
          p_return_ack_maintained: boolean
          p_return_ack_returned: boolean
          p_return_condition_notes: string
        }
        Returns: undefined
      }
      mhd_reveal_submission_field: {
        Args: { p_field_id: string; p_submission_id: string }
        Returns: string
      }
      mhd_revoke_trusted_device: {
        Args: { p_device_id: string }
        Returns: undefined
      }
      mhd_satisfy_compliance_deadline: {
        Args: { p_deadline_id: string; p_note?: string }
        Returns: undefined
      }
      mhd_save_form_draft: {
        Args: { p_submission_id: string; p_values: Json }
        Returns: undefined
      }
      mhd_schedule_assign_template: {
        Args: {
          p_effective_from: string
          p_note?: string
          p_person_id: string
          p_template_id: string
        }
        Returns: string
      }
      mhd_schedule_create_template: {
        Args: {
          p_company_id: string
          p_days: Json
          p_description?: string
          p_template_name: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_schedule_delete_holiday: {
        Args: { p_holiday_id: string }
        Returns: undefined
      }
      mhd_schedule_delete_template: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      mhd_schedule_end_assignment: {
        Args: { p_assignment_id: string; p_effective_to: string }
        Returns: undefined
      }
      mhd_schedule_generate_shifts: {
        Args: { p_from: string; p_person_id: string; p_to: string }
        Returns: number
      }
      mhd_schedule_get_template: {
        Args: { p_template_id: string }
        Returns: {
          company_id: string
          day_of_week: number
          description: string
          end_time: string
          id: string
          is_active: boolean
          is_working_day: boolean
          reference_id: string
          start_time: string
          template_name: string
          unpaid_break_minutes: number
        }[]
      }
      mhd_schedule_list_assignments: {
        Args: { p_person_id: string }
        Returns: {
          assignment_note: string
          effective_from: string
          effective_to: string
          id: string
          template_id: string
          template_name: string
        }[]
      }
      mhd_schedule_list_holidays: {
        Args: { p_company_id: string; p_from?: string; p_to?: string }
        Returns: {
          holiday_date: string
          holiday_name: string
          id: string
          is_paid: boolean
        }[]
      }
      mhd_schedule_list_shifts: {
        Args: { p_from: string; p_person_id: string; p_to: string }
        Returns: {
          classification: string
          end_time: string
          id: string
          is_holiday: boolean
          occurrence_id: string
          occurrence_type: string
          override_reason: string
          shift_date: string
          source: string
          start_time: string
          unpaid_break_minutes: number
        }[]
      }
      mhd_schedule_list_templates: {
        Args: { p_company_id: string }
        Returns: {
          assigned_count: number
          created_at: string
          description: string
          id: string
          is_active: boolean
          reference_id: string
          template_name: string
          total_weekly_hours: number
          working_days: number
        }[]
      }
      mhd_schedule_override_shift: {
        Args: {
          p_end_time: string
          p_reason: string
          p_shift_id: string
          p_start_time: string
          p_unpaid_break_minutes: number
        }
        Returns: undefined
      }
      mhd_schedule_update_template: {
        Args: {
          p_days?: Json
          p_description?: string
          p_is_active?: boolean
          p_template_id: string
          p_template_name?: string
        }
        Returns: undefined
      }
      mhd_schedule_upsert_holiday: {
        Args: {
          p_company_id: string
          p_holiday_date: string
          p_holiday_name: string
          p_is_paid?: boolean
        }
        Returns: string
      }
      mhd_search: {
        Args: {
          p_company_id?: string
          p_entity_types?: string[]
          p_limit?: number
          p_offset?: number
          p_query: string
        }
        Returns: Json
      }
      mhd_search_companies: {
        Args: { p_limit?: number; p_offset?: number; p_query: string }
        Returns: {
          company_name: string
          id: string
          match_rank: number
          reference_id: string
        }[]
      }
      mhd_search_notes: {
        Args: {
          p_company_id?: string
          p_limit?: number
          p_offset?: number
          p_query: string
        }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          match_rank: number
          note_plain_text: string
          reference_id: string
          visibility: string
        }[]
      }
      mhd_search_people: {
        Args: {
          p_company_id?: string
          p_limit?: number
          p_offset?: number
          p_query: string
        }
        Returns: {
          company_id: string
          company_name: string
          display_name: string
          id: string
          match_rank: number
          primary_email: string
          primary_phone: string
          reference_id: string
        }[]
      }
      mhd_search_tasks: {
        Args: {
          p_assigned_user_id?: string
          p_company_id?: string
          p_limit?: number
          p_offset?: number
          p_priority_id?: string
          p_query: string
          p_status_id?: string
        }
        Returns: {
          company_id: string
          company_name: string
          description_plain_text: string
          due_date: string
          id: string
          match_rank: number
          priority_id: string
          priority_name: string
          reference_id: string
          status_id: string
          status_name: string
          title: string
        }[]
      }
      mhd_self_complete_profile: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_middle_name?: string
          p_mobile?: string
          p_phone?: string
          p_preferred_name?: string
        }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          display_name: string
          first_name: string
          id: string
          last_name: string
          middle_name: string
          preferred_name: string
          primary_email: string
          primary_mobile: string
          primary_phone: string
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_send_message: {
        Args: {
          p_body: string
          p_parent_message_id?: string
          p_thread_id: string
        }
        Returns: string
      }
      mhd_send_signature_reminder: {
        Args: { p_actor_user_id?: string; p_signer_id: string }
        Returns: undefined
      }
      mhd_set_person_photo: {
        Args: {
          p_actor_user_id?: string
          p_person_id: string
          p_photo_path: string
        }
        Returns: {
          id: string
          photo_path: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_sign_via_token: {
        Args: {
          p_intent_to_sign: boolean
          p_ip_address?: string
          p_presented_document_hash: string
          p_signature_color?: string
          p_signature_font?: string
          p_signing_token: string
          p_typed_signature_name: string
          p_user_agent?: string
        }
        Returns: {
          request_id: string
          request_status: string
          signer_status: string
        }[]
      }
      mhd_start_impersonation: {
        Args: { p_company_id?: string; p_role: string }
        Returns: string
      }
      mhd_start_onboarding_packet: {
        Args: {
          p_actor_user_id: string
          p_company_id: string
          p_document_keys: string[]
          p_due_date: string
          p_person_id: string
        }
        Returns: {
          company_id: string
          completed_at: string
          document_key: string
          document_record_id: string
          due_date: string
          id: string
          is_required: boolean
          person_id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_submit_form_response: {
        Args: { p_submission_id: string; p_values?: Json }
        Returns: undefined
      }
      mhd_submit_grievance: {
        Args: {
          p_company_id: string
          p_disagreement_explanation: string
          p_employee_signature_name: string
          p_grievance_what: string
          p_grievance_when?: string
          p_grievance_where?: string
          p_grievance_who?: string
          p_grievance_why?: string
          p_is_harassment_related?: boolean
          p_person_id: string
          p_remedy_requested: string
        }
        Returns: string
      }
      mhd_task_attachment_count: {
        Args: { p_task_id: string }
        Returns: number
      }
      mhd_training_assign: {
        Args: {
          p_company_id: string
          p_course_id: string
          p_due_date?: string
          p_person_id: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_training_cancel_assignment: {
        Args: { p_assignment_id: string }
        Returns: undefined
      }
      mhd_training_complete: {
        Args: {
          p_assignment_id: string
          p_attachment_id?: string
          p_completed_at?: string
          p_completion_method?: string
        }
        Returns: {
          expires_at: string
          id: string
          reference_id: string
        }[]
      }
      mhd_training_compliance: {
        Args: { p_course_id?: string; p_person_id: string }
        Returns: {
          category: string
          course_id: string
          course_title: string
          expires_at: string
          last_completed_at: string
          status: string
        }[]
      }
      mhd_training_compliance_matrix: {
        Args: { p_category?: string; p_company_id: string }
        Returns: {
          category: string
          course_id: string
          course_title: string
          expires_at: string
          person_display_name: string
          person_id: string
          status: string
        }[]
      }
      mhd_training_compliance_status: {
        Args: { p_course_id: string; p_person_id: string }
        Returns: string
      }
      mhd_training_course_create: {
        Args: {
          p_category?: string
          p_company_id: string
          p_course_key: string
          p_delivery_mode?: string
          p_description?: string
          p_duration_minutes?: number
          p_external_url?: string
          p_recurrence_months?: number
          p_requires_evidence?: boolean
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_training_course_list: {
        Args: { p_company_id: string; p_include_inactive?: boolean }
        Returns: {
          category: string
          company_id: string
          course_key: string
          delivery_mode: string
          description: string
          duration_minutes: number
          external_url: string
          id: string
          is_active: boolean
          is_global: boolean
          recurrence_months: number
          reference_id: string
          requires_evidence: boolean
          title: string
        }[]
      }
      mhd_training_course_set_active: {
        Args: { p_course_id: string; p_is_active: boolean }
        Returns: undefined
      }
      mhd_training_course_update: {
        Args: {
          p_category?: string
          p_course_id: string
          p_delivery_mode?: string
          p_description?: string
          p_duration_minutes?: number
          p_external_url?: string
          p_recurrence_months?: number
          p_requires_evidence?: boolean
          p_title?: string
        }
        Returns: undefined
      }
      mhd_training_is_privileged: { Args: never; Returns: boolean }
      mhd_training_list_assignments: {
        Args: { p_company_id: string; p_person_id?: string; p_status?: string }
        Returns: {
          assigned_by: string
          category: string
          compliance_status: string
          course_id: string
          course_title: string
          created_at: string
          due_date: string
          id: string
          person_display_name: string
          person_id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_training_list_completions: {
        Args: { p_course_id?: string; p_person_id: string }
        Returns: {
          attachment_id: string
          completed_at: string
          completion_method: string
          course_id: string
          course_title: string
          expires_at: string
          id: string
          is_expired: boolean
          reference_id: string
        }[]
      }
      mhd_training_record_admin_completion: {
        Args: {
          p_attachment_id?: string
          p_company_id: string
          p_completed_at: string
          p_course_id: string
          p_person_id: string
        }
        Returns: {
          expires_at: string
          id: string
          reference_id: string
        }[]
      }
      mhd_training_waive_assignment: {
        Args: { p_assignment_id: string; p_reason: string }
        Returns: undefined
      }
      mhd_transition_coaching_plan: {
        Args: {
          p_new_status: string
          p_outcome_summary?: string
          p_plan_id: string
        }
        Returns: {
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_transition_offboarding_case: {
        Args: {
          p_cancel_reason?: string
          p_case_id: string
          p_new_status: string
        }
        Returns: {
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_transition_performance_review: {
        Args: {
          p_new_status: string
          p_review_id: string
          p_waiver_reason?: string
        }
        Returns: {
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_unassign_user_from_entity: {
        Args: {
          p_actor_user_id?: string
          p_entity_id: string
          p_entity_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      mhd_update_activity: {
        Args: {
          p_activity_id: string
          p_activity_type?: string
          p_description_plain_text?: string
          p_description_rich_text?: Json
          p_duration_minutes?: number
          p_follow_up_task_id?: string
          p_is_confidential?: boolean
          p_location?: string
          p_occurred_at?: string
          p_outcome_summary?: string
          p_parent_task_id?: string
          p_person_id?: string
          p_scheduled_at?: string
          p_status?: string
          p_title?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_update_case_document: {
        Args: {
          p_case_document_id: string
          p_confidentiality_level?: string
          p_payload?: Json
          p_title?: string
        }
        Returns: {
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_update_coaching_plan: {
        Args: {
          p_coach_user_id?: string
          p_objective?: string
          p_outcome_summary?: string
          p_plan_id: string
          p_start_date?: string
          p_target_date?: string
          p_title?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_update_coaching_plan_item: {
        Args: {
          p_activity_id?: string
          p_description?: string
          p_due_date?: string
          p_item_id: string
          p_sort_order?: number
          p_status?: string
          p_title?: string
        }
        Returns: undefined
      }
      mhd_update_company: {
        Args: {
          p_company_id: string
          p_company_name: string
          p_employee_count?: number
          p_headquarters_location?: string
          p_industry?: string
        }
        Returns: {
          company_name: string
          created_at: string
          created_by: string
          employee_count: number
          headquarters_location: string
          id: string
          industry: string
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_update_contact_method: {
        Args: {
          p_contact_method_id: string
          p_contact_value?: string
          p_is_primary?: boolean
        }
        Returns: {
          contact_type: string
          contact_value: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          is_primary: boolean
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_update_correspondence_mailbox_alias: {
        Args: {
          p_alias_id: string
          p_is_active?: boolean
          p_is_primary?: boolean
        }
        Returns: {
          alias_address: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          mailbox_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "correspondence_mailbox_aliases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_update_document_template: {
        Args: {
          p_actor_user_id?: string
          p_applicable_entity_type?: string
          p_content: string
          p_content_format: string
          p_description?: string
          p_is_active?: boolean
          p_merge_fields?: Json
          p_name: string
          p_requires_signature?: boolean
          p_template_id: string
          p_template_type: string
        }
        Returns: {
          id: string
          reference_id: string
          version: number
        }[]
      }
      mhd_update_form: {
        Args: {
          p_definition?: Json
          p_description?: string
          p_employee_file_category?: string
          p_esignature_document_template_id?: string
          p_form_id: string
          p_name?: string
          p_requires_esignature?: boolean
          p_update_employee_file_category?: boolean
          p_update_esignature_document_template_id?: boolean
        }
        Returns: undefined
      }
      mhd_update_note: {
        Args: {
          p_note_id: string
          p_note_plain_text: string
          p_note_rich_text: Json
          p_visibility?: string
        }
        Returns: undefined
      }
      mhd_update_offboarding_case: {
        Args: {
          p_case_id: string
          p_eligible_for_rehire?: boolean
          p_exit_interview_activity_id?: string
          p_last_working_day?: string
          p_reason_summary?: string
          p_separation_date?: string
          p_separation_type?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_update_offboarding_item: {
        Args: {
          p_assigned_user_id?: string
          p_description?: string
          p_due_date?: string
          p_is_required?: boolean
          p_item_id: string
          p_linked_entity_id?: string
          p_linked_entity_type?: string
          p_reason?: string
          p_sort_order?: number
          p_status?: string
          p_title?: string
        }
        Returns: undefined
      }
      mhd_update_performance_review: {
        Args: {
          p_due_date?: string
          p_employee_comments?: string
          p_goals_summary?: string
          p_improvement_summary?: string
          p_overall_rating?: number
          p_review_activity_id?: string
          p_review_id: string
          p_review_period_end?: string
          p_review_period_start?: string
          p_review_type?: string
          p_reviewer_comments?: string
          p_reviewer_user_id?: string
          p_strengths_summary?: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_update_person: {
        Args: {
          p_actor_user_id?: string
          p_company_id: string
          p_email?: string
          p_first_name: string
          p_last_name: string
          p_manager_id?: string
          p_middle_name?: string
          p_mobile?: string
          p_person_id: string
          p_phone?: string
          p_preferred_name?: string
        }
        Returns: {
          company_id: string
          created_at: string
          created_by: string
          display_name: string
          first_name: string
          id: string
          last_name: string
          manager_display_name: string
          manager_id: string
          middle_name: string
          preferred_name: string
          primary_email: string
          primary_mobile: string
          primary_phone: string
          reference_id: string
          updated_at: string
          updated_by: string
        }[]
      }
      mhd_update_property_item: {
        Args: {
          p_condition_notes?: string
          p_description?: string
          p_item_id: string
          p_name?: string
          p_status?: string
        }
        Returns: undefined
      }
      mhd_update_quote: {
        Args: {
          p_author?: string
          p_is_active?: boolean
          p_quote_id: string
          p_quote_text: string
        }
        Returns: {
          author: string | null
          created_at: string
          id: string
          is_active: boolean
          quote_text: string
          source_citation: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "quotes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mhd_update_sub_activity: {
        Args: {
          p_description_plain_text?: string
          p_scheduled_at?: string
          p_sort_order?: number
          p_status?: string
          p_sub_activity_id: string
          p_title?: string
        }
        Returns: undefined
      }
      mhd_update_subtask: {
        Args: {
          p_actor_user_id?: string
          p_description_plain_text?: string
          p_description_rich_text?: Json
          p_due_date?: string
          p_manual_progress_percent?: number
          p_priority_id?: string
          p_sort_order?: number
          p_status_id?: string
          p_subtask_id: string
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_update_task: {
        Args: {
          p_actor_user_id?: string
          p_assigned_user_ids?: string[]
          p_company_id: string
          p_completed_date?: string
          p_description_plain_text?: string
          p_description_rich_text?: Json
          p_detailed_instructions_plain_text?: string
          p_detailed_instructions_rich_text?: Json
          p_due_date?: string
          p_manual_progress_percent?: number
          p_priority_id?: string
          p_start_date?: string
          p_status_id?: string
          p_task_id: string
          p_title: string
        }
        Returns: {
          id: string
          reference_id: string
        }[]
      }
      mhd_upsert_document_retention_schedule: {
        Args: {
          p_company_id: string
          p_entity_id: string
          p_entity_type: string
          p_retention_basis: string
          p_retention_expires_at: string
        }
        Returns: {
          id: string
          retention_expires_at: string
        }[]
      }
      mhd_upsert_onboarding_checklist_item: {
        Args: {
          p_actor_user_id: string
          p_company_id: string
          p_document_key: string
          p_document_record_id: string
          p_person_id: string
          p_status: string
        }
        Returns: {
          company_id: string
          completed_at: string
          document_key: string
          document_record_id: string
          due_date: string
          id: string
          is_required: boolean
          person_id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_user_has_role: { Args: { p_role_name: string }; Returns: boolean }
      mhd_verify_audit_certificate_by_code: {
        Args: { p_verification_code: string }
        Returns: {
          digitally_signed: boolean
          entity_type: string
          generated_at: string
          is_valid: boolean
          status: string
        }[]
      }
      mhd_void_signature_request: {
        Args: { p_actor_user_id?: string; p_request_id: string }
        Returns: {
          id: string
          reference_id: string
          status: string
        }[]
      }
      mhd_withdraw_esign_consent: {
        Args: { p_consent_id: string; p_reason: string }
        Returns: undefined
      }
      mhd_workflow_check_sla: { Args: { p_task_id: string }; Returns: Json }
      mhd_workflow_get_available_transitions: {
        Args: { p_task_id: string }
        Returns: {
          to_status_color: string
          to_status_id: string
          to_status_name: string
        }[]
      }
      mhd_workflow_get_transitions: {
        Args: { p_task_id: string }
        Returns: {
          created_at: string
          created_by_name: string
          from_status_color: string
          from_status_id: string
          from_status_name: string
          id: string
          reason: string
          task_id: string
          to_status_color: string
          to_status_id: string
          to_status_name: string
        }[]
      }
      mhd_workflow_list_overdue_tasks: {
        Args: { p_company_id: string }
        Returns: {
          days_overdue: number
          task_id: string
          title: string
        }[]
      }
      mhd_workflow_transition: {
        Args: {
          p_actor_user_id?: string
          p_reason?: string
          p_task_id: string
          p_to_status_id: string
        }
        Returns: Json
      }
      mhd_workflow_transition_allowed: {
        Args: {
          p_from_status_id: string
          p_task_id: string
          p_to_status_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      mhd_write_audit_event: {
        Args: {
          p_action_type: string
          p_company_id: string
          p_entity_id: string
          p_entity_type: string
          p_field_name?: string
          p_metadata?: Json
          p_new_value?: string
          p_old_value?: string
          p_source_module?: string
          p_summary?: string
        }
        Returns: string
      }
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

