import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { mapLocationRow, type Location, type LocationRow, type Occupancy } from "@/data/locations";

// Query condivise tra client browser e client server (SSR/server function):
// le RLS decidono cosa si vede (pubblicate per tutti, bozze solo admin).

export const LOCATION_SELECT = `
  id, slug, type, status, name, comune, address, age_label, age_min, age_max,
  tagline, description, theme, contact_phone, contact_email, contact_manager,
  logo_path, pricing, time_slots, activities, included_services, required_documents,
  badges, day_plan, faq, admin_notes, sort_order, created_at, updated_at,
  location_weeks ( id, code, number, label, start_date, end_date, spots ),
  location_extras ( id, code, label, price, sort_order ),
  location_documents ( id, location_id, category, title, file_name, size_bytes, mime_type, is_public, sort_order, created_at ),
  location_custom_fields ( id, location_id, code, label, field_type, options, required, sort_order, active )
`;

type Client = SupabaseClient<Database>;

// Loghi: bucket PRIVATO (Lovable Cloud non consente bucket pubblici), quindi
// URL firmati. 24 h: i loader li rigenerano a ogni caricamento della pagina.
export const LOGO_BUCKET = "location-logos";
const LOGO_URL_TTL_SECONDS = 60 * 60 * 24;

async function signLogos(supabase: Client, list: Location[]): Promise<Location[]> {
  const paths = [...new Set(list.map((l) => l.logoPath).filter((p): p is string => Boolean(p)))];
  if (paths.length === 0) return list;
  const { data, error } = await supabase.storage
    .from(LOGO_BUCKET)
    .createSignedUrls(paths, LOGO_URL_TTL_SECONDS);
  if (error || !data) {
    console.error("Firma URL loghi sedi:", error?.message);
    return list;
  }
  const byPath = new Map<string, string>();
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) byPath.set(item.path, item.signedUrl);
  }
  return list.map((l) => (l.logoPath ? { ...l, logoUrl: byPath.get(l.logoPath) ?? null } : l));
}

async function fetchOccupancy(supabase: Client): Promise<Occupancy> {
  const { data, error } = await supabase.rpc("location_week_occupancy");
  if (error) {
    console.error("location_week_occupancy:", error.message);
    return new Map();
  }
  const map: Occupancy = new Map();
  for (const row of data ?? []) map.set(`${row.location_slug}:${row.week_code}`, row.confirmed);
  return map;
}

export type FetchLocationsOptions = {
  slug?: string;
  withOccupancy?: boolean; // default true
  signLogos?: boolean; // default false: solo i loader server-side firmano gli URL
};

export async function fetchLocations(
  supabase: Client,
  opts: FetchLocationsOptions = {},
): Promise<Location[]> {
  let query = supabase
    .from("locations")
    .select(LOCATION_SELECT)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (opts.slug) query = query.eq("slug", opts.slug);
  const [{ data, error }, occupancy] = await Promise.all([
    query.returns<LocationRow[]>(),
    opts.withOccupancy === false
      ? Promise.resolve(new Map() as Occupancy)
      : fetchOccupancy(supabase),
  ]);
  if (error) throw new Error("Impossibile caricare le sedi.");
  const list = (data ?? []).map((row) => mapLocationRow(row, occupancy));
  return opts.signLogos ? signLogos(supabase, list) : list;
}

export async function fetchLocationBySlug(
  supabase: Client,
  slug: string,
  opts: Omit<FetchLocationsOptions, "slug"> = {},
): Promise<Location | null> {
  const [loc] = await fetchLocations(supabase, { slug, ...opts });
  return loc ?? null;
}

// Indice per slug, comodo per mappare le iscrizioni.
export function indexLocations(list: Location[]): Map<string, Location> {
  return new Map(list.map((l) => [l.slug, l]));
}
