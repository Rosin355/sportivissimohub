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
      attendance: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          day: string
          enrollment_id: string
          id: string
          recorded_by: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          day: string
          enrollment_id: string
          id?: string
          recorded_by: string
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          day?: string
          enrollment_id?: string
          id?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          detail: Json | null
          entity: string
          entity_id: string
          id: number
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          detail?: Json | null
          entity: string
          entity_id: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string
          id?: never
        }
        Relationships: []
      }
      children: {
        Row: {
          allergies: string
          birth_date: string
          cittadinanza: string | null
          comune_nascita: string | null
          created_at: string
          first_name: string
          fiscal_code: string | null
          grade: string
          has_italian_cf: boolean
          id: string
          last_name: string
          medical_notes: string
          nazione_nascita: string | null
          nazione_residenza: string | null
          numero_documento: string | null
          parent_id: string
          provincia_nascita: string | null
          school: string
          sesso: Database["public"]["Enums"]["child_sex"] | null
          special_needs: string
          tipo_documento: string | null
        }
        Insert: {
          allergies?: string
          birth_date: string
          cittadinanza?: string | null
          comune_nascita?: string | null
          created_at?: string
          first_name: string
          fiscal_code?: string | null
          grade?: string
          has_italian_cf?: boolean
          id?: string
          last_name: string
          medical_notes?: string
          nazione_nascita?: string | null
          nazione_residenza?: string | null
          numero_documento?: string | null
          parent_id: string
          provincia_nascita?: string | null
          school?: string
          sesso?: Database["public"]["Enums"]["child_sex"] | null
          special_needs?: string
          tipo_documento?: string | null
        }
        Update: {
          allergies?: string
          birth_date?: string
          cittadinanza?: string | null
          comune_nascita?: string | null
          created_at?: string
          first_name?: string
          fiscal_code?: string | null
          grade?: string
          has_italian_cf?: boolean
          id?: string
          last_name?: string
          medical_notes?: string
          nazione_nascita?: string | null
          nazione_residenza?: string | null
          numero_documento?: string | null
          parent_id?: string
          provincia_nascita?: string | null
          school?: string
          sesso?: Database["public"]["Enums"]["child_sex"] | null
          special_needs?: string
          tipo_documento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_documents: {
        Row: {
          doc_type: string
          enrollment_id: string
          file_name: string
          id: string
          rejection_reason: string | null
          size_bytes: number
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          doc_type: string
          enrollment_id: string
          file_name: string
          id?: string
          rejection_reason?: string | null
          size_bytes: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          doc_type?: string
          enrollment_id?: string
          file_name?: string
          id?: string
          rejection_reason?: string | null
          size_bytes?: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_documents_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          admin_notes: string
          child_id: string
          code: string
          consent_acsi_dati_24: boolean
          consent_acsi_dati_25: boolean
          consent_acsi_foto_marketing: boolean
          consent_data_processing: boolean
          consent_outings: boolean
          consent_photos: boolean
          consent_privacy: boolean
          consent_rules: boolean
          created_at: string
          extras: string[]
          figlio_ordine: number
          id: string
          location_slug: string
          parent_id: string
          payment_status: string
          residente_nel_comune: boolean
          secondary_guardian: Json | null
          status: Database["public"]["Enums"]["enrollment_status"]
          tessera_tipo: Database["public"]["Enums"]["tessera_tipo"]
          time_slot: string
          updated_at: string
          week_ids: string[]
        }
        Insert: {
          admin_notes?: string
          child_id: string
          code?: string
          consent_acsi_dati_24?: boolean
          consent_acsi_dati_25?: boolean
          consent_acsi_foto_marketing?: boolean
          consent_data_processing?: boolean
          consent_outings?: boolean
          consent_photos?: boolean
          consent_privacy?: boolean
          consent_rules?: boolean
          created_at?: string
          extras?: string[]
          figlio_ordine?: number
          id?: string
          location_slug: string
          parent_id: string
          payment_status?: string
          residente_nel_comune?: boolean
          secondary_guardian?: Json | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          tessera_tipo?: Database["public"]["Enums"]["tessera_tipo"]
          time_slot: string
          updated_at?: string
          week_ids: string[]
        }
        Update: {
          admin_notes?: string
          child_id?: string
          code?: string
          consent_acsi_dati_24?: boolean
          consent_acsi_dati_25?: boolean
          consent_acsi_foto_marketing?: boolean
          consent_data_processing?: boolean
          consent_outings?: boolean
          consent_photos?: boolean
          consent_privacy?: boolean
          consent_rules?: boolean
          created_at?: string
          extras?: string[]
          figlio_ordine?: number
          id?: string
          location_slug?: string
          parent_id?: string
          payment_status?: string
          residente_nel_comune?: boolean
          secondary_guardian?: Json | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          tessera_tipo?: Database["public"]["Enums"]["tessera_tipo"]
          time_slot?: string
          updated_at?: string
          week_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_delegates: {
        Row: {
          document: string
          enrollment_id: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }
        Insert: {
          document?: string
          enrollment_id: string
          first_name: string
          id?: string
          last_name: string
          phone: string
        }
        Update: {
          document?: string
          enrollment_id?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_delegates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string
          fiscal_code: string
          id: string
          last_name: string
          phone: string
          province: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string
          fiscal_code?: string
          id: string
          last_name?: string
          phone?: string
          province?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string
          fiscal_code?: string
          id?: string
          last_name?: string
          phone?: string
          province?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "genitore" | "staff" | "admin"
      child_sex: "M" | "F"
      document_status: "caricato" | "verificato" | "rifiutato"
      enrollment_status:
        | "nuova"
        | "revisione"
        | "documenti-mancanti"
        | "attesa-pagamento"
        | "confermata"
        | "lista-attesa"
        | "annullata"
      tessera_tipo: "base" | "super_integrativa"
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
      app_role: ["genitore", "staff", "admin"],
      child_sex: ["M", "F"],
      document_status: ["caricato", "verificato", "rifiutato"],
      enrollment_status: [
        "nuova",
        "revisione",
        "documenti-mancanti",
        "attesa-pagamento",
        "confermata",
        "lista-attesa",
        "annullata",
      ],
      tessera_tipo: ["base", "super_integrativa"],
    },
  },
} as const
