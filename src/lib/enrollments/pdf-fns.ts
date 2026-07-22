import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ENROLLMENT_SELECT, mapEnrollmentRow, type EnrollmentJoinedRow } from "@/data/enrollments";
import { PDF_TEMPLATES } from "@/lib/pdf-templates";

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

// Genera on-demand il PDF richiesto. L'autorizzazione è demandata alle RLS:
// la query restituisce l'iscrizione solo al genitore proprietario o all'admin.
// Il PDF non viene salvato nel bucket: i dati vivono nel DB, il PDF è una vista.
export const generateEnrollmentPdf = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        enrollmentId: z.string().uuid(),
        template: z.enum(["tesseramento-acsi", "iscrizione"]),
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

    const template = PDF_TEMPLATES[data.template];
    try {
      const enrollment = mapEnrollmentRow(row);
      const bytes = await template.build(enrollment);
      return { ok: true, fileName: template.fileName(enrollment), base64: toBase64(bytes) };
    } catch (e) {
      console.error("Errore generazione PDF:", e);
      return { ok: false, error: "Generazione del PDF non riuscita. Riprova." };
    }
  });
