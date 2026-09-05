import type { Enrollment } from "@/data/enrollments";
import type { Location } from "@/data/locations";
import { buildAcsiMembershipPdf } from "./acsi-membership";
import { buildCampEnrollmentPdf } from "./camp-enrollment";
import { buildAcsiMinorOriginalPdf, buildGalzignanoOriginalPdf } from "./original-forms";
import { PDF_TEMPLATE_INFO, type PdfTemplateKey } from "./catalog";

export { PDF_TEMPLATE_KEYS, PDF_TEMPLATE_INFO, pdfTemplatesForLocation } from "./catalog";
export type { PdfTemplateKey } from "./catalog";

// Registro dei moduli PDF: ogni documento è una funzione (dati tipizzati → PDF).
// Due famiglie: PDF puliti generati da zero (layout.ts) e overlay sui moduli
// cartacei originali (overlay/). I metadati (etichette, nomi file,
// disponibilità per sede) stanno in catalog.ts, importabile dal client.
import type { LogoImage } from "./layout";

// Contesto passato ai builder: la sede dell'iscrizione (dal DB) e il logo del
// comune scaricato dal bucket location-logos (null se assente o non PNG/JPEG).
export type PdfBuildContext = { location: Location | null; comuneLogo: LogoImage | null };

export const PDF_TEMPLATES: Record<
  PdfTemplateKey,
  { build: (e: Enrollment, ctx: PdfBuildContext) => Promise<Uint8Array> }
> = {
  "tesseramento-acsi": { build: buildAcsiMembershipPdf },
  iscrizione: { build: buildCampEnrollmentPdf },
  "tesseramento-acsi-originale": { build: buildAcsiMinorOriginalPdf },
  "iscrizione-originale": { build: buildGalzignanoOriginalPdf },
};

export function pdfFileName(key: PdfTemplateKey, e: Enrollment): string {
  return PDF_TEMPLATE_INFO[key].fileName(e.code);
}
