import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getLocationBySlug } from "@/data/locations";
import type {
  DocumentStatus,
  EnrollmentStatus as DbEnrollmentStatus,
  PaymentStatus,
} from "@/lib/supabase/types";

export type EnrollmentStatus = DbEnrollmentStatus;

export type GuardianData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fiscalCode: string;
  address: string;
  city: string;
  province: string;
  zip: string;
};

export type ChildData = {
  firstName: string;
  lastName: string;
  birthDate: string;
  fiscalCode: string;
  age: number;
  school: string;
  grade: string;
  allergies: string;
  medicalNotes: string;
  specialNeeds: string;
};

export type SessionData = {
  locationSlug: string;
  locationName: string;
  weekIds: string[];
  weekLabels: string[];
  timeSlot: string;
  extras: string[];
};

export type PickupDelegate = {
  firstName: string;
  lastName: string;
  phone: string;
  document: string;
};

export type ConsentsData = {
  privacy: boolean;
  photos: boolean;
  outings: boolean;
  rules: boolean;
  dataProcessing: boolean;
};

export type DocumentMeta = {
  id?: string;
  type: string;
  fileName: string;
  size: number;
  status?: DocumentStatus;
  rejectionReason?: string | null;
  storagePath?: string;
};

export type Enrollment = {
  id: string; // uuid della riga in enrollments
  code: string; // codice leggibile, es. ENR-2026-0042
  createdAt: string;
  status: EnrollmentStatus;
  paymentStatus: PaymentStatus;
  guardian: GuardianData;
  child: ChildData;
  session: SessionData;
  delegates: PickupDelegate[];
  consents: ConsentsData;
  documents: DocumentMeta[];
  adminNotes?: string;
};

/* ---------- query Supabase ---------- */

const ENROLLMENT_SELECT = `
  id, code, status, location_slug, week_ids, time_slot, extras,
  consent_privacy, consent_photos, consent_outings, consent_rules, consent_data_processing,
  payment_status, admin_notes, created_at, parent_id,
  profiles ( email, first_name, last_name, phone, fiscal_code, address, city, province, zip ),
  children ( first_name, last_name, birth_date, fiscal_code, school, grade, allergies, medical_notes, special_needs ),
  pickup_delegates ( id, first_name, last_name, phone, document ),
  enrollment_documents ( id, doc_type, file_name, size_bytes, status, rejection_reason, storage_path )
`;

type JoinedRow = {
  id: string;
  code: string;
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
  payment_status: PaymentStatus;
  admin_notes: string;
  created_at: string;
  parent_id: string;
  profiles: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    fiscal_code: string;
    address: string | null;
    city: string | null;
    province: string | null;
    zip: string | null;
  } | null;
  children: {
    first_name: string;
    last_name: string;
    birth_date: string;
    fiscal_code: string;
    school: string;
    grade: string;
    allergies: string;
    medical_notes: string;
    special_needs: string;
  } | null;
  pickup_delegates: Array<{
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    document: string;
  }>;
  enrollment_documents: Array<{
    id: string;
    doc_type: string;
    file_name: string;
    size_bytes: number;
    status: DocumentStatus;
    rejection_reason: string | null;
    storage_path: string;
  }>;
};

function calcAge(birthDate: string): number {
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000)));
}

function mapRow(row: JoinedRow): Enrollment {
  const loc = getLocationBySlug(row.location_slug);
  const weekLabels = row.week_ids
    .map((id) => loc?.weeks.find((w) => w.id === id)?.label)
    .filter((l): l is string => Boolean(l));
  return {
    id: row.id,
    code: row.code,
    createdAt: row.created_at,
    status: row.status,
    paymentStatus: row.payment_status,
    guardian: {
      firstName: row.profiles?.first_name ?? "",
      lastName: row.profiles?.last_name ?? "",
      email: row.profiles?.email ?? "",
      phone: row.profiles?.phone ?? "",
      fiscalCode: row.profiles?.fiscal_code ?? "",
      address: row.profiles?.address ?? "",
      city: row.profiles?.city ?? "",
      province: row.profiles?.province ?? "",
      zip: row.profiles?.zip ?? "",
    },
    child: {
      firstName: row.children?.first_name ?? "",
      lastName: row.children?.last_name ?? "",
      birthDate: row.children?.birth_date ?? "",
      fiscalCode: row.children?.fiscal_code ?? "",
      age: row.children ? calcAge(row.children.birth_date) : 0,
      school: row.children?.school ?? "",
      grade: row.children?.grade ?? "",
      allergies: row.children?.allergies ?? "",
      medicalNotes: row.children?.medical_notes ?? "",
      specialNeeds: row.children?.special_needs ?? "",
    },
    session: {
      locationSlug: row.location_slug,
      locationName: loc?.name ?? row.location_slug,
      weekIds: row.week_ids,
      weekLabels,
      timeSlot: row.time_slot,
      extras: row.extras,
    },
    delegates: row.pickup_delegates.map((d) => ({
      firstName: d.first_name,
      lastName: d.last_name,
      phone: d.phone,
      document: d.document,
    })),
    consents: {
      privacy: row.consent_privacy,
      photos: row.consent_photos,
      outings: row.consent_outings,
      rules: row.consent_rules,
      dataProcessing: row.consent_data_processing,
    },
    documents: row.enrollment_documents.map((d) => ({
      id: d.id,
      type: d.doc_type,
      fileName: d.file_name,
      size: d.size_bytes,
      status: d.status,
      rejectionReason: d.rejection_reason,
      storagePath: d.storage_path,
    })),
    adminNotes: row.admin_notes || undefined,
  };
}

// Le RLS delimitano già il perimetro: il genitore vede solo le proprie
// iscrizioni, admin e staff tutte.
export async function getEnrollments(): Promise<Enrollment[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(ENROLLMENT_SELECT)
    .order("created_at", { ascending: false })
    .returns<JoinedRow[]>();
  if (error) throw new Error("Impossibile caricare le iscrizioni.");
  return (data ?? []).map(mapRow);
}

export async function getEnrollment(id: string): Promise<Enrollment | undefined> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(ENROLLMENT_SELECT)
    .eq("id", id)
    .maybeSingle<JoinedRow>();
  if (error) throw new Error("Impossibile caricare l'iscrizione.");
  return data ? mapRow(data) : undefined;
}

// Solo admin (le RLS bloccano gli altri). Scrive anche nell'audit log.
export async function updateEnrollmentStatus(
  id: string,
  status: EnrollmentStatus,
  adminNotes?: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: { status: EnrollmentStatus; admin_notes?: string } = { status };
  if (adminNotes !== undefined) patch.admin_notes = adminNotes;
  const { error } = await supabase.from("enrollments").update(patch).eq("id", id);
  if (error) throw new Error("Aggiornamento non riuscito: verifica i permessi.");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "update_status",
      entity: "enrollment",
      entity_id: id,
      detail: { status, admin_notes: adminNotes ?? null },
    });
  }
}

/* ---------- draft (per-slug, resta in localStorage) ---------- */

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function draftKey(slug: string) {
  return `sportivissimo:draft:${slug}`;
}

export function readDraft<T>(slug: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(draftKey(slug));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeDraft<T>(slug: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(draftKey(slug), JSON.stringify(value));
}

export function clearDraft(slug: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(draftKey(slug));
}
