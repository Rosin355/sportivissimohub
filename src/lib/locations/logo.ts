import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { LOGO_BUCKET } from "./queries";

// Logo del comune: bucket PRIVATO "location-logos" (Lovable Cloud blocca i
// bucket pubblici), percorso {location_id}/… Upload solo admin (policy
// storage); la lettura passa sempre da URL firmati.
export const LOGO_ALLOWED_MIME = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export function validateLogoFile(file: File): string | null {
  if (!LOGO_ALLOWED_MIME.includes(file.type)) return "Formato non valido: PNG, JPG, SVG o WebP.";
  if (file.size > LOGO_MAX_BYTES) return "File troppo grande: massimo 2 MB.";
  return null;
}

export async function uploadLocationLogo(
  locationId: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const invalid = validateLogoFile(file);
  if (invalid) return { ok: false, error: invalid };
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${locationId}/${Date.now()}-${safeName}`;
  const { error } = await getSupabaseBrowserClient()
    .storage.from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: "Caricamento del logo non riuscito. Riprova." };
  return { ok: true, path };
}

// Anteprima nell'editor subito dopo l'upload (l'admin ha la select sul bucket).
export async function signLogoUrl(path: string, ttlSeconds = 3600): Promise<string | null> {
  const { data, error } = await getSupabaseBrowserClient()
    .storage.from(LOGO_BUCKET)
    .createSignedUrl(path, ttlSeconds);
  return error || !data ? null : data.signedUrl;
}

export async function removeLocationLogo(path: string): Promise<void> {
  await getSupabaseBrowserClient().storage.from(LOGO_BUCKET).remove([path]);
}
