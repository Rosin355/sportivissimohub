import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SIGNATURE_CONSENT_TEXT } from "./signatures";

// Apposizione della firma: il PNG disegnato dal genitore viene salvato nel
// bucket privato "documents" sotto {parent_id}/{enrollment_id}/firme/ e la
// riga in enrollment_signatures conserva le evidenze. Il nome del firmatario
// è ricavato dai dati dell'iscrizione, non dal client. RLS: solo il genitore
// titolare dell'iscrizione (o l'admin per la lettura).

const MAX_PNG_BYTES = 400 * 1024;

function decodePng(dataUrl: string): Uint8Array | null {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  const bin = atob(m[1]);
  if (bin.length > MAX_PNG_BYTES || bin.length < 100) return null;
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  // firma PNG
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) return null;
  return bytes;
}

export type SaveSignatureResult = { ok: true; id: string } | { ok: false; error: string };

export const saveSignature = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        enrollmentId: z.string().uuid(),
        signerRole: z.enum(["genitore_1", "genitore_2"]),
        pngDataUrl: z.string().max(MAX_PNG_BYTES * 2),
        consentAccepted: z.literal(true),
        signedDocuments: z.array(z.string().trim().min(1)).max(10),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<SaveSignatureResult> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Devi accedere per firmare." };

    const png = decodePng(data.pngDataUrl);
    if (!png) return { ok: false, error: "Firma non valida: riprova a disegnarla." };

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, parent_id, secondary_guardian, profiles ( first_name, last_name )")
      .eq("id", data.enrollmentId)
      .maybeSingle<{
        id: string;
        parent_id: string;
        secondary_guardian: { firstName?: string; lastName?: string } | null;
        profiles: { first_name: string; last_name: string } | null;
      }>();
    if (!enrollment) return { ok: false, error: "Iscrizione non trovata o non accessibile." };
    if (enrollment.parent_id !== user.id) {
      return { ok: false, error: "Solo il titolare dell'iscrizione può firmare." };
    }

    let signerName: string;
    if (data.signerRole === "genitore_1") {
      signerName =
        `${enrollment.profiles?.first_name ?? ""} ${enrollment.profiles?.last_name ?? ""}`.trim();
    } else {
      const sg = enrollment.secondary_guardian;
      if (!sg) {
        return { ok: false, error: "Questa iscrizione non ha un secondo genitore da far firmare." };
      }
      signerName = `${sg.firstName ?? ""} ${sg.lastName ?? ""}`.trim();
    }
    if (!signerName) return { ok: false, error: "Nome del firmatario mancante nell'iscrizione." };

    const path = `${user.id}/${enrollment.id}/firme/${data.signerRole}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, png, { contentType: "image/png", upsert: false });
    if (uploadError) {
      console.error("Upload firma:", uploadError.message);
      return { ok: false, error: "Salvataggio della firma non riuscito. Riprova." };
    }

    const { data: inserted, error } = await supabase
      .from("enrollment_signatures")
      .insert({
        enrollment_id: enrollment.id,
        signer_role: data.signerRole,
        signer_name: signerName,
        user_id: user.id,
        storage_path: path,
        consent_text: SIGNATURE_CONSENT_TEXT,
        signed_documents: data.signedDocuments,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      console.error("Insert firma:", error?.message);
      return { ok: false, error: "Registrazione della firma non riuscita. Riprova." };
    }

    // La voce di audit la scrive la funzione security definer (audit_log è
    // chiuso ai client): registra solo 'firma_apposta' con i dati della riga
    // appena inserita, verificati lato database.
    const { error: auditError } = await supabase.rpc("log_enrollment_signature", {
      _signature_id: inserted.id,
    });
    if (auditError) console.error("Audit firma:", auditError.message);
    return { ok: true, id: inserted.id };
  });
