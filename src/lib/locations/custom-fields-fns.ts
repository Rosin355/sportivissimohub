import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  CUSTOM_FIELD_TYPES,
  MAX_ACTIVE_CUSTOM_FIELDS,
  generateFieldCode,
} from "@/lib/enrollments/custom-fields";

// Server function dei campi personalizzati (admin via RLS). Il code si genera
// alla creazione e non cambia più; un campo non si elimina mai fisicamente:
// si disattiva (le risposte già raccolte restano intatte nelle iscrizioni).

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const optionsSchema = z
  .array(z.string().trim().min(1))
  .max(30, "Massimo 30 opzioni.")
  .transform((a) => [...new Set(a)]);

function dbError(message: string): string {
  if (/row-level security|permission denied/i.test(message)) {
    return "Operazione non consentita: serve il ruolo admin.";
  }
  if (/options_for_choice/i.test(message))
    return "Un campo a scelta ha bisogno di almeno un'opzione.";
  if (/non si possono modificare/i.test(message))
    return "Codice e tipo del campo non si possono modificare.";
  console.error("location_custom_fields:", message);
  return "Operazione non riuscita. Riprova.";
}

async function actor(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function activeCount(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  locationId: string,
  excludeId?: string,
): Promise<number> {
  let q = supabase
    .from("location_custom_fields")
    .select("id", { count: "exact", head: true })
    .eq("location_id", locationId)
    .eq("active", true);
  if (excludeId) q = q.neq("id", excludeId);
  const { count } = await q;
  return count ?? 0;
}

export const createCustomField = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        locationId: z.string().uuid(),
        label: z.string().trim().min(1, "Inserisci l'etichetta.").max(80),
        fieldType: z.enum(CUSTOM_FIELD_TYPES as [string, ...string[]]),
        options: optionsSchema.default([]),
        required: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result<{ id: string; code: string }>> => {
    const supabase = getSupabaseServerClient();
    const userId = await actor(supabase);
    if (!userId) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };
    if (data.fieldType === "scelta" && data.options.length === 0) {
      return { ok: false, error: "Un campo a scelta ha bisogno di almeno un'opzione." };
    }
    if ((await activeCount(supabase, data.locationId)) >= MAX_ACTIVE_CUSTOM_FIELDS) {
      return {
        ok: false,
        error: `Massimo ${MAX_ACTIVE_CUSTOM_FIELDS} campi attivi per sede: disattivane uno prima.`,
      };
    }
    const { data: existing } = await supabase
      .from("location_custom_fields")
      .select("code, sort_order")
      .eq("location_id", data.locationId);
    const code = generateFieldCode(
      data.label,
      (existing ?? []).map((f) => f.code),
    );
    const sortOrder = Math.max(-1, ...(existing ?? []).map((f) => f.sort_order)) + 1;
    const { data: inserted, error } = await supabase
      .from("location_custom_fields")
      .insert({
        location_id: data.locationId,
        code,
        label: data.label,
        field_type: data.fieldType as (typeof CUSTOM_FIELD_TYPES)[number],
        options: data.fieldType === "scelta" ? data.options : [],
        required: data.required,
        sort_order: sortOrder,
      })
      .select("id")
      .single();
    if (error || !inserted) return { ok: false, error: dbError(error?.message ?? "") };
    await supabase.from("audit_log").insert({
      actor_id: userId,
      action: "create_custom_field",
      entity: "location_custom_field",
      entity_id: inserted.id,
      detail: { location_id: data.locationId, code, field_type: data.fieldType },
    });
    return { ok: true, id: inserted.id, code };
  });

// Modifica etichetta, opzioni, obbligatorietà, attivazione. Code e tipo
// sono immutabili (trigger nel DB); le risposte già raccolte non cambiano.
export const updateCustomField = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        label: z.string().trim().min(1).max(80).optional(),
        options: optionsSchema.optional(),
        required: z.boolean().optional(),
        active: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const userId = await actor(supabase);
    if (!userId) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };
    const { data: field } = await supabase
      .from("location_custom_fields")
      .select("id, location_id, field_type, active")
      .eq("id", data.id)
      .maybeSingle();
    if (!field) return { ok: false, error: "Campo non trovato." };
    if (data.options !== undefined && field.field_type === "scelta" && data.options.length === 0) {
      return { ok: false, error: "Un campo a scelta ha bisogno di almeno un'opzione." };
    }
    if (data.active === true && !field.active) {
      if ((await activeCount(supabase, field.location_id, field.id)) >= MAX_ACTIVE_CUSTOM_FIELDS) {
        return {
          ok: false,
          error: `Massimo ${MAX_ACTIVE_CUSTOM_FIELDS} campi attivi per sede: disattivane uno prima.`,
        };
      }
    }
    const patch: { label?: string; options?: string[]; required?: boolean; active?: boolean } = {};
    if (data.label !== undefined) patch.label = data.label;
    if (data.options !== undefined && field.field_type === "scelta") patch.options = data.options;
    if (data.required !== undefined) patch.required = data.required;
    if (data.active !== undefined) patch.active = data.active;
    const { error } = await supabase.from("location_custom_fields").update(patch).eq("id", data.id);
    if (error) return { ok: false, error: dbError(error.message) };
    await supabase.from("audit_log").insert({
      actor_id: userId,
      action: "update_custom_field",
      entity: "location_custom_field",
      entity_id: data.id,
      detail: patch,
    });
    return { ok: true };
  });

export const reorderCustomFields = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ locationId: z.string().uuid(), orderedIds: z.array(z.string().uuid()).max(100) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    for (let i = 0; i < data.orderedIds.length; i++) {
      const { error } = await supabase
        .from("location_custom_fields")
        .update({ sort_order: i })
        .eq("id", data.orderedIds[i])
        .eq("location_id", data.locationId);
      if (error) return { ok: false, error: dbError(error.message) };
    }
    return { ok: true };
  });
