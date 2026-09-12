import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EnrollmentStatus, FrequencyBand, FrequencyCategory } from "@/lib/supabase/types";
import {
  EMPTY_TOTALS,
  type RegistryCode,
  type RegistryData,
  type RegistryRow,
  type RegistryTotals,
  type RegistryWeek,
} from "./registry";

// Registro sede (M11.2): lettura della griglia e scrittura delle celle.
// L'autorizzazione è delle RLS con la sessione utente (solo admin scrive; la
// funzione dei totali è riservata all'admin). Gli importi non transitano mai
// dal client: quota, gita, versato e saldo arrivano da
// location_registry_totals, che li calcola nel database.

// Le iscrizioni annullate non compaiono nel registro: restano nell'area admin.
const HIDDEN_STATUSES: EnrollmentStatus[] = ["annullata"];

type EnrollmentRow = {
  id: string;
  code: string;
  status: EnrollmentStatus;
  week_ids: string[];
  time_slot: string;
  residente_nel_comune: boolean;
  admin_notes: string;
  created_at: string;
  children: { first_name: string; last_name: string; birth_date: string } | null;
};

type CodeRow = {
  id: string;
  code: string;
  label: string;
  category: FrequencyCategory;
  band: FrequencyBand;
  convenzione: boolean;
  price: number;
  active: boolean;
  sort_order: number;
};

type CellRow = { enrollment_id: string; week_code: string; frequency_code: string };

type TotalsRow = {
  enrollment_id: string;
  weeks_total: number;
  tessera: number;
  quota: number;
  gita: number;
  extra_total: number;
  versato: number;
  saldo: number;
};

function num(value: number | string | null): number {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export const getRegistry = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<RegistryData | null> => {
    const supabase = getSupabaseServerClient();

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id, slug, name, location_weeks ( code, number, label )")
      .eq("slug", data.slug)
      .maybeSingle<{
        id: string;
        slug: string;
        name: string;
        location_weeks: { code: string; number: number; label: string }[] | null;
      }>();
    if (locationError) {
      console.error("getRegistry location:", locationError.message);
      return null;
    }
    if (!location) return null;

    const weeks: RegistryWeek[] = (location.location_weeks ?? [])
      .map((w) => ({ code: w.code, number: w.number, label: w.label }))
      .sort((a, b) => a.number - b.number);

    const [codesRes, enrollmentsRes, totalsRes] = await Promise.all([
      supabase
        .from("location_frequency_codes")
        .select("id, code, label, category, band, convenzione, price, active, sort_order")
        .eq("location_id", location.id)
        .order("sort_order", { ascending: true })
        .returns<CodeRow[]>(),
      supabase
        .from("enrollments")
        .select(
          "id, code, status, week_ids, time_slot, residente_nel_comune, admin_notes, created_at, children ( first_name, last_name, birth_date )",
        )
        .eq("location_slug", data.slug)
        .not("status", "in", `(${HIDDEN_STATUSES.join(",")})`)
        .returns<EnrollmentRow[]>(),
      supabase.rpc("location_registry_totals", { _location_slug: data.slug }),
    ]);

    if (codesRes.error) console.error("getRegistry codes:", codesRes.error.message);
    if (enrollmentsRes.error) {
      console.error("getRegistry enrollments:", enrollmentsRes.error.message);
      throw new Error("Impossibile caricare le iscrizioni della sede.");
    }
    if (totalsRes.error) console.error("getRegistry totals:", totalsRes.error.message);

    const enrollments = enrollmentsRes.data ?? [];
    const enrollmentIds = enrollments.map((e) => e.id);

    // Le celle si leggono solo per le iscrizioni mostrate.
    let cells: CellRow[] = [];
    if (enrollmentIds.length > 0) {
      const { data: cellRows, error: cellsError } = await supabase
        .from("enrollment_week_codes")
        .select("enrollment_id, week_code, frequency_code")
        .in("enrollment_id", enrollmentIds)
        .returns<CellRow[]>();
      if (cellsError) console.error("getRegistry cells:", cellsError.message);
      cells = cellRows ?? [];
    }

    const cellsByEnrollment = new Map<string, Record<string, string>>();
    for (const cell of cells) {
      const current = cellsByEnrollment.get(cell.enrollment_id) ?? {};
      current[cell.week_code] = cell.frequency_code;
      cellsByEnrollment.set(cell.enrollment_id, current);
    }

    const totalsByEnrollment = new Map<string, RegistryTotals>();
    for (const row of (totalsRes.data ?? []) as TotalsRow[]) {
      totalsByEnrollment.set(row.enrollment_id, {
        weeksTotal: num(row.weeks_total),
        tessera: num(row.tessera),
        quota: num(row.quota),
        gita: num(row.gita),
        extraTotal: num(row.extra_total),
        versato: num(row.versato),
        saldo: num(row.saldo),
      });
    }

    const codes: RegistryCode[] = (codesRes.data ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      label: c.label,
      category: c.category,
      band: c.band,
      convenzione: c.convenzione,
      price: num(c.price),
      active: c.active,
      sortOrder: c.sort_order,
    }));

    const rows: RegistryRow[] = enrollments
      .map((e) => ({
        enrollmentId: e.id,
        enrollmentCode: e.code,
        status: e.status,
        childName: `${e.children?.last_name ?? ""} ${e.children?.first_name ?? ""}`.trim() || "—",
        childBirthDate: e.children?.birth_date ?? "",
        residente: e.residente_nel_comune,
        timeSlot: e.time_slot,
        weekIds: e.week_ids ?? [],
        cells: cellsByEnrollment.get(e.id) ?? {},
        totals: totalsByEnrollment.get(e.id) ?? EMPTY_TOTALS,
        adminNotes: e.admin_notes ?? "",
      }))
      .sort((a, b) => a.childName.localeCompare(b.childName, "it"));

    return {
      locationSlug: location.slug,
      locationName: location.name,
      locationId: location.id,
      weeks,
      codes,
      rows,
    };
  });

export type SetWeekCodeResult =
  | { ok: true; frequencyCode: string; totals: RegistryTotals }
  | { ok: false; error: string };

function dbError(message: string): string {
  if (/row-level security|permission denied/i.test(message)) {
    return "Operazione non consentita: serve il ruolo admin.";
  }
  if (/non esiste nella sede/i.test(message)) {
    // messaggio del trigger di validazione, già in italiano e specifico
    return message.replace(/^ERROR:\s*/i, "");
  }
  console.error("enrollment_week_codes:", message);
  return "Salvataggio della cella non riuscito. Riprova.";
}

// Compila o svuota una cella della griglia. Codice vuoto = cella cancellata.
// Ogni modifica finisce in audit_log con il valore precedente e quello nuovo.
export const setWeekCode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        enrollmentId: z.string().uuid(),
        weekCode: z.string().trim().min(1).max(40),
        // stringa vuota = svuota la cella
        frequencyCode: z
          .string()
          .trim()
          .max(8)
          .regex(/^[A-Z0-9]*$/, "Codice di frequenza non valido."),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<SetWeekCodeResult> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };

    // Serve lo slug per ricalcolare i totali dopo la scrittura; la lettura
    // stessa è già filtrata dalle RLS (solo admin e staff vedono le celle).
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, location_slug")
      .eq("id", data.enrollmentId)
      .maybeSingle<{ id: string; location_slug: string }>();
    if (!enrollment) return { ok: false, error: "Iscrizione non trovata." };

    const { data: previous } = await supabase
      .from("enrollment_week_codes")
      .select("frequency_code")
      .eq("enrollment_id", data.enrollmentId)
      .eq("week_code", data.weekCode)
      .maybeSingle<{ frequency_code: string }>();

    if (data.frequencyCode === "") {
      if (previous) {
        const { error } = await supabase
          .from("enrollment_week_codes")
          .delete()
          .eq("enrollment_id", data.enrollmentId)
          .eq("week_code", data.weekCode);
        if (error) return { ok: false, error: dbError(error.message) };
      }
    } else {
      const { error } = await supabase.from("enrollment_week_codes").upsert(
        {
          enrollment_id: data.enrollmentId,
          week_code: data.weekCode,
          frequency_code: data.frequencyCode,
        },
        { onConflict: "enrollment_id,week_code" },
      );
      if (error) return { ok: false, error: dbError(error.message) };
    }

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: data.frequencyCode === "" ? "clear_week_code" : "set_week_code",
      entity: "enrollment",
      entity_id: data.enrollmentId,
      detail: {
        location_slug: enrollment.location_slug,
        week_code: data.weekCode,
        previous: previous?.frequency_code ?? null,
        frequency_code: data.frequencyCode || null,
      },
    });

    // Totali aggiornati della sola iscrizione toccata: la griglia aggiorna la
    // riga senza ricaricare tutta la pagina, sempre con i numeri del database.
    const { data: totalsRows } = await supabase.rpc("location_registry_totals", {
      _location_slug: enrollment.location_slug,
    });
    const updated = ((totalsRows ?? []) as TotalsRow[]).find(
      (r) => r.enrollment_id === data.enrollmentId,
    );

    return {
      ok: true,
      frequencyCode: data.frequencyCode,
      totals: updated
        ? {
            weeksTotal: num(updated.weeks_total),
            tessera: num(updated.tessera),
            quota: num(updated.quota),
            gita: num(updated.gita),
            extraTotal: num(updated.extra_total),
            versato: num(updated.versato),
            saldo: num(updated.saldo),
          }
        : EMPTY_TOTALS,
    };
  });
