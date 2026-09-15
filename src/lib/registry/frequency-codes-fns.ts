import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { canDelete, deletionDbError, type DeletionPreview } from "@/lib/admin/deletion";
import { requireAdmin } from "./registry-server";
import type { FrequencyBand, FrequencyCategory, Json } from "@/lib/supabase/types";
import {
  FREQUENCY_BANDS,
  FREQUENCY_CATEGORIES,
  FREQUENCY_CODE_PATTERN,
  MAX_FREQUENCY_PRICE,
  STANDARD_FREQUENCY_CODES,
  type RegistryCode,
} from "./registry";

// Editor dei codici di frequenza per sede (M11.2b). Autorizzazione delle RLS
// con la sessione utente: solo l'admin scrive. Codice e sede non si cambiano
// mai (non sono nemmeno accettati dalla modifica; il trigger del database lo
// garantisce comunque). Un codice non si elimina: si disattiva, perché le
// caselle già compilate lo referenziano. Ogni scrittura va in audit_log.

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

type CodeRow = {
  id: string;
  code: string;
  label: string;
  category: FrequencyCategory;
  band: FrequencyBand;
  convenzione: boolean;
  price: number | string;
  active: boolean;
  sort_order: number;
};

export type FrequencyCodeWithUsage = RegistryCode & { usage: number };

const CODE_SELECT = "id, code, label, category, band, convenzione, price, active, sort_order";

const labelSchema = z.string().trim().min(1, "Inserisci l'etichetta.").max(80);
const priceSchema = z
  .number({ invalid_type_error: "Prezzo non valido." })
  .min(0, "Il prezzo non può essere negativo.")
  .max(MAX_FREQUENCY_PRICE, "Prezzo troppo alto.")
  .transform((n) => Math.round(n * 100) / 100);
const categorySchema = z.enum(FREQUENCY_CATEGORIES as [FrequencyCategory, ...FrequencyCategory[]]);
const bandSchema = z.enum(FREQUENCY_BANDS as [FrequencyBand, ...FrequencyBand[]]);

function mapCode(row: CodeRow): RegistryCode {
  const price = typeof row.price === "string" ? Number(row.price) : row.price;
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    category: row.category,
    band: row.band,
    convenzione: row.convenzione,
    price: Number.isFinite(price) ? price : 0,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

function dbError(message: string): string {
  if (/row-level security|permission denied/i.test(message)) {
    return "Operazione non consentita: serve il ruolo admin.";
  }
  if (/location_frequency_codes_unique_code|duplicate key/i.test(message)) {
    return "Questo codice esiste già nella sede.";
  }
  if (/code_format/i.test(message)) {
    return "Il codice può contenere solo lettere maiuscole e cifre, massimo 8.";
  }
  if (/non si possono modificare/i.test(message)) {
    return "Codice e sede di un codice di frequenza non si possono modificare.";
  }
  console.error("location_frequency_codes:", message);
  return "Operazione non riuscita. Riprova.";
}

async function currentUserId(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function audit(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  actorId: string,
  action: string,
  entityId: string,
  detail: Json,
  entity = "location_frequency_code",
) {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
    detail,
  });
  if (error) console.error("audit frequency code:", error.message);
}

// Codici della sede con il numero di caselle che li usano: rende concreto
// l'effetto di una modifica di prezzo, categoria o fascia.
export const listFrequencyCodes = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ locationId: z.string().uuid(), locationSlug: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<Result<{ codes: FrequencyCodeWithUsage[] }>> => {
    const supabase = getSupabaseServerClient();
    const [codesRes, cellsRes] = await Promise.all([
      supabase
        .from("location_frequency_codes")
        .select(CODE_SELECT)
        .eq("location_id", data.locationId)
        .order("sort_order", { ascending: true })
        .returns<CodeRow[]>(),
      supabase
        .from("enrollment_week_codes")
        .select("frequency_code, enrollments!inner ( location_slug )")
        .eq("enrollments.location_slug", data.locationSlug)
        .returns<{ frequency_code: string }[]>(),
    ]);
    if (codesRes.error) return { ok: false, error: dbError(codesRes.error.message) };
    if (cellsRes.error) console.error("usage frequency codes:", cellsRes.error.message);

    const usage = new Map<string, number>();
    for (const cell of cellsRes.data ?? []) {
      usage.set(cell.frequency_code, (usage.get(cell.frequency_code) ?? 0) + 1);
    }
    return {
      ok: true,
      codes: (codesRes.data ?? []).map((row) => ({
        ...mapCode(row),
        usage: usage.get(row.code) ?? 0,
      })),
    };
  });

export const createFrequencyCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        locationId: z.string().uuid(),
        code: z
          .string()
          .trim()
          .transform((s) => s.toUpperCase())
          .pipe(
            z
              .string()
              .regex(
                FREQUENCY_CODE_PATTERN,
                "Il codice può contenere solo lettere maiuscole e cifre, massimo 8.",
              ),
          ),
        label: labelSchema,
        category: categorySchema,
        band: bandSchema,
        convenzione: z.boolean(),
        price: priceSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    const supabase = getSupabaseServerClient();
    const userId = await currentUserId(supabase);
    if (!userId) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };

    // Il nuovo codice va in coda all'ordine esistente.
    const { data: last } = await supabase
      .from("location_frequency_codes")
      .select("sort_order")
      .eq("location_id", data.locationId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number }>();

    const { data: inserted, error } = await supabase
      .from("location_frequency_codes")
      .insert({
        location_id: data.locationId,
        code: data.code,
        label: data.label,
        category: data.category,
        band: data.band,
        convenzione: data.convenzione,
        price: data.price,
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .select("id")
      .single();
    if (error || !inserted) return { ok: false, error: dbError(error?.message ?? "") };

    await audit(supabase, userId, "create_frequency_code", inserted.id, {
      location_id: data.locationId,
      code: data.code,
      label: data.label,
      category: data.category,
      band: data.band,
      convenzione: data.convenzione,
      price: data.price,
    });
    return { ok: true, id: inserted.id };
  });

// Modifica dei soli campi ammessi. Codice e sede non fanno parte dello schema e
// lo schema è strict: una richiesta che provasse a mandarli viene rifiutata.
export const updateFrequencyCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        label: labelSchema.optional(),
        category: categorySchema.optional(),
        band: bandSchema.optional(),
        convenzione: z.boolean().optional(),
        price: priceSchema.optional(),
        active: z.boolean().optional(),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const userId = await currentUserId(supabase);
    if (!userId) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };

    const { id, ...patch } = data;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { data: before, error: readError } = await supabase
      .from("location_frequency_codes")
      .select(`location_id, ${CODE_SELECT}`)
      .eq("id", id)
      .maybeSingle<CodeRow & { location_id: string }>();
    if (readError) return { ok: false, error: dbError(readError.message) };
    if (!before) return { ok: false, error: "Codice di frequenza non trovato." };

    const { error } = await supabase.from("location_frequency_codes").update(patch).eq("id", id);
    if (error) return { ok: false, error: dbError(error.message) };

    // Solo i campi davvero cambiati, con il valore di prima e quello di dopo.
    const previous = mapCode(before);
    const changes: Record<string, { from: Json; to: Json }> = {};
    for (const [key, value] of Object.entries(patch) as [keyof typeof patch, Json][]) {
      const old = previous[key] as Json;
      if (old !== value) changes[key] = { from: old, to: value };
    }
    if (Object.keys(changes).length > 0) {
      await audit(supabase, userId, "update_frequency_code", id, {
        location_id: before.location_id,
        code: before.code,
        changes,
      });
    }
    return { ok: true };
  });

// Per le sedi senza nessun codice (create dal pannello dopo la M11.1): carica
// gli 8 codici standard. Se la sede ne ha già anche uno solo non fa nulla, per
// non mescolare i default con una legenda già personalizzata.
export const loadStandardFrequencyCodes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ locationId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<Result<{ inserted: number }>> => {
    const supabase = getSupabaseServerClient();
    const userId = await currentUserId(supabase);
    if (!userId) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };

    const { count, error: countError } = await supabase
      .from("location_frequency_codes")
      .select("id", { count: "exact", head: true })
      .eq("location_id", data.locationId);
    if (countError) return { ok: false, error: dbError(countError.message) };
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: "La sede ha già dei codici: aggiungi quelli mancanti uno per uno.",
      };
    }

    const { error } = await supabase.from("location_frequency_codes").insert(
      STANDARD_FREQUENCY_CODES.map((c) => ({
        location_id: data.locationId,
        code: c.code,
        label: c.label,
        category: c.category,
        band: c.band,
        convenzione: c.convenzione,
        price: c.price,
        sort_order: c.sortOrder,
      })),
    );
    if (error) return { ok: false, error: dbError(error.message) };

    await audit(
      supabase,
      userId,
      "load_standard_frequency_codes",
      data.locationId,
      { codes: STANDARD_FREQUENCY_CODES.map((c) => c.code) },
      "location",
    );
    return { ok: true, inserted: STANDARD_FREQUENCY_CODES.length };
  });

/* ---------------------------------------------------------------------------
 * Eliminazione definitiva (M11.3b): solo se nessuna casella del registro della
 * sede usa il codice. Altrimenti si disattiva. Il trigger di guardia nel
 * database ripete il controllo.
 * ------------------------------------------------------------------------- */

async function loadCodeForDeletion(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  id: string,
) {
  const { data: code } = await supabase
    .from("location_frequency_codes")
    .select(`location_id, ${CODE_SELECT}, locations ( slug, name )`)
    .eq("id", id)
    .maybeSingle<
      CodeRow & { location_id: string; locations: { slug: string; name: string } | null }
    >();
  if (!code?.locations) return null;

  const { count } = await supabase
    .from("enrollment_week_codes")
    .select("id, enrollments!inner ( location_slug )", { count: "exact", head: true })
    .eq("frequency_code", code.code)
    .eq("enrollments.location_slug", code.locations.slug);

  const preview: DeletionPreview = {
    subject: `il codice ${code.code} della sede ${code.locations.name}`,
    blockers: [{ label: "Caselle del registro che usano il codice", count: count ?? 0 }],
    removes: [],
    alternative: code.active
      ? "Disattivalo: sparisce dalle tendine del registro e resta valido nelle caselle già compilate."
      : "Il codice è già disattivato e resta valido nelle caselle già compilate.",
  };
  return { code, preview };
}

export const getFrequencyCodeDeletionPreview = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data }): Promise<Result<{ preview: DeletionPreview }>> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;
    const loaded = await loadCodeForDeletion(supabase, data.id);
    if (!loaded) return { ok: false, error: "Codice di frequenza non trovato." };
    return { ok: true, preview: loaded.preview };
  });

export const deleteFrequencyCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;
    const loaded = await loadCodeForDeletion(supabase, data.id);
    if (!loaded) return { ok: false, error: "Codice di frequenza non trovato." };
    if (!canDelete(loaded.preview)) {
      return { ok: false, error: "Il codice è usato nel registro: si può solo disattivare." };
    }
    const { error } = await supabase.from("location_frequency_codes").delete().eq("id", data.id);
    if (error)
      return { ok: false, error: deletionDbError(error.message) ?? dbError(error.message) };
    const removed = mapCode(loaded.code);
    await audit(supabase, admin.userId, "delete_frequency_code", data.id, {
      location_id: loaded.code.location_id,
      code: removed.code,
      label: removed.label,
      category: removed.category,
      band: removed.band,
      convenzione: removed.convenzione,
      price: removed.price,
      active: removed.active,
    });
    return { ok: true };
  });
