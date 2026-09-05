import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ENROLLMENT_SELECT, mapEnrollmentRow, type EnrollmentJoinedRow } from "@/data/enrollments";
import { PDF_TEMPLATES, pdfFileName } from "@/lib/pdf-templates";
import { PDF_TEMPLATE_INFO, PDF_TEMPLATE_KEYS } from "@/lib/pdf-templates/catalog";
import { fetchLocationBySlug, LOGO_BUCKET } from "@/lib/locations/queries";
import type { LogoImage } from "@/lib/pdf-templates/layout";
import type { Location } from "@/data/locations";

export type GeneratePdfResult =
  | { ok: true; fileName: string; base64: string }
  | { ok: false; error: string };

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Logo del comune per l'intestazione dei PDF puliti: scaricato dal bucket
// privato con la sessione corrente (la policy ammette la lettura a tutti).
// Solo PNG/JPEG: pdf-lib non incorpora SVG o WebP.
async function loadComuneLogo(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  location: Location | null,
): Promise<LogoImage | null> {
  if (!location?.logoPath) return null;
  try {
    const { data, error } = await supabase.storage.from(LOGO_BUCKET).download(location.logoPath);
    if (error || !data) return null;
    const ext = location.logoPath.toLowerCase();
    const mime =
      data.type === "image/png" || ext.endsWith(".png")
        ? "image/png"
        : data.type === "image/jpeg" || /\.jpe?g$/.test(ext)
          ? "image/jpeg"
          : null;
    if (!mime) return null;
    return { bytes: new Uint8Array(await data.arrayBuffer()), mime };
  } catch (e) {
    console.error("Logo comune non scaricato:", e);
    return null;
  }
}

// Genera on-demand il PDF richiesto. L'autorizzazione è demandata alle RLS:
// la query restituisce l'iscrizione solo al genitore proprietario o all'admin.
// Il PDF non viene salvato nel bucket: i dati vivono nel DB, il PDF è una vista.
export const generateEnrollmentPdf = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        enrollmentId: z.string().uuid(),
        template: z.enum(PDF_TEMPLATE_KEYS),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<GeneratePdfResult> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Devi accedere per scaricare i moduli." };

    const { data: row, error } = await supabase
      .from("enrollments")
      .select(ENROLLMENT_SELECT)
      .eq("id", data.enrollmentId)
      .maybeSingle<EnrollmentJoinedRow>();
    if (error || !row) {
      return { ok: false, error: "Iscrizione non trovata o non accessibile." };
    }

    if (!PDF_TEMPLATE_INFO[data.template].availableFor(row.location_slug)) {
      return { ok: false, error: "Questo modulo non è disponibile per la sede dell'iscrizione." };
    }

    const template = PDF_TEMPLATES[data.template];
    try {
      const location = await fetchLocationBySlug(supabase, row.location_slug);
      const enrollment = mapEnrollmentRow(row, location ?? undefined);
      const comuneLogo = await loadComuneLogo(supabase, location);
      const bytes = await template.build(enrollment, { location, comuneLogo });
      return {
        ok: true,
        fileName: pdfFileName(data.template, enrollment),
        base64: toBase64(bytes),
      };
    } catch (e) {
      console.error("Errore generazione PDF:", e);
      return { ok: false, error: "Generazione del PDF non riuscita. Riprova." };
    }
  });
