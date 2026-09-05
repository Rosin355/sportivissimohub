import { PDFDocument } from "pdf-lib";
import type { Enrollment } from "@/data/enrollments";
import type { Location } from "@/data/locations";
import { answersForDisplay } from "@/lib/enrollments/custom-fields";
import { PdfBuilder } from "./layout";
import { ASSOCIAZIONE } from "./config";

// Appendice "Informazioni aggiuntive richieste dalla sede" nei PDF: solo se
// ci sono risposte. Etichette dal campo (anche se disattivato), code in
// mancanza del campo.

export function customAnswerRows(e: Enrollment, loc: Location | null | undefined) {
  return answersForDisplay(loc?.customFields ?? [], e.customAnswers);
}

export function writeCustomAnswersSection(
  pdf: PdfBuilder,
  rows: ReturnType<typeof customAnswerRows>,
) {
  if (rows.length === 0) return;
  pdf.section("Informazioni aggiuntive richieste dalla sede");
  for (const r of rows) pdf.kv(r.label, r.value);
}

// Per i moduli originali (overlay): pagina aggiuntiva in coda al PDF.
export async function appendCustomAnswersPage(
  bytes: Uint8Array,
  e: Enrollment,
  loc: Location | null | undefined,
): Promise<Uint8Array> {
  const rows = customAnswerRows(e, loc);
  if (rows.length === 0) return bytes;
  const appendix = await PdfBuilder.create();
  await appendix.header(
    "Informazioni aggiuntive richieste dalla sede",
    `Iscrizione ${e.code} — ${e.session.locationName}. Allegato al modulo originale.`,
    ASSOCIAZIONE.denominazione,
  );
  writeCustomAnswersSection(appendix, rows);
  const appendixDoc = await PDFDocument.load(await appendix.bytes());
  const main = await PDFDocument.load(bytes);
  const pages = await main.copyPages(appendixDoc, appendixDoc.getPageIndices());
  for (const p of pages) main.addPage(p);
  return main.save();
}
