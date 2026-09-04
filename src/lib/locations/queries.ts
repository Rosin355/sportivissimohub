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
  location_extras ( id, code, label, price, sort_order )
`;

type Client = SupabaseClient<Database>;

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

export async function fetchLocations(
  supabase: Client,
  opts: { slug?: string; withOccupancy?: boolean } = {},
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
  return (data ?? []).map((row) => mapLocationRow(row, occupancy));
}

export async function fetchLocationBySlug(
  supabase: Client,
  slug: string,
): Promise<Location | null> {
  const [loc] = await fetchLocations(supabase, { slug });
  return loc ?? null;
}

// Indice per slug, comodo per mappare le iscrizioni.
export function indexLocations(list: Location[]): Map<string, Location> {
  return new Map(list.map((l) => [l.slug, l]));
}
