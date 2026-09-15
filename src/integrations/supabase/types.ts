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
          mark: Database["public"]["Enums"]["attendance_mark"] | null
          recorded_by: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          day: string
          enrollment_id: string
          id?: string
          mark?: Database["public"]["Enums"]["attendance_mark"] | null
          recorded_by: string
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          day?: string
          enrollment_id?: string
          id?: string
          mark?: Database["public"]["Enums"]["attendance_mark"] | null
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
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          kind: Database["public"]["Enums"]["cash_movement_kind"]
          location_id: string
          method: Database["public"]["Enums"]["payment_method"]
          moved_on: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["cash_movement_kind"]
          location_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          moved_on?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["cash_movement_kind"]
          location_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          moved_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
      daily_meals: {
        Row: {
          day: string
          id: string
          location_id: string
          meals_children: number
          meals_staff: number
          note: string
          status: Database["public"]["Enums"]["meal_order_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          day: string
          id?: string
          location_id: string
          meals_children?: number
          meals_staff?: number
          note?: string
          status?: Database["public"]["Enums"]["meal_order_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          day?: string
          id?: string
          location_id?: string
          meals_children?: number
          meals_staff?: number
          note?: string
          status?: Database["public"]["Enums"]["meal_order_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_meals_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_meals_updated_by_fkey"
            columns: ["updated_by"]
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
      enrollment_signatures: {
        Row: {
          consent_text: string
          enrollment_id: string
          id: string
          signed_at: string
          signed_documents: string[]
          signer_name: string
          signer_role: Database["public"]["Enums"]["signer_role"]
          storage_path: string
          user_id: string
        }
        Insert: {
          consent_text: string
          enrollment_id: string
          id?: string
          signed_at?: string
          signed_documents?: string[]
          signer_name: string
          signer_role: Database["public"]["Enums"]["signer_role"]
          storage_path: string
          user_id: string
        }
        Update: {
          consent_text?: string
          enrollment_id?: string
          id?: string
          signed_at?: string
          signed_documents?: string[]
          signer_name?: string
          signer_role?: Database["public"]["Enums"]["signer_role"]
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_signatures_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_signatures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_week_codes: {
        Row: {
          enrollment_id: string
          frequency_code: string
          id: string
          updated_at: string
          week_code: string
        }
        Insert: {
          enrollment_id: string
          frequency_code: string
          id?: string
          updated_at?: string
          week_code: string
        }
        Update: {
          enrollment_id?: string
          frequency_code?: string
          id?: string
          updated_at?: string
          week_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_week_codes_enrollment_id_fkey"
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
          custom_answers: Json
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
          custom_answers?: Json
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
          custom_answers?: Json
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
            foreignKeyName: "enrollments_location_slug_fkey"
            columns: ["location_slug"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["slug"]
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
      extra_charges: {
        Row: {
          amount: number
          charge_type: Database["public"]["Enums"]["extra_charge_type"]
          created_at: string
          created_by: string | null
          description: string
          enrollment_id: string
          id: string
        }
        Insert: {
          amount: number
          charge_type?: Database["public"]["Enums"]["extra_charge_type"]
          created_at?: string
          created_by?: string | null
          description?: string
          enrollment_id: string
          id?: string
        }
        Update: {
          amount?: number
          charge_type?: Database["public"]["Enums"]["extra_charge_type"]
          created_at?: string
          created_by?: string | null
          description?: string
          enrollment_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_charges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_charges_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      location_custom_fields: {
        Row: {
          active: boolean
          code: string
          created_at: string
          field_type: Database["public"]["Enums"]["custom_field_type"]
          id: string
          label: string
          location_id: string
          options: string[]
          required: boolean
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          field_type: Database["public"]["Enums"]["custom_field_type"]
          id?: string
          label: string
          location_id: string
          options?: string[]
          required?: boolean
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["custom_field_type"]
          id?: string
          label?: string
          location_id?: string
          options?: string[]
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "location_custom_fields_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_documents: {
        Row: {
          category: Database["public"]["Enums"]["location_document_category"]
          created_at: string
          file_name: string
          id: string
          is_public: boolean
          location_id: string
          mime_type: string
          size_bytes: number
          sort_order: number
          storage_path: string
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["location_document_category"]
          created_at?: string
          file_name: string
          id?: string
          is_public?: boolean
          location_id: string
          mime_type: string
          size_bytes: number
          sort_order?: number
          storage_path: string
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["location_document_category"]
          created_at?: string
          file_name?: string
          id?: string
          is_public?: boolean
          location_id?: string
          mime_type?: string
          size_bytes?: number
          sort_order?: number
          storage_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_documents_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_extras: {
        Row: {
          code: string
          id: string
          label: string
          location_id: string
          price: number
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          label: string
          location_id: string
          price?: number
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          label?: string
          location_id?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "location_extras_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_frequency_codes: {
        Row: {
          active: boolean
          band: Database["public"]["Enums"]["frequency_band"]
          category: Database["public"]["Enums"]["frequency_category"]
          code: string
          convenzione: boolean
          created_at: string
          id: string
          label: string
          location_id: string
          price: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          band: Database["public"]["Enums"]["frequency_band"]
          category: Database["public"]["Enums"]["frequency_category"]
          code: string
          convenzione?: boolean
          created_at?: string
          id?: string
          label: string
          location_id: string
          price?: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          band?: Database["public"]["Enums"]["frequency_band"]
          category?: Database["public"]["Enums"]["frequency_category"]
          code?: string
          convenzione?: boolean
          created_at?: string
          id?: string
          label?: string
          location_id?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "location_frequency_codes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_weeks: {
        Row: {
          code: string
          end_date: string | null
          id: string
          label: string
          location_id: string
          number: number
          spots: number
          start_date: string | null
        }
        Insert: {
          code: string
          end_date?: string | null
          id?: string
          label: string
          location_id: string
          number: number
          spots?: number
          start_date?: string | null
        }
        Update: {
          code?: string
          end_date?: string | null
          id?: string
          label?: string
          location_id?: string
          number?: number
          spots?: number
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_weeks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          activities: string[]
          address: string
          admin_notes: string
          age_label: string
          age_max: number
          age_min: number
          archived_at: string | null
          badges: Json
          comune: string
          contact_email: string
          contact_manager: string
          contact_phone: string
          created_at: string
          day_plan: Json
          description: string
          faq: Json
          id: string
          included_services: string[]
          logo_path: string | null
          name: string
          pricing: Json
          required_documents: string[]
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["location_status"]
          tagline: string
          theme: string
          time_slots: string[]
          type: Database["public"]["Enums"]["location_type"]
          updated_at: string
        }
        Insert: {
          activities?: string[]
          address?: string
          admin_notes?: string
          age_label?: string
          age_max?: number
          age_min?: number
          archived_at?: string | null
          badges?: Json
          comune?: string
          contact_email?: string
          contact_manager?: string
          contact_phone?: string
          created_at?: string
          day_plan?: Json
          description?: string
          faq?: Json
          id?: string
          included_services?: string[]
          logo_path?: string | null
          name: string
          pricing?: Json
          required_documents?: string[]
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["location_status"]
          tagline?: string
          theme?: string
          time_slots?: string[]
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Update: {
          activities?: string[]
          address?: string
          admin_notes?: string
          age_label?: string
          age_max?: number
          age_min?: number
          archived_at?: string | null
          badges?: Json
          comune?: string
          contact_email?: string
          contact_manager?: string
          contact_phone?: string
          created_at?: string
          day_plan?: Json
          description?: string
          faq?: Json
          id?: string
          included_services?: string[]
          logo_path?: string | null
          name?: string
          pricing?: Json
          required_documents?: string[]
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["location_status"]
          tagline?: string
          theme?: string
          time_slots?: string[]
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          enrollment_id: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string
          paid_on: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          enrollment_id: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          note?: string
          paid_on?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          enrollment_id?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string
          paid_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
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
      staff_attendance: {
        Row: {
          created_at: string
          day: string
          id: string
          location_id: string
          mark: Database["public"]["Enums"]["attendance_mark"]
          note: string
          recorded_by: string | null
          staff_name: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          location_id: string
          mark: Database["public"]["Enums"]["attendance_mark"]
          note?: string
          recorded_by?: string | null
          staff_name: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          location_id?: string
          mark?: Database["public"]["Enums"]["attendance_mark"]
          note?: string
          recorded_by?: string | null
          staff_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      location_registry_totals: {
        Args: { _location_slug: string }
        Returns: {
          enrollment_id: string
          extra_total: number
          gita: number
          quota: number
          saldo: number
          tessera: number
          versato: number
          weeks_total: number
        }[]
      }
      location_week_occupancy: {
        Args: never
        Returns: {
          confirmed: number
          location_slug: string
          week_code: string
        }[]
      }
      log_enrollment_signature: {
        Args: { _signature_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "genitore" | "staff" | "admin"
      attendance_mark:
        | "intera"
        | "mattina"
        | "pomeriggio"
        | "presente"
        | "assente"
      cash_movement_kind: "spesa" | "consegna" | "altro"
      child_sex: "M" | "F"
      custom_field_type: "testo" | "si_no" | "scelta" | "data"
      document_status: "caricato" | "verificato" | "rifiutato"
      enrollment_status:
        | "nuova"
        | "revisione"
        | "documenti-mancanti"
        | "attesa-pagamento"
        | "confermata"
        | "lista-attesa"
        | "annullata"
      extra_charge_type: "gita" | "altro"
      frequency_band: "mezza" | "intera"
      frequency_category: "primaria" | "asilo"
      location_document_category:
        | "regolamento"
        | "modulo"
        | "informativa"
        | "template_overlay"
      location_status: "bozza" | "pubblicata"
      location_type:
        | "centro_estivo"
        | "doposcuola"
        | "corso"
        | "progetto_scuola"
      meal_order_status: "da_ordinare" | "ordinato" | "confermato"
      payment_method: "bonifico" | "contanti"
      signer_role: "genitore_1" | "genitore_2"
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
      app_role: ["genitore", "staff", "admin"],
      attendance_mark: [
        "intera",
        "mattina",
        "pomeriggio",
        "presente",
        "assente",
      ],
      cash_movement_kind: ["spesa", "consegna", "altro"],
      child_sex: ["M", "F"],
      custom_field_type: ["testo", "si_no", "scelta", "data"],
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
      extra_charge_type: ["gita", "altro"],
      frequency_band: ["mezza", "intera"],
      frequency_category: ["primaria", "asilo"],
      location_document_category: [
        "regolamento",
        "modulo",
        "informativa",
        "template_overlay",
      ],
      location_status: ["bozza", "pubblicata"],
      location_type: [
        "centro_estivo",
        "doposcuola",
        "corso",
        "progetto_scuola",
      ],
      meal_order_status: ["da_ordinare", "ordinato", "confermato"],
      payment_method: ["bonifico", "contanti"],
      signer_role: ["genitore_1", "genitore_2"],
      tessera_tipo: ["base", "super_integrativa"],
    },
  },
} as const
