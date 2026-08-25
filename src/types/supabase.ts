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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      appointment_schedules: {
        Row: {
          created_at: string
          current_bookings: number
          day_of_week: number
          end_time: string
          id: string
          max_capacity: number
          start_time: string
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_bookings?: number
          day_of_week: number
          end_time: string
          id?: string
          max_capacity?: number
          start_time: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_bookings?: number
          day_of_week?: number
          end_time?: string
          id?: string
          max_capacity?: number
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
        }
        Relationships: []
      }
      appointment_status_history: {
        Row: {
          appointment_id: string
          changed_by_id: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["appointment_status"]
          notes: string | null
          previous_status:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          reason: string | null
        }
        Insert: {
          appointment_id: string
          changed_by_id?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["appointment_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          reason?: string | null
        }
        Update: {
          appointment_id?: string
          changed_by_id?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["appointment_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_status_history_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          assigned_veterinarian_id: string | null
          cancellation_reason:
            | Database["public"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          mode: Database["public"]["Enums"]["appointment_mode"]
          no_show_at: string | null
          notes: string | null
          owner_id: string
          pet_id: string
          preferred_date: string | null
          preferred_time: string | null
          reason: string | null
          requested_at: string
          rescheduled_from: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          assigned_veterinarian_id?: string | null
          cancellation_reason?:
            | Database["public"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["appointment_mode"]
          no_show_at?: string | null
          notes?: string | null
          owner_id: string
          pet_id: string
          preferred_date?: string | null
          preferred_time?: string | null
          reason?: string | null
          requested_at?: string
          rescheduled_from?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          assigned_veterinarian_id?: string | null
          cancellation_reason?:
            | Database["public"]["Enums"]["cancellation_reason"]
            | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          mode?: Database["public"]["Enums"]["appointment_mode"]
          no_show_at?: string | null
          notes?: string | null
          owner_id?: string
          pet_id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          reason?: string | null
          requested_at?: string
          rescheduled_from?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_veterinarian_id_fkey"
            columns: ["assigned_veterinarian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          appointment_id: string | null
          arrival_time: string
          created_at: string
          id: string
          notes: string | null
          owner_id: string | null
          pet_id: string | null
          service_end: string | null
          service_start: string | null
          status: Database["public"]["Enums"]["check_in_status"]
          updated_at: string
          walk_in: boolean
        }
        Insert: {
          appointment_id?: string | null
          arrival_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          pet_id?: string | null
          service_end?: string | null
          service_start?: string | null
          status?: Database["public"]["Enums"]["check_in_status"]
          updated_at?: string
          walk_in?: boolean
        }
        Update: {
          appointment_id?: string | null
          arrival_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          owner_id?: string | null
          pet_id?: string | null
          service_end?: string | null
          service_start?: string | null
          status?: Database["public"]["Enums"]["check_in_status"]
          updated_at?: string
          walk_in?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json
          title?: string
          type?: string
        }
        Relationships: []
      }
      pet_owners: {
        Row: {
          can_receive_notifications: boolean
          can_view_medical_records: boolean
          created_at: string
          id: string
          is_primary_contact: boolean
          owner_profile_id: string
          pet_id: string
          relationship: Database["public"]["Enums"]["owner_relationship"]
          updated_at: string
        }
        Insert: {
          can_receive_notifications?: boolean
          can_view_medical_records?: boolean
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          owner_profile_id: string
          pet_id: string
          relationship?: Database["public"]["Enums"]["owner_relationship"]
          updated_at?: string
        }
        Update: {
          can_receive_notifications?: boolean
          can_view_medical_records?: boolean
          created_at?: string
          id?: string
          is_primary_contact?: boolean
          owner_profile_id?: string
          pet_id?: string
          relationship?: Database["public"]["Enums"]["owner_relationship"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_owners_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_owners_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: number | null
          breed: string | null
          color: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          name: string
          notes: string | null
          sex: Database["public"]["Enums"]["pet_sex"]
          species: Database["public"]["Enums"]["pet_species"]
          species_detail: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          breed?: string | null
          color?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          name: string
          notes?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"]
          species: Database["public"]["Enums"]["pet_species"]
          species_detail?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          breed?: string | null
          color?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          name?: string
          notes?: string | null
          sex?: Database["public"]["Enums"]["pet_sex"]
          species?: Database["public"]["Enums"]["pet_species"]
          species_detail?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          name: string
          price_from: number | null
          price_label: string | null
          price_to: number | null
          short_desc: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          name: string
          price_from?: number | null
          price_label?: string | null
          price_to?: number | null
          short_desc?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          name?: string
          price_from?: number | null
          price_label?: string | null
          price_to?: number | null
          short_desc?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          next_values: Json | null
          previous_values: Json | null
          target_profile_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          next_values?: Json | null
          previous_values?: Json | null
          target_profile_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          next_values?: Json | null
          previous_values?: Json | null
          target_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_audit_logs_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_double_booking: {
        Args: {
          p_end: string
          p_exclude_appointment_id?: string
          p_start: string
          p_veterinarian_id: string
        }
        Returns: boolean
      }
      create_owned_pet: {
        Args: {
          p_age?: number
          p_breed?: string
          p_color?: string
          p_date_of_birth?: string
          p_name: string
          p_notes?: string
          p_sex?: Database["public"]["Enums"]["pet_sex"]
          p_species: Database["public"]["Enums"]["pet_species"]
          p_species_detail?: string
        }
        Returns: {
          age: number | null
          breed: string | null
          color: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          name: string
          notes: string | null
          sex: Database["public"]["Enums"]["pet_sex"]
          species: Database["public"]["Enums"]["pet_species"]
          species_detail: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      appointment_mode: "in_person" | "virtual"
      appointment_status:
        | "requested"
        | "scheduled"
        | "completed"
        | "cancelled"
        | "no_show"
      cancellation_reason:
        | "owner_request"
        | "clinic_emergency"
        | "weather"
        | "no_veterinarian_available"
        | "pet_health_issue"
        | "other"
      check_in_status: "checked_in" | "in_progress" | "completed"
      owner_relationship: "owner" | "co_owner" | "family" | "caretaker"
      pet_sex: "male" | "female" | "unknown"
      pet_species: "dog" | "cat" | "bird" | "rabbit" | "reptile" | "other"
      reschedule_reason:
        | "owner_request"
        | "veterinarian_unavailable"
        | "clinic_schedule_conflict"
        | "equipment_issue"
        | "pet_health_issue"
        | "other"
      schedule_status: "active" | "inactive"
      user_role: "admin" | "veterinarian" | "owner"
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
      appointment_mode: ["in_person", "virtual"],
      appointment_status: [
        "requested",
        "scheduled",
        "completed",
        "cancelled",
        "no_show",
      ],
      cancellation_reason: [
        "owner_request",
        "clinic_emergency",
        "weather",
        "no_veterinarian_available",
        "pet_health_issue",
        "other",
      ],
      check_in_status: ["checked_in", "in_progress", "completed"],
      owner_relationship: ["owner", "co_owner", "family", "caretaker"],
      pet_sex: ["male", "female", "unknown"],
      pet_species: ["dog", "cat", "bird", "rabbit", "reptile", "other"],
      reschedule_reason: [
        "owner_request",
        "veterinarian_unavailable",
        "clinic_schedule_conflict",
        "equipment_issue",
        "pet_health_issue",
        "other",
      ],
      schedule_status: ["active", "inactive"],
      user_role: ["admin", "veterinarian", "owner"],
    },
  },
} as const
