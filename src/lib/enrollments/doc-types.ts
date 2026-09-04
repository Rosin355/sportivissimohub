// Tipi di documento: UNICO punto condiviso tra wizard, area genitori, admin,
// pagina pubblica della sede e database (enrollment_documents.doc_type,
// locations.required_documents). Il matching avviene sempre per codice
// stabile; le etichette servono solo per la visualizzazione.
//
// Le righe scritte prima di questo modulo contengono etichette ("Documento
// genitore", "Tessera sanitaria bambino/a"…): normalizeDocType le riconduce al
// codice in lettura, quindi non serve una migrazione di riallineamento.

export const DOC_TYPE_CATALOG = [
  { code: "documento-genitore", label: "Documento d'identità del genitore" },
  { code: "tessera-sanitaria", label: "Tessera sanitaria del bambino/a" },
  { code: "certificato-medico", label: "Certificato medico" },
  { code: "modulo-deleghe", label: "Modulo deleghe firmato" },
  { code: "altro", label: "Altro documento" },
] as const;

export type DocTypeCode = (typeof DOC_TYPE_CATALOG)[number]["code"];

export const OTHER_DOC_TYPE: DocTypeCode = "altro";

const CODES = new Set<string>(DOC_TYPE_CATALOG.map((d) => d.code));

// Etichette legacy (e varianti scritte dall'admin) -> codice stabile.
const LEGACY_PATTERNS: Array<[RegExp, DocTypeCode]> = [
  [/genitore|identit/i, "documento-genitore"],
  [/tessera\s*sanitaria/i, "tessera-sanitaria"],
  [/certificato\s*medico/i, "certificato-medico"],
  [/deleg/i, "modulo-deleghe"],
  [/^altro\b/i, "altro"],
];

export function normalizeDocType(value: string): string {
  const v = value.trim();
  if (CODES.has(v)) return v;
  for (const [re, code] of LEGACY_PATTERNS) if (re.test(v)) return code;
  return v; // tipo personalizzato: il valore stesso fa da codice
}

export function docTypeLabel(code: string): string {
  const found = DOC_TYPE_CATALOG.find((d) => d.code === code);
  return found ? found.label : code;
}

// Voci proponibili all'admin come "documenti richiesti" (tutte tranne "altro").
export const REQUIRED_DOC_TYPE_OPTIONS = DOC_TYPE_CATALOG.filter((d) => d.code !== "altro");
