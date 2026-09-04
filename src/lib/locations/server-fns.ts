import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Location } from "@/data/locations";
import { fetchLocationBySlug, fetchLocations } from "./queries";
import { locationInputSchema, type LocationInput } from "./validation";

// Lettura sedi per loader SSR e client: le RLS mostrano le pubblicate a tutti
// e le bozze solo all'admin (sessione nei cookie). Gli URL dei loghi vengono
// firmati qui, server-side (bucket privato).
export const listLocations = createServerFn({ method: "GET" }).handler(
  async (): Promise<Location[]> => fetchLocations(getSupabaseServerClient(), { signLogos: true }),
);

export const getLocation = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(
    async ({ data }): Promise<Location | null> =>
      fetchLocationBySlug(getSupabaseServerClient(), data.slug, { signLogos: true }),
  );

export type SaveLocationResult = { ok: true; id: string } | { ok: false; error: string };

// Crea/aggiorna una sede con settimane ed extra. L'autorizzazione è delle RLS
// (solo admin scrive); qui si rivalida il payload e si scrive l'audit log.
export const saveLocation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): LocationInput => locationInputSchema.parse(input))
  .handler(async ({ data }): Promise<SaveLocationResult> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };

    const record = {
      slug: data.slug,
      type: data.type,
      status: data.status,
      name: data.name,
      comune: data.comune,
      address: data.address,
      age_label: data.ageLabel || `${data.ageMin}-${data.ageMax} anni`,
      age_min: data.ageMin,
      age_max: data.ageMax,
      tagline: data.tagline,
      description: data.description,
      theme: data.theme,
      contact_phone: data.contacts.phone,
      contact_email: data.contacts.email,
      contact_manager: data.contacts.manager,
      logo_path: data.logoPath,
      pricing: data.pricing,
      time_slots: data.timeSlots,
      activities: data.activities,
      included_services: data.includedServices,
      required_documents: data.requiredDocuments,
      badges: data.badges,
      day_plan: data.dayPlan,
      faq: data.faq,
      admin_notes: data.adminNotes,
      sort_order: data.sortOrder,
    };

    let id = data.id;
    if (id) {
      const { error } = await supabase.from("locations").update(record).eq("id", id);
      if (error) return { ok: false, error: friendlyDbError(error.message) };
    } else {
      const { data: inserted, error } = await supabase
        .from("locations")
        .insert(record)
        .select("id")
        .single();
      if (error || !inserted) return { ok: false, error: friendlyDbError(error?.message ?? "") };
      id = inserted.id;
    }

    // Settimane ed extra: upsert per codice, poi rimozione di quelli spariti.
    // I codici sono referenziati dalle iscrizioni: non si rinominano da qui.
    const weekCodes = data.weeks.map((w) => w.code);
    const { error: weeksError } = await supabase.from("location_weeks").upsert(
      data.weeks.map((w) => ({
        location_id: id!,
        code: w.code,
        number: w.number,
        label: w.label,
        start_date: w.startDate || null,
        end_date: w.endDate || null,
        spots: w.spots,
      })),
      { onConflict: "location_id,code" },
    );
    if (weeksError) return { ok: false, error: friendlyDbError(weeksError.message) };
    const removeWeeks = supabase.from("location_weeks").delete().eq("location_id", id);
    await (weekCodes.length
      ? removeWeeks.not("code", "in", `(${weekCodes.join(",")})`)
      : removeWeeks);

    const extraCodes = data.extraServices.map((e) => e.id);
    const { error: extrasError } = await supabase.from("location_extras").upsert(
      data.extraServices.map((e, i) => ({
        location_id: id!,
        code: e.id,
        label: e.label,
        price: e.price,
        sort_order: i,
      })),
      { onConflict: "location_id,code" },
    );
    if (extrasError) return { ok: false, error: friendlyDbError(extrasError.message) };
    const removeExtras = supabase.from("location_extras").delete().eq("location_id", id);
    await (extraCodes.length
      ? removeExtras.not("code", "in", `(${extraCodes.join(",")})`)
      : removeExtras);

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: data.id ? "update_location" : "create_location",
      entity: "location",
      entity_id: id,
      detail: { slug: data.slug, status: data.status },
    });

    return { ok: true, id };
  });

function friendlyDbError(message: string): string {
  if (/locations_slug_key|duplicate key.*slug/i.test(message)) {
    return "Esiste già una sede con questo slug.";
  }
  if (/sede pubblicata non può/i.test(message)) {
    return "Lo slug di una sede pubblicata non può essere modificato.";
  }
  if (/row-level security|permission denied/i.test(message)) {
    return "Operazione non consentita: serve il ruolo admin.";
  }
  console.error("saveLocation:", message);
  return "Salvataggio non riuscito. Riprova.";
}
