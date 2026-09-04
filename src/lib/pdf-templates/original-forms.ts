import type { Enrollment } from "@/data/enrollments";
import { loadGalzignano2026Template } from "./assets";
import { renderOverlay } from "./overlay/engine";
import { GALZIGNANO_2026, acsiMinorOps, galzignanoEnrollmentOps } from "./overlay/galzignano-2026";
import type { PdfBuildContext } from "./index";
import { appendCustomAnswersPage } from "./custom-answers";

// Modulo cartaceo completo della sede (4 pagine) con pagine 2, 3 e 4 precompilate.
export async function buildGalzignanoOriginalPdf(
  e: Enrollment,
  ctx: PdfBuildContext,
): Promise<Uint8Array> {
  const template = loadGalzignano2026Template();
  const bytes = await renderOverlay(template, [
    ...galzignanoEnrollmentOps(e, ctx.location),
    ...acsiMinorOps(e),
  ]);
  return appendCustomAnswersPage(bytes, e, ctx.location);
}

// Solo la pagina del modulo ACSI ufficiale, precompilata: vale per ogni sede.
export async function buildAcsiMinorOriginalPdf(e: Enrollment): Promise<Uint8Array> {
  const template = loadGalzignano2026Template();
  return renderOverlay(template, acsiMinorOps(e), { keepPages: [GALZIGNANO_2026.acsiPage] });
}
