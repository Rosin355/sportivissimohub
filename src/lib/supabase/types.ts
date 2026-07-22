// Tipi del database Supabase, speculari alle migrazioni in supabase/migrations.
// Mantenerli allineati quando si modifica lo schema.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "genitore" | "staff" | "admin";

export type EnrollmentStatus =
  | "nuova"
  | "revisione"
  | "documenti-mancanti"
  | "attesa-pagamento"
  | "confermata"
  | "lista-attesa"
  | "annullata";

export type DocumentStatus = "caricato" | "verificato" | "rifiutato";

export type PaymentStatus = "non-pagato" | "acconto" | "pagato";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string;
          fiscal_code: string;
          address: string | null;
          city: string | null;
          province: string | null;
          zip: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          fiscal_code?: string;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          zip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          fiscal_code?: string;
          address?: string | null;
          city?: string | null;
          province?: string | null;
          zip?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: AppRole;
        };
        Insert: {
          user_id: string;
          role: AppRole;
        };
        Update: {
          user_id?: string;
          role?: AppRole;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          first_name: string;
          last_name: string;
          birth_date: string;
          fiscal_code: string;
          school: string;
          grade: string;
          allergies: string;
          medical_notes: string;
          special_needs: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          first_name: string;
          last_name: string;
          birth_date: string;
          fiscal_code: string;
          school?: string;
          grade?: string;
          allergies?: string;
          medical_notes?: string;
          special_needs?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          first_name?: string;
          last_name?: string;
          birth_date?: string;
          fiscal_code?: string;
          school?: string;
          grade?: string;
          allergies?: string;
          medical_notes?: string;
          special_needs?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          id: string;
          code: string;
          parent_id: string;
          child_id: string;
          status: EnrollmentStatus;
          location_slug: string;
          week_ids: string[];
          time_slot: string;
          extras: string[];
          consent_privacy: boolean;
          consent_photos: boolean;
          consent_outings: boolean;
          consent_rules: boolean;
          consent_data_processing: boolean;
          payment_status: string;
          admin_notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: string;
          parent_id: string;
          child_id: string;
          status?: EnrollmentStatus;
          location_slug: string;
          week_ids: string[];
          time_slot: string;
          extras?: string[];
          consent_privacy?: boolean;
          consent_photos?: boolean;
          consent_outings?: boolean;
          consent_rules?: boolean;
          consent_data_processing?: boolean;
          payment_status?: string;
          admin_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          parent_id?: string;
          child_id?: string;
          status?: EnrollmentStatus;
          location_slug?: string;
          week_ids?: string[];
          time_slot?: string;
          extras?: string[];
          consent_privacy?: boolean;
          consent_photos?: boolean;
          consent_outings?: boolean;
          consent_rules?: boolean;
          consent_data_processing?: boolean;
          payment_status?: string;
          admin_notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pickup_delegates: {
        Row: {
          id: string;
          enrollment_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          document: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          first_name: string;
          last_name: string;
          phone: string;
          document?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string;
          document?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pickup_delegates_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollment_documents: {
        Row: {
          id: string;
          enrollment_id: string;
          doc_type: string;
          storage_path: string;
          file_name: string;
          size_bytes: number;
          status: DocumentStatus;
          rejection_reason: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          doc_type: string;
          storage_path: string;
          file_name: string;
          size_bytes: number;
          status?: DocumentStatus;
          rejection_reason?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          doc_type?: string;
          storage_path?: string;
          file_name?: string;
          size_bytes?: number;
          status?: DocumentStatus;
          rejection_reason?: string | null;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollment_documents_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string;
          action: string;
          entity: string;
          entity_id: string;
          detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id: string;
          action: string;
          entity: string;
          entity_id: string;
          detail?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          actor_id?: string;
          action?: string;
          entity?: string;
          entity_id?: string;
          detail?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          enrollment_id: string;
          day: string;
          checked_in_at: string | null;
          checked_out_at: string | null;
          recorded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          day: string;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          recorded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          enrollment_id?: string;
          day?: string;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          recorded_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: AppRole };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRole;
      enrollment_status: EnrollmentStatus;
      document_status: DocumentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
