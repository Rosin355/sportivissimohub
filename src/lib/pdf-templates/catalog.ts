// Catalogo dei moduli PDF: metadati senza dipendenze da pdf-lib, importabile
// anche dal client (pulsanti di download). I builder veri stanno in index.ts.

export const PDF_TEMPLATE_KEYS = [
  "tesseramento-acsi",
  "iscrizione",
  "tesseramento-acsi-originale",
  "iscrizione-originale",
] as const;

export type PdfTemplateKey = (typeof PDF_TEMPLATE_KEYS)[number];

// Sedi con il modulo cartaceo digitalizzato in assets/pdf-templates/.
export const ORIGINAL_FORM_SLUGS: readonly string[] = ["galzignano-terme"];

export function hasOriginalForm(locationSlug: string): boolean {
  return ORIGINAL_FORM_SLUGS.includes(locationSlug);
}

export type PdfTemplateInfo = {
  label: string;
  fileName: (code: string) => string;
  availableFor: (locationSlug: string) => boolean;
};

export const PDF_TEMPLATE_INFO: Record<PdfTemplateKey, PdfTemplateInfo> = {
  "tesseramento-acsi": {
    label: "Modulo tesseramento ACSI",
    fileName: (code) => `tesseramento-acsi-${code}.pdf`,
    availableFor: () => true,
  },
  iscrizione: {
    label: "Modulo iscrizione",
    fileName: (code) => `iscrizione-${code}.pdf`,
    availableFor: () => true,
  },
  // Pagina del modulo ACSI ufficiale (uguale per tutte le sedi) precompilata.
  "tesseramento-acsi-originale": {
    label: "Tesseramento ACSI su modulo originale",
    fileName: (code) => `tesseramento-acsi-originale-${code}.pdf`,
    availableFor: () => true,
  },
  // Modulo cartaceo completo della sede (regolamento + allergie + iscrizione + ACSI).
  "iscrizione-originale": {
    label: "Modulo cartaceo della sede precompilato",
    fileName: (code) => `modulo-originale-${code}.pdf`,
    availableFor: hasOriginalForm,
  },
};

export function pdfTemplatesForLocation(locationSlug: string): PdfTemplateKey[] {
  return PDF_TEMPLATE_KEYS.filter((k) => PDF_TEMPLATE_INFO[k].availableFor(locationSlug));
}
