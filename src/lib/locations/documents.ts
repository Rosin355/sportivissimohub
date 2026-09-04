import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Documenti della sede (M10.2): helper client per upload/validazione. Il
// bucket "location-documents" è PRIVATO e accessibile direttamente solo
// all'admin; il pubblico scarica sempre tramite la server function.

export const LOCATION_DOCS_BUCKET = "location-documents";
export const LOCATION_DOC_MAX_BYTES = 10 * 1024 * 1024;
export const LOCATION_DOC_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export const LOCATION_DOC_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx";

export function validateLocationDocumentFile(file: File): string | null {
  if (!(LOCATION_DOC_MIME as readonly string[]).includes(file.type)) {
    return "Formato non valido: PDF, PNG, JPG, WebP, DOC o DOCX.";
  }
  if (file.size > LOCATION_DOC_MAX_BYTES) return "File troppo grande: massimo 10 MB.";
  if (file.size === 0) return "Il file è vuoto.";
  return null;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "documento";
}

export function locationDocumentPath(locationId: string, documentId: string, fileName: string) {
  return `${locationId}/${documentId}/${sanitizeFileName(fileName)}`;
}

// Upload diretto dall'admin (policy storage: solo admin). La riga in
// location_documents la crea poi la server function; se quella fallisce il
// file va rimosso con removeUploadedLocationDocument.
export async function uploadLocationDocumentFile(
  locationId: string,
  documentId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const invalid = validateLocationDocumentFile(file);
  if (invalid) return { ok: false, error: invalid };
  const path = locationDocumentPath(locationId, documentId, file.name);
  const { error } = await getSupabaseBrowserClient()
    .storage.from(LOCATION_DOCS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: "Caricamento del file non riuscito. Riprova." };
  return { ok: true, path };
}

export async function removeUploadedLocationDocument(path: string): Promise<void> {
  await getSupabaseBrowserClient().storage.from(LOCATION_DOCS_BUCKET).remove([path]);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
