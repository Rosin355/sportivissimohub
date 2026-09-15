import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CashMovementKind, ExtraChargeType, Json, PaymentMethod } from "@/lib/supabase/types";
import {
  CASH_MOVEMENT_KINDS,
  EXTRA_CHARGE_TYPES,
  MAX_AMOUNT,
  PAYMENT_METHODS,
  isIsoDate,
  signedMovementAmount,
  sortEntries,
  summarizeCash,
  type CashBook,
  type CashEntry,
  type CashMovement,
  type EnrollmentLedger,
  type RegistryExtraCharge,
  type RegistryPayment,
} from "./payments";
import { fetchEnrollmentTotals, num, requireAdmin, type ServerSupabase } from "./registry-server";

// Pagamenti e cassa di sede (M11.3). Solo admin: controllo esplicito del ruolo
// in ogni funzione, oltre alle RLS della M11.1 (scrittura solo admin; il
// genitore legge soltanto le proprie rate, e non da qui). Ogni creazione,
// modifica ed eliminazione finisce in audit_log. Il saldo non si calcola qui:
// dopo ogni scrittura si rileggono i totali da location_registry_totals.

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const methodSchema = z.enum(PAYMENT_METHODS as [PaymentMethod, ...PaymentMethod[]]);
const kindSchema = z.enum(CASH_MOVEMENT_KINDS as [CashMovementKind, ...CashMovementKind[]]);
const chargeTypeSchema = z.enum(EXTRA_CHARGE_TYPES as [ExtraChargeType, ...ExtraChargeType[]]);
const dateSchema = z.string().refine(isIsoDate, "Data non valida.");
const noteSchema = z.string().trim().max(300, "Testo troppo lungo: massimo 300 caratteri.");
const amountSchema = z
  .number({ invalid_type_error: "Importo non valido." })
  .refine((n) => Number.isFinite(n) && n !== 0, "L'importo non può essere zero.")
  .refine((n) => Math.abs(n) <= MAX_AMOUNT, "Importo troppo alto.")
  .transform((n) => Math.round(n * 100) / 100);

function dbError(message: string): string {
  if (/row-level security|permission denied/i.test(message)) {
    return "Operazione non consentita: serve il ruolo admin.";
  }
  if (/amount_nonzero/i.test(message)) return "L'importo non può essere zero.";
  console.error("pagamenti/cassa:", message);
  return "Operazione non riuscita. Riprova.";
}

async function audit(
  supabase: ServerSupabase,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  detail: Json,
) {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
    detail,
  });
  if (error) console.error("audit pagamenti/cassa:", error.message);
}

// Solo i campi cambiati, con il valore di prima e quello di dopo.
function diff(before: Record<string, Json>, after: Record<string, Json>) {
  const changes: Record<string, { from: Json; to: Json }> = {};
  for (const key of Object.keys(after)) {
    if (before[key] !== after[key]) changes[key] = { from: before[key], to: after[key] };
  }
  return changes;
}

/* ---------------------------------------------------------------------------
 * Scheda economica di un'iscrizione: rate, addebiti extra (gita), totali
 * ------------------------------------------------------------------------- */

type PaymentRow = {
  id: string;
  enrollment_id: string;
  amount: number | string;
  method: PaymentMethod;
  paid_on: string;
  note: string;
  created_at: string;
};

type ExtraChargeRow = {
  id: string;
  enrollment_id: string;
  charge_type: ExtraChargeType;
  description: string;
  amount: number | string;
  created_at: string;
};

function mapPayment(row: PaymentRow): RegistryPayment {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    amount: num(row.amount),
    method: row.method,
    paidOn: row.paid_on,
    note: row.note ?? "",
    createdAt: row.created_at,
  };
}

function mapExtraCharge(row: ExtraChargeRow): RegistryExtraCharge {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    chargeType: row.charge_type,
    description: row.description ?? "",
    amount: num(row.amount),
    createdAt: row.created_at,
  };
}

async function loadEnrollmentHeader(supabase: ServerSupabase, enrollmentId: string) {
  const { data } = await supabase
    .from("enrollments")
    .select("id, code, location_slug, children ( first_name, last_name )")
    .eq("id", enrollmentId)
    .maybeSingle<{
      id: string;
      code: string;
      location_slug: string;
      children: { first_name: string; last_name: string } | null;
    }>();
  return data;
}

async function loadLedger(
  supabase: ServerSupabase,
  enrollmentId: string,
): Promise<Result<{ ledger: EnrollmentLedger }>> {
  const header = await loadEnrollmentHeader(supabase, enrollmentId);
  if (!header) return { ok: false, error: "Iscrizione non trovata." };

  const [paymentsRes, chargesRes, totals] = await Promise.all([
    supabase
      .from("payments")
      .select("id, enrollment_id, amount, method, paid_on, note, created_at")
      .eq("enrollment_id", enrollmentId)
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<PaymentRow[]>(),
    supabase
      .from("extra_charges")
      .select("id, enrollment_id, charge_type, description, amount, created_at")
      .eq("enrollment_id", enrollmentId)
      .order("created_at", { ascending: true })
      .returns<ExtraChargeRow[]>(),
    fetchEnrollmentTotals(supabase, header.location_slug, enrollmentId),
  ]);
  if (paymentsRes.error) return { ok: false, error: dbError(paymentsRes.error.message) };
  if (chargesRes.error) return { ok: false, error: dbError(chargesRes.error.message) };

  return {
    ok: true,
    ledger: {
      enrollmentId: header.id,
      enrollmentCode: header.code,
      childName:
        `${header.children?.last_name ?? ""} ${header.children?.first_name ?? ""}`.trim() || "—",
      locationSlug: header.location_slug,
      payments: (paymentsRes.data ?? []).map(mapPayment),
      extraCharges: (chargesRes.data ?? []).map(mapExtraCharge),
      totals,
    },
  };
}

export type LedgerResult = Result<{ ledger: EnrollmentLedger }>;

export const getEnrollmentLedger = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ enrollmentId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<LedgerResult> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;
    return loadLedger(supabase, data.enrollmentId);
  });

// Crea (senza id) o modifica (con id) una rata. La rata non cambia mai
// iscrizione: la modifica è vincolata all'iscrizione indicata.
export const savePayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        enrollmentId: z.string().uuid(),
        amount: amountSchema,
        method: methodSchema,
        paidOn: dateSchema,
        note: noteSchema.default(""),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data }): Promise<LedgerResult> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const header = await loadEnrollmentHeader(supabase, data.enrollmentId);
    if (!header) return { ok: false, error: "Iscrizione non trovata." };

    const values = {
      amount: data.amount,
      method: data.method,
      paid_on: data.paidOn,
      note: data.note,
    };

    if (!data.id) {
      const { data: inserted, error } = await supabase
        .from("payments")
        .insert({ enrollment_id: data.enrollmentId, created_by: admin.userId, ...values })
        .select("id")
        .single();
      if (error || !inserted) return { ok: false, error: dbError(error?.message ?? "") };
      await audit(supabase, admin.userId, "create_payment", "payment", inserted.id, {
        enrollment_id: data.enrollmentId,
        location_slug: header.location_slug,
        ...values,
      });
    } else {
      const { data: before } = await supabase
        .from("payments")
        .select("id, enrollment_id, amount, method, paid_on, note, created_at")
        .eq("id", data.id)
        .eq("enrollment_id", data.enrollmentId)
        .maybeSingle<PaymentRow>();
      if (!before) return { ok: false, error: "Rata non trovata per questa iscrizione." };

      const { error } = await supabase
        .from("payments")
        .update(values)
        .eq("id", data.id)
        .eq("enrollment_id", data.enrollmentId);
      if (error) return { ok: false, error: dbError(error.message) };

      const previous = mapPayment(before);
      const changes = diff(
        {
          amount: previous.amount,
          method: previous.method,
          paid_on: previous.paidOn,
          note: previous.note,
        },
        values,
      );
      if (Object.keys(changes).length > 0) {
        await audit(supabase, admin.userId, "update_payment", "payment", data.id, {
          enrollment_id: data.enrollmentId,
          location_slug: header.location_slug,
          changes,
        });
      }
    }
    return loadLedger(supabase, data.enrollmentId);
  });

export const deletePayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), enrollmentId: z.string().uuid() }).strict().parse(input),
  )
  .handler(async ({ data }): Promise<LedgerResult> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const { data: before } = await supabase
      .from("payments")
      .select("id, enrollment_id, amount, method, paid_on, note, created_at")
      .eq("id", data.id)
      .eq("enrollment_id", data.enrollmentId)
      .maybeSingle<PaymentRow>();
    if (!before) return { ok: false, error: "Rata non trovata per questa iscrizione." };

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", data.id)
      .eq("enrollment_id", data.enrollmentId);
    if (error) return { ok: false, error: dbError(error.message) };

    const removed = mapPayment(before);
    // La riga non esiste più: l'audit ne conserva l'intero contenuto.
    await audit(supabase, admin.userId, "delete_payment", "payment", data.id, {
      enrollment_id: data.enrollmentId,
      amount: removed.amount,
      method: removed.method,
      paid_on: removed.paidOn,
      note: removed.note,
    });
    return loadLedger(supabase, data.enrollmentId);
  });

// Gita e altri addebiti fuori quota: si aggiungono e si rimuovono.
export const addExtraCharge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        enrollmentId: z.string().uuid(),
        chargeType: chargeTypeSchema,
        description: noteSchema.default(""),
        amount: amountSchema.refine((n) => n > 0, "L'addebito deve essere positivo."),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data }): Promise<LedgerResult> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const header = await loadEnrollmentHeader(supabase, data.enrollmentId);
    if (!header) return { ok: false, error: "Iscrizione non trovata." };

    const values = {
      charge_type: data.chargeType,
      description: data.description,
      amount: data.amount,
    };
    const { data: inserted, error } = await supabase
      .from("extra_charges")
      .insert({ enrollment_id: data.enrollmentId, created_by: admin.userId, ...values })
      .select("id")
      .single();
    if (error || !inserted) return { ok: false, error: dbError(error?.message ?? "") };

    await audit(supabase, admin.userId, "create_extra_charge", "extra_charge", inserted.id, {
      enrollment_id: data.enrollmentId,
      location_slug: header.location_slug,
      ...values,
    });
    return loadLedger(supabase, data.enrollmentId);
  });

export const deleteExtraCharge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), enrollmentId: z.string().uuid() }).strict().parse(input),
  )
  .handler(async ({ data }): Promise<LedgerResult> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const { data: before } = await supabase
      .from("extra_charges")
      .select("id, enrollment_id, charge_type, description, amount, created_at")
      .eq("id", data.id)
      .eq("enrollment_id", data.enrollmentId)
      .maybeSingle<ExtraChargeRow>();
    if (!before) return { ok: false, error: "Addebito non trovato per questa iscrizione." };

    const { error } = await supabase
      .from("extra_charges")
      .delete()
      .eq("id", data.id)
      .eq("enrollment_id", data.enrollmentId);
    if (error) return { ok: false, error: dbError(error.message) };

    const removed = mapExtraCharge(before);
    await audit(supabase, admin.userId, "delete_extra_charge", "extra_charge", data.id, {
      enrollment_id: data.enrollmentId,
      charge_type: removed.chargeType,
      description: removed.description,
      amount: removed.amount,
    });
    return loadLedger(supabase, data.enrollmentId);
  });

/* ---------------------------------------------------------------------------
 * Cassa di sede: rate e rimborsi dei bambini + spese, consegne, altri movimenti
 * ------------------------------------------------------------------------- */

type CashMovementRow = {
  id: string;
  location_id: string;
  kind: CashMovementKind;
  amount: number | string;
  method: PaymentMethod;
  moved_on: string;
  description: string;
  created_at: string;
};

function mapMovement(row: CashMovementRow): CashMovement {
  return {
    id: row.id,
    locationId: row.location_id,
    kind: row.kind,
    amount: num(row.amount),
    method: row.method,
    movedOn: row.moved_on,
    description: row.description ?? "",
    createdAt: row.created_at,
  };
}

const periodSchema = z
  .object({
    slug: z.string().min(1),
    from: dateSchema.nullable().default(null),
    to: dateSchema.nullable().default(null),
  })
  .refine((p) => !p.from || !p.to || p.from <= p.to, {
    message: "La data di inizio è successiva a quella di fine.",
  });

export const getCashBook = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => periodSchema.parse(input))
  .handler(async ({ data }): Promise<Result<{ book: CashBook | null }>> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const { data: location } = await supabase
      .from("locations")
      .select("id, slug, name")
      .eq("slug", data.slug)
      .maybeSingle<{ id: string; slug: string; name: string }>();
    if (!location) return { ok: true, book: null };

    // Le rate di tutte le iscrizioni della sede, anche annullate: sono soldi
    // entrati o restituiti davvero, quindi appartengono alla cassa.
    let paymentsQuery = supabase
      .from("payments")
      .select(
        "id, enrollment_id, amount, method, paid_on, note, created_at, enrollments!inner ( code, location_slug, children ( first_name, last_name ) )",
      )
      .eq("enrollments.location_slug", data.slug);
    if (data.from) paymentsQuery = paymentsQuery.gte("paid_on", data.from);
    if (data.to) paymentsQuery = paymentsQuery.lte("paid_on", data.to);

    let movementsQuery = supabase
      .from("cash_movements")
      .select("id, location_id, kind, amount, method, moved_on, description, created_at")
      .eq("location_id", location.id);
    if (data.from) movementsQuery = movementsQuery.gte("moved_on", data.from);
    if (data.to) movementsQuery = movementsQuery.lte("moved_on", data.to);

    const [paymentsRes, movementsRes] = await Promise.all([
      paymentsQuery.returns<
        (PaymentRow & {
          enrollments: {
            code: string;
            children: { first_name: string; last_name: string } | null;
          } | null;
        })[]
      >(),
      movementsQuery.returns<CashMovementRow[]>(),
    ]);
    if (paymentsRes.error) return { ok: false, error: dbError(paymentsRes.error.message) };
    if (movementsRes.error) return { ok: false, error: dbError(movementsRes.error.message) };

    const entries: CashEntry[] = [
      ...(paymentsRes.data ?? []).map(
        (row): CashEntry => ({
          source: "payment",
          id: row.id,
          date: row.paid_on,
          method: row.method,
          amount: num(row.amount),
          enrollmentId: row.enrollment_id,
          enrollmentCode: row.enrollments?.code ?? "",
          childName:
            `${row.enrollments?.children?.last_name ?? ""} ${row.enrollments?.children?.first_name ?? ""}`.trim() ||
            "—",
          note: row.note ?? "",
        }),
      ),
      ...(movementsRes.data ?? []).map((row): CashEntry => {
        const m = mapMovement(row);
        return {
          source: "movement",
          id: m.id,
          date: m.movedOn,
          method: m.method,
          amount: m.amount,
          kind: m.kind,
          description: m.description,
        };
      }),
    ];

    return {
      ok: true,
      book: {
        locationId: location.id,
        locationSlug: location.slug,
        locationName: location.name,
        from: data.from,
        to: data.to,
        entries: sortEntries(entries),
        summary: summarizeCash(entries),
      },
    };
  });

// Crea o modifica un movimento di cassa. L'importo arriva sempre come valore
// assoluto per spese e consegne (il server lo registra come uscita) e con il
// segno scelto per "altro".
export const saveCashMovement = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        locationId: z.string().uuid(),
        kind: kindSchema,
        amount: amountSchema,
        method: methodSchema,
        movedOn: dateSchema,
        description: noteSchema.pipe(z.string().min(1, "Scrivi una descrizione del movimento.")),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const values = {
      kind: data.kind,
      amount: signedMovementAmount(data.kind, data.amount),
      method: data.method,
      moved_on: data.movedOn,
      description: data.description,
    };

    if (!data.id) {
      const { data: inserted, error } = await supabase
        .from("cash_movements")
        .insert({ location_id: data.locationId, created_by: admin.userId, ...values })
        .select("id")
        .single();
      if (error || !inserted) return { ok: false, error: dbError(error?.message ?? "") };
      await audit(supabase, admin.userId, "create_cash_movement", "cash_movement", inserted.id, {
        location_id: data.locationId,
        ...values,
      });
      return { ok: true };
    }

    const { data: before } = await supabase
      .from("cash_movements")
      .select("id, location_id, kind, amount, method, moved_on, description, created_at")
      .eq("id", data.id)
      .eq("location_id", data.locationId)
      .maybeSingle<CashMovementRow>();
    if (!before) return { ok: false, error: "Movimento non trovato per questa sede." };

    const { error } = await supabase
      .from("cash_movements")
      .update(values)
      .eq("id", data.id)
      .eq("location_id", data.locationId);
    if (error) return { ok: false, error: dbError(error.message) };

    const previous = mapMovement(before);
    const changes = diff(
      {
        kind: previous.kind,
        amount: previous.amount,
        method: previous.method,
        moved_on: previous.movedOn,
        description: previous.description,
      },
      values,
    );
    if (Object.keys(changes).length > 0) {
      await audit(supabase, admin.userId, "update_cash_movement", "cash_movement", data.id, {
        location_id: data.locationId,
        changes,
      });
    }
    return { ok: true };
  });

export const deleteCashMovement = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), locationId: z.string().uuid() }).strict().parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const { data: before } = await supabase
      .from("cash_movements")
      .select("id, location_id, kind, amount, method, moved_on, description, created_at")
      .eq("id", data.id)
      .eq("location_id", data.locationId)
      .maybeSingle<CashMovementRow>();
    if (!before) return { ok: false, error: "Movimento non trovato per questa sede." };

    const { error } = await supabase
      .from("cash_movements")
      .delete()
      .eq("id", data.id)
      .eq("location_id", data.locationId);
    if (error) return { ok: false, error: dbError(error.message) };

    const removed = mapMovement(before);
    await audit(supabase, admin.userId, "delete_cash_movement", "cash_movement", data.id, {
      location_id: data.locationId,
      kind: removed.kind,
      amount: removed.amount,
      method: removed.method,
      moved_on: removed.movedOn,
      description: removed.description,
    });
    return { ok: true };
  });
