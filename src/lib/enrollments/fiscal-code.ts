// Validazione completa del codice fiscale italiano, senza dipendenze:
// struttura (con omocodia) + carattere di controllo secondo l'algoritmo
// ufficiale (DM 23/12/1976). Usata sia client che server.

// Struttura: 6 lettere, 2 cifre anno (con omocodia LMNPQRSTUV), lettera mese
// (ABCDEHLMPRST), 2 cifre giorno (con omocodia), lettera + 3 cifre comune
// (con omocodia), carattere di controllo.
export const FISCAL_CODE_REGEX =
  /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i;

// Valori dei caratteri in posizione dispari (1ª, 3ª, … — 1-indexed)
const ODD_VALUES: Record<string, number> = {
  "0": 1,
  "1": 0,
  "2": 5,
  "3": 7,
  "4": 9,
  "5": 13,
  "6": 15,
  "7": 17,
  "8": 19,
  "9": 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23,
};

// Valori dei caratteri in posizione pari: cifre a valore nominale, lettere A=0…Z=25
function evenValue(ch: string): number {
  return ch >= "0" && ch <= "9" ? ch.charCodeAt(0) - 48 : ch.charCodeAt(0) - 65;
}

export function fiscalCodeCheckChar(first15: string): string {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = first15[i];
    // i è 0-indexed: i pari = posizione dispari 1-indexed
    sum += i % 2 === 0 ? ODD_VALUES[ch] : evenValue(ch);
  }
  return String.fromCharCode(65 + (sum % 26));
}

export function isValidFiscalCode(raw: string): boolean {
  const cf = raw.trim().toUpperCase();
  if (cf.length !== 16 || !FISCAL_CODE_REGEX.test(cf)) return false;
  return cf[15] === fiscalCodeCheckChar(cf.slice(0, 15));
}

// Sesso codificato nel CF: giorno di nascita (posizioni 10-11) + 40 per le
// donne. Le cifre possono essere sostituite da lettere in caso di omocodia.
const OMOCODIA_DIGITS: Record<string, string> = {
  L: "0",
  M: "1",
  N: "2",
  P: "3",
  Q: "4",
  R: "5",
  S: "6",
  T: "7",
  U: "8",
  V: "9",
};

export function sexFromFiscalCode(raw: string): "M" | "F" | null {
  const cf = raw.trim().toUpperCase();
  if (cf.length !== 16 || !FISCAL_CODE_REGEX.test(cf)) return null;
  const day = parseInt(
    cf
      .slice(9, 11)
      .split("")
      .map((ch) => OMOCODIA_DIGITS[ch] ?? ch)
      .join(""),
    10,
  );
  if (Number.isNaN(day)) return null;
  return day > 40 ? "F" : "M";
}

/* ---------- calcolo del CF (codice-fiscale-js, import dinamico) ---------- */

// Sigle delle province italiane per nome (l'utente spesso scrive "Venezia"
// nel campo provincia: la libreria vuole la sigla).
const PROVINCE_SIGLE: Record<string, string> = {
  agrigento: "AG",
  alessandria: "AL",
  ancona: "AN",
  aosta: "AO",
  arezzo: "AR",
  "ascoli piceno": "AP",
  asti: "AT",
  avellino: "AV",
  bari: "BA",
  "barletta andria trani": "BT",
  barletta: "BT",
  belluno: "BL",
  benevento: "BN",
  bergamo: "BG",
  biella: "BI",
  bologna: "BO",
  bolzano: "BZ",
  brescia: "BS",
  brindisi: "BR",
  cagliari: "CA",
  caltanissetta: "CL",
  campobasso: "CB",
  "carbonia iglesias": "CI",
  caserta: "CE",
  catania: "CT",
  catanzaro: "CZ",
  chieti: "CH",
  como: "CO",
  cosenza: "CS",
  cremona: "CR",
  crotone: "KR",
  cuneo: "CN",
  enna: "EN",
  fermo: "FM",
  ferrara: "FE",
  firenze: "FI",
  foggia: "FG",
  "forli cesena": "FC",
  forli: "FC",
  frosinone: "FR",
  genova: "GE",
  gorizia: "GO",
  grosseto: "GR",
  imperia: "IM",
  isernia: "IS",
  "la spezia": "SP",
  "l aquila": "AQ",
  aquila: "AQ",
  latina: "LT",
  lecce: "LE",
  lecco: "LC",
  livorno: "LI",
  lodi: "LO",
  lucca: "LU",
  macerata: "MC",
  mantova: "MN",
  "massa carrara": "MS",
  massa: "MS",
  matera: "MT",
  "medio campidano": "VS",
  messina: "ME",
  milano: "MI",
  modena: "MO",
  "monza e brianza": "MB",
  "monza e della brianza": "MB",
  monza: "MB",
  napoli: "NA",
  novara: "NO",
  nuoro: "NU",
  ogliastra: "OG",
  "olbia tempio": "OT",
  oristano: "OR",
  padova: "PD",
  palermo: "PA",
  parma: "PR",
  pavia: "PV",
  perugia: "PG",
  "pesaro e urbino": "PU",
  pesaro: "PU",
  pescara: "PE",
  piacenza: "PC",
  pisa: "PI",
  pistoia: "PT",
  pordenone: "PN",
  potenza: "PZ",
  prato: "PO",
  ragusa: "RG",
  ravenna: "RA",
  "reggio calabria": "RC",
  "reggio di calabria": "RC",
  "reggio emilia": "RE",
  "reggio nell emilia": "RE",
  rieti: "RI",
  rimini: "RN",
  roma: "RM",
  rovigo: "RO",
  salerno: "SA",
  sassari: "SS",
  savona: "SV",
  siena: "SI",
  siracusa: "SR",
  sondrio: "SO",
  "sud sardegna": "SU",
  taranto: "TA",
  teramo: "TE",
  terni: "TR",
  torino: "TO",
  trapani: "TP",
  trento: "TN",
  treviso: "TV",
  trieste: "TS",
  udine: "UD",
  varese: "VA",
  venezia: "VE",
  "verbano cusio ossola": "VB",
  verbania: "VB",
  vercelli: "VC",
  verona: "VR",
  "vibo valentia": "VV",
  vicenza: "VI",
  viterbo: "VT",
};

function plain(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`´\-.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// "Venezia" | "venezia" | "VE" | "ve" | "Venezia (VE)" -> "VE"; "" -> undefined
export function provinceSigla(input: string): string | undefined {
  const raw = input.trim();
  if (!raw) return undefined;
  const inParens = /\(([A-Za-z]{2})\)/.exec(raw);
  if (inParens) return inParens[1].toUpperCase();
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  return PROVINCE_SIGLE[plain(raw)];
}

function tidyComune(input: string): { comune: string; sigla?: string } {
  let comune = input.replace(/[’`´]/g, "'").replace(/\s+/g, " ").trim();
  let sigla: string | undefined;
  const m = /^(.*?)\s*\(([A-Za-z]{2})\)\s*$/.exec(comune);
  if (m) {
    comune = m[1].trim();
    sigla = m[2].toUpperCase();
  }
  return { comune, sigla };
}

export type ComputeCfInput = {
  firstName: string;
  lastName: string;
  sex: "M" | "F";
  birthDate: string; // yyyy-mm-dd
  comune: string;
  provincia: string;
};

export type ComputeCfResult =
  | { ok: true; fiscalCode: string; comune: string; provincia: string }
  | {
      ok: false;
      reason: "dati-mancanti" | "comune-ambiguo" | "comune-non-trovato" | "errore";
      message: string;
    };

const CF_HINT =
  "Puoi comunque inserire il codice fiscale a mano: lo trovi sulla tessera sanitaria.";

// Calcolo tollerante: maiuscole/accenti/spazi normalizzati, provincia come
// nome o sigla, "Comune (XX)", tentativo senza provincia se quella indicata
// non combacia. Non blocca mai l'iscrizione: in caso di dubbio dice perché.
export async function computeFiscalCode(input: ComputeCfInput): Promise<ComputeCfResult> {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.birthDate.trim());
  const { comune, sigla: siglaInName } = tidyComune(input.comune);
  if (!input.firstName.trim() || !input.lastName.trim() || !date || !comune) {
    return {
      ok: false,
      reason: "dati-mancanti",
      message:
        "Per calcolare il codice fiscale servono nome, cognome, data di nascita, sesso e comune di nascita.",
    };
  }
  const sigla = siglaInName ?? provinceSigla(input.provincia);
  const { default: CodiceFiscale } = await import("codice-fiscale-js");
  const base = {
    name: input.firstName.trim(),
    surname: input.lastName.trim(),
    gender: input.sex,
    day: parseInt(date[3], 10),
    month: parseInt(date[2], 10),
    year: parseInt(date[1], 10),
  };
  const attempts: Array<string | undefined> = sigla ? [sigla, undefined] : [undefined];
  let lastError = "";
  for (const prov of attempts) {
    try {
      const cf = CodiceFiscale.compute({ ...base, birthplace: comune, birthplaceProvincia: prov });
      // La libreria espone il comune riconosciuto (nome ufficiale e sigla).
      const info = CodiceFiscale.computeInverse(cf);
      return {
        ok: true,
        fiscalCode: cf.toUpperCase(),
        comune: info.birthplace || comune,
        provincia: info.birthplaceProvincia || prov || "",
      };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  if (/ambig|more than one|multiple|molti/i.test(lastError)) {
    return {
      ok: false,
      reason: "comune-ambiguo",
      message: `Esistono più comuni chiamati "${comune}": indica la sigla della provincia (es. VE). ${CF_HINT}`,
    };
  }
  if (/doesn't exist|not exist|not found/i.test(lastError)) {
    return {
      ok: false,
      reason: "comune-non-trovato",
      message: `Comune di nascita "${comune}" non riconosciuto: controlla il nome (accenti compresi, es. "San Donà di Piave") e la provincia. ${CF_HINT}`,
    };
  }
  return {
    ok: false,
    reason: "errore",
    message: `Calcolo del codice fiscale non riuscito. ${CF_HINT}`,
  };
}
