// Generated types for Supabase database schema
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
      auth_audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          success: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          success?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      college_domains: {
        Row: {
          id: string
          domain: string | null
          college_name: string
          country: string
          verification_type: Database["public"]["Enums"]["domain_verification_type"]
          provides_email: boolean
          is_active: boolean
          manual_review_required: boolean
          created_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          domain?: string | null
          college_name: string
          country?: string
          verification_type?: Database["public"]["Enums"]["domain_verification_type"]
          provides_email?: boolean
          is_active?: boolean
          manual_review_required?: boolean
          created_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          domain?: string | null
          college_name?: string
          country?: string
          verification_type?: Database["public"]["Enums"]["domain_verification_type"]
          provides_email?: boolean
          is_active?: boolean
          manual_review_required?: boolean
          created_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "college_domains_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      college_student_database: {
        Row: {
          id: string
          college_id: string
          student_name: string
          branch: string
          year: number
          roll_number: string | null
          verification_password: string
          is_active: boolean
          created_at: string
          expires_at: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          id?: string
          college_id: string
          student_name: string
          branch: string
          year: number
          roll_number?: string | null
          verification_password: string
          is_active?: boolean
          created_at?: string
          expires_at?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          id?: string
          college_id?: string
          student_name?: string
          branch?: string
          year?: number
          roll_number?: string | null
          verification_password?: string
          is_active?: boolean
          created_at?: string
          expires_at?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "college_student_database_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      email_verifications: {
        Row: {
          id: string
          email: string
          code: string
          attempts: number
          max_attempts: number
          created_at: string
          expires_at: string
          verified_at: string | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          email: string
          code: string
          attempts?: number
          max_attempts?: number
          created_at?: string
          expires_at?: string
          verified_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          email?: string
          code?: string
          attempts?: number
          max_attempts?: number
          created_at?: string
          expires_at?: string
          verified_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string
          bio: string | null
          avatar_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          college_id: string | null
          graduation_year: number | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verification_method: Database["public"]["Enums"]["verification_method"]
          college_database_id: string | null
          skills: Json
          created_at: string
          updated_at: string
          last_login: string | null
          login_count: number
        }
        Insert: {
          id: string
          email?: string | null
          name: string
          bio?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          college_id?: string | null
          graduation_year?: number | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verification_method?: Database["public"]["Enums"]["verification_method"]
          college_database_id?: string | null
          skills?: Json
          created_at?: string
          updated_at?: string
          last_login?: string | null
          login_count?: number
        }
        Update: {
          id?: string
          email?: string | null
          name?: string
          bio?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          college_id?: string | null
          graduation_year?: number | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verification_method?: Database["public"]["Enums"]["verification_method"]
          college_database_id?: string | null
          skills?: Json
          created_at?: string
          updated_at?: string
          last_login?: string | null
          login_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_college_database_id_fkey"
            columns: ["college_database_id"]
            isOneToOne: false
            referencedRelation: "college_student_database"
            referencedColumns: ["id"]
          }
        ]
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          refresh_token_hash: string
          device_info: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          expires_at: string
          last_used: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          refresh_token_hash: string
          device_info?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          expires_at?: string
          last_used?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          refresh_token_hash?: string
          device_info?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          expires_at?: string
          last_used?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_email_verifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_user_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_auth_audit_log: {
        Args: {
          p_user_id: string
          p_action: string
          p_details?: Json
          p_success?: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      domain_verification_type: "automatic" | "manual" | "suspended" | "database_only"
      user_role: "student" | "aspirant" | "guild_admin" | "platform_admin"
      verification_method: "email" | "college_database" | "manual"
      verification_status: "pending" | "verified" | "rejected" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never