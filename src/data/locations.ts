import type { LocationDocumentCategory, LocationStatus, LocationType } from "@/lib/supabase/types";
import type { LocationInput } from "@/lib/locations/validation";
import { normalizeDocType } from "@/lib/enrollments/doc-types";

// Modello delle sedi (M10.1: vivono nella tabella `locations` + figlie
// `location_weeks` e `location_extras`). Qui stanno i tipi usati da pagine,
// wizard, PDF e admin, e il mapping riga DB -> Location. Le query sono in
// src/lib/locations/queries.ts, le server function in server-fns.ts.

export type Theme = "sun" | "grass" | "magic" | "flame" | "royal";

export type ActivityBadge = { label: string; color: Theme };

export type CampWeek = {
  id: string; // codice stabile usato in enrollments.week_ids (es. "w1")
  number: number;
  label: string; // "24 - 28 giugno"
  startDate: string | null; // ISO yyyy-mm-dd
  endDate: string | null;
  spots: number; // capienza
  confirmed: number; // iscrizioni confermate (calcolato, mai memorizzato)
};

export type DayBlock = {
  time: string;
  title: string;
  description: string;
  icon: "sun" | "ball" | "lunch" | "art" | "team" | "hug";
  color: Theme;
};

export type LocationFaq = { q: string; a: string };

// Tariffe per settimana e quote tessera (struttura del regolamento 2026).
export type LocationPricing = {
  residentFullDay: number;
  residentHalfDay: number;
  nonResidentFullDay: number;
  nonResidentHalfDay: number;
  siblingDiscountFullDay: number; // sconto per settimana dal 2° figlio
  siblingDiscountHalfDay: number;
  membershipBase: number; // tessera ACSI base
  membershipSuperIntegrativa: number; // supplemento tessera super-integrativa
  lateFee: number; // mora iscrizione fuori termine
};

export type LocationExtra = { id: string; label: string; price: number };

// Documento della sede (M10.2): regolamenti, moduli vuoti, informative e
// template PDF per l'overlay. Il percorso nello storage non viaggia verso il
// client: i download passano sempre dalla server function.
export type LocationDocument = {
  id: string;
  locationId: string;
  category: LocationDocumentCategory;
  title: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
};

export const LOCATION_DOCUMENT_CATEGORIES: LocationDocumentCategory[] = [
  "regolamento",
  "modulo",
  "informativa",
  "template_overlay",
];

export const LOCATION_DOCUMENT_CATEGORY_LABELS: Record<LocationDocumentCategory, string> = {
  regolamento: "Regolamento",
  modulo: "Modulo",
  informativa: "Informativa",
  template_overlay: "Template PDF (uso interno)",
};

export type Location = {
  id: string;
  slug: string;
  type: LocationType;
  status: LocationStatus;
  name: string;
  comune: string;
  address: string;
  age: string;
  ageMin: number;
  ageMax: number;
  tagline: string;
  description: string;
  pricing: LocationPricing;
  badges: ActivityBadge[];
  weeks: CampWeek[];
  timeSlots: string[];
  dayPlan: DayBlock[];
  activities: string[];
  includedServices: string[];
  extraServices: LocationExtra[];
  requiredDocuments: string[];
  contacts: { phone: string; email: string; manager: string };
  faq: LocationFaq[];
  theme: Theme;
  logoPath: string | null;
  // URL firmato (bucket privato): lo valorizzano solo i loader server-side
  // tramite fetchLocations({ signLogos: true }); altrove resta null.
  logoUrl: string | null;
  adminNotes: string;
  sortOrder: number;
  // Solo le righe visibili al chiamante (RLS): il pubblico vede i documenti
  // pubblici delle sedi pubblicate, l'admin tutti.
  documents: LocationDocument[];
};

/* ---------- riga DB -> Location ---------- */

export type LocationRow = {
  id: string;
  slug: string;
  type: LocationType;
  status: LocationStatus;
  name: string;
  comune: string;
  address: string;
  age_label: string;
  age_min: number;
  age_max: number;
  tagline: string;
  description: string;
  theme: string;
  contact_phone: string;
  contact_email: string;
  contact_manager: string;
  logo_path: string | null;
  pricing: unknown;
  time_slots: string[];
  activities: string[];
  included_services: string[];
  required_documents: string[];
  badges: unknown;
  day_plan: unknown;
  faq: unknown;
  admin_notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  location_weeks: Array<{
    id: string;
    code: string;
    number: number;
    label: string;
    start_date: string | null;
    end_date: string | null;
    spots: number;
  }>;
  location_extras: Array<{
    id: string;
    code: string;
    label: string;
    price: number | string;
    sort_order: number;
  }>;
  location_documents?: Array<{
    id: string;
    location_id: string;
    category: LocationDocumentCategory;
    title: string;
    file_name: string;
    size_bytes: number;
    mime_type: string;
    is_public: boolean;
    sort_order: number;
    created_at: string;
  }>;
};

// Chiave `${slug}:${weekCode}` -> iscrizioni confermate.
export type Occupancy = Map<string, number>;

const THEMES: Theme[] = ["sun", "grass", "magic", "flame", "royal"];
const DAY_ICONS: DayBlock["icon"][] = ["sun", "ball", "lunch", "art", "team", "hug"];

function asTheme(v: unknown, fallback: Theme = "royal"): Theme {
  return THEMES.includes(v as Theme) ? (v as Theme) : fallback;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function emptyPricing(): LocationPricing {
  return {
    residentFullDay: 0,
    residentHalfDay: 0,
    nonResidentFullDay: 0,
    nonResidentHalfDay: 0,
    siblingDiscountFullDay: 0,
    siblingDiscountHalfDay: 0,
    membershipBase: 0,
    membershipSuperIntegrativa: 0,
    lateFee: 0,
  };
}

function parsePricing(v: unknown): LocationPricing {
  const base = emptyPricing();
  if (!isRecord(v)) return base;
  for (const key of Object.keys(base) as (keyof LocationPricing)[]) base[key] = num(v[key]);
  return base;
}

function parseBadges(v: unknown): ActivityBadge[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isRecord)
    .map((b) => ({ label: str(b.label), color: asTheme(b.color) }))
    .filter((b) => b.label);
}

function parseDayPlan(v: unknown): DayBlock[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isRecord).map((d) => ({
    time: str(d.time),
    title: str(d.title),
    description: str(d.description),
    icon: DAY_ICONS.includes(d.icon as DayBlock["icon"]) ? (d.icon as DayBlock["icon"]) : "sun",
    color: asTheme(d.color),
  }));
}

function parseFaq(v: unknown): LocationFaq[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(isRecord)
    .map((f) => ({ q: str(f.q), a: str(f.a) }))
    .filter((f) => f.q);
}

export function mapLocationRow(row: LocationRow, occupancy: Occupancy): Location {
  const weeks: CampWeek[] = [...row.location_weeks]
    .sort((a, b) => a.number - b.number)
    .map((w) => ({
      id: w.code,
      number: w.number,
      label: w.label,
      startDate: w.start_date,
      endDate: w.end_date,
      spots: w.spots,
      confirmed: occupancy.get(`${row.slug}:${w.code}`) ?? 0,
    }));
  const documents: LocationDocument[] = [...(row.location_documents ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
    .map((d) => ({
      id: d.id,
      locationId: d.location_id,
      category: d.category,
      title: d.title,
      fileName: d.file_name,
      sizeBytes: d.size_bytes,
      mimeType: d.mime_type,
      isPublic: d.is_public,
      sortOrder: d.sort_order,
      createdAt: d.created_at,
    }));
  const extraServices: LocationExtra[] = [...row.location_extras]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((e) => ({ id: e.code, label: e.label, price: num(e.price) }));
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    status: row.status,
    name: row.name,
    comune: row.comune,
    address: row.address,
    age: row.age_label || `${row.age_min}-${row.age_max} anni`,
    ageMin: row.age_min,
    ageMax: row.age_max,
    tagline: row.tagline,
    description: row.description,
    pricing: parsePricing(row.pricing),
    badges: parseBadges(row.badges),
    weeks,
    timeSlots: row.time_slots ?? [],
    dayPlan: parseDayPlan(row.day_plan),
    activities: row.activities ?? [],
    includedServices: row.included_services ?? [],
    extraServices,
    // Codici stabili (le etichette legacy del seed vengono normalizzate qui).
    requiredDocuments: [...new Set((row.required_documents ?? []).map(normalizeDocType))],
    contacts: { phone: row.contact_phone, email: row.contact_email, manager: row.contact_manager },
    faq: parseFaq(row.faq),
    theme: asTheme(row.theme),
    logoPath: row.logo_path,
    logoUrl: null,
    adminNotes: row.admin_notes,
    sortOrder: row.sort_order,
    documents,
  };
}

// Documenti mostrabili al pubblico (pagina sede, wizard): pubblici e mai i
// template di lavoro, anche quando il chiamante è un admin che vede tutto.
export function publicLocationDocuments(loc: Location): LocationDocument[] {
  return loc.documents.filter((d) => d.isPublic && d.category !== "template_overlay");
}

/* ---------- disponibilità (sempre calcolata dalle iscrizioni confermate) ---------- */

export function weekAvailable(w: CampWeek): number {
  return Math.max(w.spots - w.confirmed, 0);
}

export function locationCapacity(loc: Location) {
  const capacity = loc.weeks.reduce((acc, w) => acc + w.spots, 0);
  const booked = loc.weeks.reduce((acc, w) => acc + Math.min(w.confirmed, w.spots), 0);
  const available = Math.max(capacity - booked, 0);
  const pct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
  return { capacity, booked, available, pct };
}

export function locationCardSummary(loc: Location) {
  const cap = locationCapacity(loc);
  return {
    name: loc.name,
    slug: loc.slug,
    age: loc.age,
    weeks: loc.weeks.length,
    spots: cap.available,
    total: cap.capacity,
    tags: loc.badges.slice(0, 3),
    logoUrl: loc.logoUrl,
  };
}

/* ---------- editor admin ---------- */

export function locationToInput(loc: Location): LocationInput {
  return {
    id: loc.id,
    slug: loc.slug,
    type: loc.type,
    status: loc.status,
    name: loc.name,
    comune: loc.comune,
    address: loc.address,
    ageLabel: loc.age,
    ageMin: loc.ageMin,
    ageMax: loc.ageMax,
    tagline: loc.tagline,
    description: loc.description,
    theme: loc.theme,
    contacts: { ...loc.contacts },
    pricing: { ...loc.pricing },
    timeSlots: [...loc.timeSlots],
    activities: [...loc.activities],
    includedServices: [...loc.includedServices],
    requiredDocuments: [...loc.requiredDocuments],
    badges: loc.badges.map((b) => ({ ...b })),
    weeks: loc.weeks.map((w) => ({
      code: w.id,
      number: w.number,
      label: w.label,
      startDate: w.startDate ?? "",
      endDate: w.endDate ?? "",
      spots: w.spots,
    })),
    extraServices: loc.extraServices.map((e) => ({ ...e })),
    dayPlan: loc.dayPlan.map((d) => ({ ...d })),
    faq: loc.faq.map((f) => ({ ...f })),
    logoPath: loc.logoPath,
    adminNotes: loc.adminNotes,
    sortOrder: loc.sortOrder,
  };
}

export function newLocationInput(): LocationInput {
  return {
    slug: "",
    type: "centro_estivo",
    status: "bozza",
    name: "",
    comune: "",
    address: "",
    ageLabel: "",
    ageMin: 6,
    ageMax: 13,
    tagline: "",
    description: "",
    theme: "royal",
    contacts: { phone: "", email: "", manager: "" },
    pricing: emptyPricing(),
    timeSlots: [],
    activities: [],
    includedServices: [],
    requiredDocuments: [],
    badges: [],
    weeks: [],
    extraServices: [],
    dayPlan: [],
    faq: [],
    logoPath: null,
    adminNotes: "",
    sortOrder: 0,
  };
}
