import type { getSupabaseServerClient } from "@/lib/supabase/server";
import { EMPTY_TOTALS, type RegistryTotals } from "./registry";

// Helper condivisi dalle server function del registro sede (M11). Da usare
// solo dentro gli handler: il browser non li vede.

export type ServerSupabase = ReturnType<typeof getSupabaseServerClient>;

export type TotalsRow = {
  enrollment_id: string;
  weeks_total: number | string;
  tessera: number | string;
  quota: number | string;
  gita: number | string;
  extra_total: number | string;
  versato: number | string;
  saldo: number | string;
};

// Postgres restituisce i numeric come stringhe o numeri a seconda del tipo.
export function num(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function mapTotalsRow(row: TotalsRow): RegistryTotals {
  return {
    weeksTotal: num(row.weeks_total),
    tessera: num(row.tessera),
    quota: num(row.quota),
    gita: num(row.gita),
    extraTotal: num(row.extra_total),
    versato: num(row.versato),
    saldo: num(row.saldo),
  };
}

// Pagamenti, quote e saldi sono dati del solo admin. Le RLS lo garantiscono
// già (scrittura solo admin, lettura delle rate solo admin o genitore titolare,
// totali riservati all'admin): questo controllo in più evita che un altro
// ruolo ottenga anche solo una vista parziale da queste funzioni.
export async function requireAdmin(
  supabase: ServerSupabase,
): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (!(data ?? []).some((r) => r.role === "admin")) {
    return { ok: false, error: "Operazione non consentita: serve il ruolo admin." };
  }
  return { ok: true, userId: user.id };
}

// Totali aggiornati di una sola iscrizione, sempre dalla funzione del database.
export async function fetchEnrollmentTotals(
  supabase: ServerSupabase,
  locationSlug: string,
  enrollmentId: string,
): Promise<RegistryTotals> {
  const { data, error } = await supabase.rpc("location_registry_totals", {
    _location_slug: locationSlug,
  });
  if (error) {
    console.error("location_registry_totals:", error.message);
    return EMPTY_TOTALS;
  }
  const row = ((data ?? []) as TotalsRow[]).find((r) => r.enrollment_id === enrollmentId);
  return row ? mapTotalsRow(row) : EMPTY_TOTALS;
}
