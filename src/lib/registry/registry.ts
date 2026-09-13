import type { EnrollmentStatus, FrequencyBand, FrequencyCategory } from "@/lib/supabase/types";

// Registro sede (M11): tipi e calcoli puri, usati sia dal server (loader) sia
// dal browser (griglia). Nessun accesso al database qui dentro: gli importi
// arrivano SEMPRE da location_registry_totals, mai ricalcolati nel client.

export type RegistryCode = {
  id: string;
  code: string;
  label: string;
  category: FrequencyCategory;
  band: FrequencyBand;
  convenzione: boolean;
  price: number;
  active: boolean;
  sortOrder: number;
};

export type RegistryWeek = {
  code: string;
  number: number;
  label: string;
};

export type RegistryTotals = {
  weeksTotal: number;
  tessera: number;
  quota: number;
  gita: number;
  extraTotal: number;
  versato: number;
  saldo: number;
};

export const EMPTY_TOTALS: RegistryTotals = {
  weeksTotal: 0,
  tessera: 0,
  quota: 0,
  gita: 0,
  extraTotal: 0,
  versato: 0,
  saldo: 0,
};

export type RegistryRow = {
  enrollmentId: string;
  enrollmentCode: string;
  status: EnrollmentStatus;
  childName: string;
  childBirthDate: string;
  residente: boolean;
  timeSlot: string;
  // settimane scelte nell'iscrizione (enrollments.week_ids)
  weekIds: string[];
  // week_code -> frequency_code (cella compilata)
  cells: Record<string, string>;
  totals: RegistryTotals;
  adminNotes: string;
};

export type RegistryData = {
  locationSlug: string;
  locationName: string;
  locationId: string;
  weeks: RegistryWeek[];
  codes: RegistryCode[];
  rows: RegistryRow[];
};

/* ---------- etichette ---------- */

export const CATEGORY_LABELS: Record<FrequencyCategory, string> = {
  primaria: "Primaria",
  asilo: "Asilo",
};

export const BAND_LABELS: Record<FrequencyBand, string> = {
  mezza: "Mezza giornata",
  intera: "Giornata intera",
};

export function formatEuro(value: number): string {
  return value.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export const FREQUENCY_CATEGORIES: FrequencyCategory[] = ["primaria", "asilo"];
export const FREQUENCY_BANDS: FrequencyBand[] = ["mezza", "intera"];

// Gli 8 codici standard del foglio del cliente, ai prezzi Asigliano: sono gli
// stessi del seed della M11.1 e servono alle sedi create dopo, che il seed non
// ha raggiunto. Default modificabili, non valori di sistema.
export const STANDARD_FREQUENCY_CODES: Omit<RegistryCode, "id" | "active">[] = [
  {
    code: "MC",
    label: "Mezza giornata primaria — convenzione",
    category: "primaria",
    band: "mezza",
    convenzione: true,
    price: 30,
    sortOrder: 1,
  },
  {
    code: "IC",
    label: "Giornata intera primaria — convenzione",
    category: "primaria",
    band: "intera",
    convenzione: true,
    price: 60,
    sortOrder: 2,
  },
  {
    code: "M",
    label: "Mezza giornata primaria",
    category: "primaria",
    band: "mezza",
    convenzione: false,
    price: 55,
    sortOrder: 3,
  },
  {
    code: "I",
    label: "Giornata intera primaria",
    category: "primaria",
    band: "intera",
    convenzione: false,
    price: 90,
    sortOrder: 4,
  },
  {
    code: "AMC",
    label: "Mezza giornata asilo — convenzione",
    category: "asilo",
    band: "mezza",
    convenzione: true,
    price: 30,
    sortOrder: 5,
  },
  {
    code: "AIC",
    label: "Giornata intera asilo — convenzione",
    category: "asilo",
    band: "intera",
    convenzione: true,
    price: 60,
    sortOrder: 6,
  },
  {
    code: "AM",
    label: "Mezza giornata asilo",
    category: "asilo",
    band: "mezza",
    convenzione: false,
    price: 55,
    sortOrder: 7,
  },
  {
    code: "AI",
    label: "Giornata intera asilo",
    category: "asilo",
    band: "intera",
    convenzione: false,
    price: 90,
    sortOrder: 8,
  },
];

// Stesso formato del vincolo nel database: maiuscole e cifre, massimo 8.
export const FREQUENCY_CODE_PATTERN = /^[A-Z0-9]{1,8}$/;
export const MAX_FREQUENCY_PRICE = 10000;

/* ---------- celle ---------- */

// Settimane scelte nell'iscrizione che non hanno ancora un codice: sono le
// celle che l'admin deve compilare (il popolamento automatico salta le
// settimane non configurate nella sede, tipico delle sedi con dati provvisori).
export function missingWeekCodes(row: RegistryRow, weeks: RegistryWeek[]): string[] {
  const known = new Set(weeks.map((w) => w.code));
  return row.weekIds.filter((code) => known.has(code) && !row.cells[code]);
}

// Settimane dell'iscrizione che non esistono (più) tra quelle della sede:
// vanno segnalate, perché non hanno una colonna in griglia.
export function orphanWeekCodes(row: RegistryRow, weeks: RegistryWeek[]): string[] {
  const known = new Set(weeks.map((w) => w.code));
  return row.weekIds.filter((code) => !known.has(code));
}

export function codeByCode(codes: RegistryCode[]): Map<string, RegistryCode> {
  return new Map(codes.map((c) => [c.code, c]));
}

/* ---------- riepilogo (righe 78-93 del foglio del cliente) ---------- */

export type SummaryBucket = {
  category: FrequencyCategory;
  band: FrequencyBand;
  label: string;
  perWeek: Record<string, number>;
  total: number;
};

export type RegistrySummary = {
  buckets: SummaryBucket[];
  // "TOTALE INTERA (PASTI)": quanti bambini a giornata intera per settimana,
  // il numero che serve per ordinare i pasti.
  mealsPerWeek: Record<string, number>;
  mealsTotal: number;
  // celle compilate per settimana (bambini presenti quella settimana)
  childrenPerWeek: Record<string, number>;
  childrenTotal: number;
};

const BUCKET_ORDER: { category: FrequencyCategory; band: FrequencyBand }[] = [
  { category: "primaria", band: "mezza" },
  { category: "primaria", band: "intera" },
  { category: "asilo", band: "mezza" },
  { category: "asilo", band: "intera" },
];

export function summarizeRegistry(
  weeks: RegistryWeek[],
  codes: RegistryCode[],
  rows: RegistryRow[],
): RegistrySummary {
  const byCode = codeByCode(codes);
  const zero = (): Record<string, number> => Object.fromEntries(weeks.map((w) => [w.code, 0]));

  const buckets: SummaryBucket[] = BUCKET_ORDER.map((b) => ({
    ...b,
    label: `${BAND_LABELS[b.band]} ${CATEGORY_LABELS[b.category].toLowerCase()}`,
    perWeek: zero(),
    total: 0,
  }));
  const mealsPerWeek = zero();
  const childrenPerWeek = zero();
  let mealsTotal = 0;
  let childrenTotal = 0;

  for (const row of rows) {
    for (const week of weeks) {
      const cell = row.cells[week.code];
      if (!cell) continue;
      const code = byCode.get(cell);
      if (!code) continue;
      const bucket = buckets.find((b) => b.category === code.category && b.band === code.band);
      if (bucket) {
        bucket.perWeek[week.code] += 1;
        bucket.total += 1;
      }
      if (code.band === "intera") {
        mealsPerWeek[week.code] += 1;
        mealsTotal += 1;
      }
      childrenPerWeek[week.code] += 1;
      childrenTotal += 1;
    }
  }

  return { buckets, mealsPerWeek, mealsTotal, childrenPerWeek, childrenTotal };
}

/* ---------- totali di colonna ---------- */

export type RegistryGrandTotals = {
  quota: number;
  gita: number;
  versato: number;
  saldo: number;
};

export function grandTotals(rows: RegistryRow[]): RegistryGrandTotals {
  return rows.reduce<RegistryGrandTotals>(
    (acc, r) => ({
      quota: acc.quota + r.totals.quota,
      gita: acc.gita + r.totals.gita,
      versato: acc.versato + r.totals.versato,
      saldo: acc.saldo + r.totals.saldo,
    }),
    { quota: 0, gita: 0, versato: 0, saldo: 0 },
  );
}
