import type { Enrollment } from "@/data/enrollments";
import { buildAcsiMembershipPdf } from "./acsi-membership";
import { buildCampEnrollmentPdf } from "./camp-enrollment";

// Registro dei moduli PDF: ogni documento è una funzione (dati tipizzati → PDF).
// Per aggiungere un modulo basta una nuova entry.
export type PdfTemplateKey = "tesseramento-acsi" | "iscrizione";

export const PDF_TEMPLATES: Record<
  PdfTemplateKey,
  {
    label: string;
    fileName: (e: Enrollment) => string;
    build: (e: Enrollment) => Promise<Uint8Array>;
  }
> = {
  "tesseramento-acsi": {
    label: "Modulo tesseramento ACSI",
    fileName: (e) => `tesseramento-acsi-${e.code}.pdf`,
    build: buildAcsiMembershipPdf,
  },
  iscrizione: {
    label: "Modulo iscrizione centro estivo",
    fileName: (e) => `iscrizione-${e.code}.pdf`,
    build: buildCampEnrollmentPdf,
  },
};
