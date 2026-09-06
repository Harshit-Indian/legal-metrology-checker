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
      evidence_photos: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          position: number
          scan_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          position?: number
          scan_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          position?: number
          scan_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_photos_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_fields: {
        Row: {
          confidence: number | null
          created_at: string
          field_key: string
          field_label: string | null
          field_value: string | null
          id: string
          scan_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          field_key: string
          field_label?: string | null
          field_value?: string | null
          id?: string
          scan_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          field_key?: string
          field_label?: string | null
          field_value?: string | null
          id?: string
          scan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_fields_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          id: string
          manufacturer_name: string | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          id?: string
          manufacturer_name?: string | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          id?: string
          manufacturer_name?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          organization?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          generated_by: string
          id: string
          payload: Json
          scan_id: string
          summary: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          generated_by: string
          id?: string
          payload?: Json
          scan_id: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          generated_by?: string
          id?: string
          payload?: Json
          scan_id?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          compliance_status: Database["public"]["Enums"]["compliance_status"]
          created_at: string
          id: string
          manufacturer_name: string | null
          notes: string | null
          product_id: string | null
          product_name: string | null
          scanned_at: string
          status: string
          user_id: string
        }
        Insert: {
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          created_at?: string
          id?: string
          manufacturer_name?: string | null
          notes?: string | null
          product_id?: string | null
          product_name?: string | null
          scanned_at?: string
          status?: string
          user_id: string
        }
        Update: {
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          created_at?: string
          id?: string
          manufacturer_name?: string | null
          notes?: string | null
          product_id?: string | null
          product_name?: string | null
          scanned_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      violations: {
        Row: {
          created_at: string
          description: string | null
          field_key: string | null
          id: string
          rule_reference: string
          scan_id: string
          severity: Database["public"]["Enums"]["violation_severity"]
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          field_key?: string | null
          id?: string
          rule_reference: string
          scan_id: string
          severity?: Database["public"]["Enums"]["violation_severity"]
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          field_key?: string | null
          id?: string
          rule_reference?: string
          scan_id?: string
          severity?: Database["public"]["Enums"]["violation_severity"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "violations_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_scan: { Args: { _scan_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_scan: { Args: { _scan_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "inspector" | "manufacturer" | "admin"
      compliance_status: "compliant" | "non_compliant" | "exempt" | "pending"
      violation_severity: "critical" | "minor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["inspector", "manufacturer", "admin"],
      compliance_status: ["compliant", "non_compliant", "exempt", "pending"],
      violation_severity: ["critical", "minor"],
    },
  },
} as const
