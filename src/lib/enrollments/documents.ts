import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Location } from "@/data/locations";

// Vincoli replicati anche nel bucket (file_size_limit e allowed_mime_types
// nella migrazione M2): qui servono solo per dare un errore immediato.
export const DOC_ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
export const DOC_MAX_BYTES = 10 * 1024 * 1024;

export function validateDocumentFile(file: File): string | null {
  if (!DOC_ALLOWED_MIME.includes(file.type)) {
    return "Formato non valido: sono ammessi solo PDF, JPG o PNG.";
  }
  if (file.size > DOC_MAX_BYTES) {
    return "File troppo grande: massimo 10 MB.";
  }
  return null;
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export type UploadDocumentResult = { ok: true } | { ok: false; error: string };

// I requiredDocuments delle sedi (etichette marketing in locations.ts) vengono
// ricondotti ai doc_type canonici usati dal wizard e nel database.
export function requiredDocTypeFor(label: string): string {
  if (/genitore|identit/i.test(label)) return "Documento genitore";
  if (/tessera sanitaria/i.test(label)) return "Tessera sanitaria bambino/a";
  if (/certificato medico/i.test(label)) return "Certificato medico";
  return label;
}

export function requiredDocTypesForLocation(loc: Location): string[] {
  return [...new Set(loc.requiredDocuments.map(requiredDocTypeFor))];
}

// Upload nel bucket privato "documents" sotto {user_id}/{enrollment_id}/{doc_type}/
// (le policy storage accettano solo il percorso del proprietario) + riga in
// enrollment_documents. Se la riga fallisce, il file caricato viene rimosso.
export async function uploadEnrollmentDocument(opts: {
  userId: string;
  enrollmentId: string;
  docType: string;
  file: File;
}): Promise<UploadDocumentResult> {
  const invalid = validateDocumentFile(opts.file);
  if (invalid) return { ok: false, error: invalid };

  const supabase = getSupabaseBrowserClient();
  const path = `${opts.userId}/${opts.enrollmentId}/${sanitize(opts.docType)}/${Date.now()}-${sanitize(opts.file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, opts.file, { contentType: opts.file.type, upsert: false });
  if (uploadError) {
    return { ok: false, error: "Caricamento non riuscito. Controlla la connessione e riprova." };
  }

  const { error: rowError } = await supabase.from("enrollment_documents").insert({
    enrollment_id: opts.enrollmentId,
    doc_type: opts.docType,
    storage_path: path,
    file_name: opts.file.name,
    size_bytes: opts.file.size,
  });
  if (rowError) {
    await supabase.storage.from("documents").remove([path]);
    return { ok: false, error: "Salvataggio del documento non riuscito. Riprova." };
  }
  return { ok: true };
}

// Eliminazione (consentita dalle RLS solo al genitore e solo se il documento
// non è ancora stato verificato).
export async function deleteEnrollmentDocument(doc: {
  id: string;
  storagePath: string;
}): Promise<UploadDocumentResult> {
  const supabase = getSupabaseBrowserClient();
  const { error: rowError } = await supabase.from("enrollment_documents").delete().eq("id", doc.id);
  if (rowError) {
    return { ok: false, error: "Eliminazione non riuscita: il documento è già stato verificato?" };
  }
  await supabase.storage.from("documents").remove([doc.storagePath]);
  return { ok: true };
}
