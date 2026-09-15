import type { CashMovementKind, ExtraChargeType, PaymentMethod } from "@/lib/supabase/types";
import type { RegistryTotals } from "./registry";

// Pagamenti e cassa di sede (M11.3): tipi e calcoli puri, usati da server e
// browser. Il saldo delle iscrizioni NON si calcola qui: arriva sempre da
// location_registry_totals. Qui si sommano solo i movimenti già letti dal
// database per mostrare la cassa (totali per metodo in un periodo).

export type RegistryPayment = {
  id: string;
  enrollmentId: string;
  amount: number; // negativo = rimborso
  method: PaymentMethod;
  paidOn: string; // yyyy-mm-dd
  note: string;
  createdAt: string;
};

export type RegistryExtraCharge = {
  id: string;
  enrollmentId: string;
  chargeType: ExtraChargeType;
  description: string;
  amount: number;
  createdAt: string;
};

export type EnrollmentLedger = {
  enrollmentId: string;
  enrollmentCode: string;
  childName: string;
  locationSlug: string;
  payments: RegistryPayment[];
  extraCharges: RegistryExtraCharge[];
  totals: RegistryTotals;
};

export type CashMovement = {
  id: string;
  locationId: string;
  kind: CashMovementKind;
  amount: number; // firmato rispetto alla cassa: negativo = uscita
  method: PaymentMethod;
  movedOn: string;
  description: string;
  createdAt: string;
};

// Una riga dell'elenco movimenti della cassa: rata/rimborso di un bambino
// oppure movimento di cassa della sede.
export type CashEntry =
  | {
      source: "payment";
      id: string;
      date: string;
      method: PaymentMethod;
      amount: number;
      enrollmentId: string;
      enrollmentCode: string;
      childName: string;
      note: string;
    }
  | {
      source: "movement";
      id: string;
      date: string;
      method: PaymentMethod;
      amount: number;
      kind: CashMovementKind;
      description: string;
    };

export type CashBook = {
  locationId: string;
  locationSlug: string;
  locationName: string;
  from: string | null;
  to: string | null;
  entries: CashEntry[];
  // calcolato dal server sui movimenti del periodo
  summary: CashSummary;
};

/* ---------- etichette ---------- */

export const PAYMENT_METHODS: PaymentMethod[] = ["bonifico", "contanti"];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bonifico: "Bonifico",
  contanti: "Contanti",
};

export const CASH_MOVEMENT_KINDS: CashMovementKind[] = ["spesa", "consegna", "altro"];
export const CASH_MOVEMENT_KIND_LABELS: Record<CashMovementKind, string> = {
  spesa: "Spesa",
  consegna: "Consegna contanti",
  altro: "Altro movimento",
};

export const EXTRA_CHARGE_TYPES: ExtraChargeType[] = ["gita", "altro"];
export const EXTRA_CHARGE_TYPE_LABELS: Record<ExtraChargeType, string> = {
  gita: "Gita",
  altro: "Altro addebito",
};

export const MAX_AMOUNT = 100000;

export function paymentLabel(amount: number): string {
  return amount < 0 ? "Rimborso" : "Rata";
}

export function entryLabel(entry: CashEntry): string {
  return entry.source === "payment"
    ? paymentLabel(entry.amount)
    : CASH_MOVEMENT_KIND_LABELS[entry.kind];
}

/* ---------- importi e date ---------- */

// Importo all'italiana: virgola o punto, due decimali, segno meno ammesso solo
// se richiesto (rimborsi, movimenti "altro"). Zero non è mai un importo valido.
export function parseAmount(text: string, opts: { allowNegative: boolean }): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  const pattern = opts.allowNegative ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/;
  if (!pattern.test(normalized)) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n === 0 || Math.abs(n) > MAX_AMOUNT) return null;
  return n;
}

export function amountText(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function formatDay(iso: string): string {
  if (!isIsoDate(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// Estremi inclusi; un estremo assente non limita.
export function inPeriod(date: string, from: string | null, to: string | null): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

// Uscite di cassa: spese e consegne sono sempre negative, "altro" mantiene il
// segno scelto. Usato sia per mostrare l'anteprima sia dal server.
export function signedMovementAmount(kind: CashMovementKind, amount: number): number {
  return kind === "altro" ? amount : -Math.abs(amount);
}

/* ---------- riepilogo di cassa ---------- */

export type MethodSummary = {
  method: PaymentMethod;
  incassi: number; // rate positive
  rimborsi: number; // rate negative (valore negativo)
  movimenti: number; // spese, consegne, altro (con segno)
  netto: number; // incassi + rimborsi + movimenti
};

export type CashSummary = {
  byMethod: Record<PaymentMethod, MethodSummary>;
  incassi: number;
  rimborsi: number;
  movimenti: number;
  netto: number;
  count: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function summarizeCash(entries: CashEntry[]): CashSummary {
  const byMethod = Object.fromEntries(
    PAYMENT_METHODS.map((m) => [m, { method: m, incassi: 0, rimborsi: 0, movimenti: 0, netto: 0 }]),
  ) as Record<PaymentMethod, MethodSummary>;

  for (const e of entries) {
    const bucket = byMethod[e.method];
    if (e.source === "payment") {
      if (e.amount >= 0) bucket.incassi += e.amount;
      else bucket.rimborsi += e.amount;
    } else {
      bucket.movimenti += e.amount;
    }
  }

  let incassi = 0;
  let rimborsi = 0;
  let movimenti = 0;
  for (const m of PAYMENT_METHODS) {
    const b = byMethod[m];
    b.incassi = round2(b.incassi);
    b.rimborsi = round2(b.rimborsi);
    b.movimenti = round2(b.movimenti);
    b.netto = round2(b.incassi + b.rimborsi + b.movimenti);
    incassi += b.incassi;
    rimborsi += b.rimborsi;
    movimenti += b.movimenti;
  }

  return {
    byMethod,
    incassi: round2(incassi),
    rimborsi: round2(rimborsi),
    movimenti: round2(movimenti),
    netto: round2(incassi + rimborsi + movimenti),
    count: entries.length,
  };
}

// Più recenti prima; a parità di giorno le rate prima dei movimenti.
export function sortEntries(entries: CashEntry[]): CashEntry[] {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    if (a.source !== b.source) return a.source === "payment" ? -1 : 1;
    return 0;
  });
}
