import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, LocationDocumentCategory } from "@/lib/supabase/types";
import {
  LOCATION_DOCS_BUCKET,
  LOCATION_DOC_MAX_BYTES,
  LOCATION_DOC_MIME,
  locationDocumentPath,
} from "./documents";

// Server function dei documenti sede. Le scritture si appoggiano alle RLS
// (solo admin); il download passa sempre da getLocationDocumentUrl, che
// firma l'URL con la sessione del chiamante: le policy storage del bucket
// privato ripetono le stesse condizioni (pubblico + sede pubblicata + non
// template; staff sui non template; admin tutto). Nessuna service key.

const CATEGORIES = ["regolamento", "modulo", "informativa", "template_overlay"] as const;

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

async function currentRoles(
  supabase: ReturnType<typeof getSupabaseServerClient>,
): Promise<{ userId: string | null; roles: AppRole[] }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, roles: [] };
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return { userId: user.id, roles: (data ?? []).map((r) => r.role) };
}

function dbError(message: string): string {
  if (/row-level security|permission denied/i.test(message)) {
    return "Operazione non consentita: serve il ruolo admin.";
  }
  if (/location_documents_mime/i.test(message)) return "Formato del file non ammesso.";
  if (/location_documents_size/i.test(message)) return "File troppo grande: massimo 10 MB.";
  console.error("location_documents:", message);
  return "Operazione non riuscita. Riprova.";
}

// Registra la riga dopo che l'admin ha caricato il file nel bucket.
export const createLocationDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        locationId: z.string().uuid(),
        category: z.enum(CATEGORIES),
        title: z.string().trim().min(1, "Inserisci un titolo.").max(120),
        isPublic: z.boolean(),
        fileName: z.string().trim().min(1).max(200),
        sizeBytes: z.number().int().min(1).max(LOCATION_DOC_MAX_BYTES),
        mimeType: z.enum(LOCATION_DOC_MIME),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result<{ id: string }>> => {
    const supabase = getSupabaseServerClient();
    const { userId } = await currentRoles(supabase);
    if (!userId) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };

    // Il percorso è deterministico: {location}/{id}/{nome}. I template di
    // lavoro non sono mai pubblici, qualunque cosa dica il flag.
    const storagePath = locationDocumentPath(data.locationId, data.id, data.fileName);
    const isPublic = data.category === "template_overlay" ? false : data.isPublic;

    const { data: last } = await supabase
      .from("location_documents")
      .select("sort_order")
      .eq("location_id", data.locationId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("location_documents").insert({
      id: data.id,
      location_id: data.locationId,
      category: data.category,
      title: data.title,
      storage_path: storagePath,
      file_name: data.fileName,
      size_bytes: data.sizeBytes,
      mime_type: data.mimeType,
      is_public: isPublic,
      sort_order: (last?.sort_order ?? -1) + 1,
    });
    if (error) return { ok: false, error: dbError(error.message) };

    await supabase.from("audit_log").insert({
      actor_id: userId,
      action: "create_location_document",
      entity: "location_document",
      entity_id: data.id,
      detail: { location_id: data.locationId, category: data.category, is_public: isPublic },
    });
    return { ok: true, id: data.id };
  });

export const updateLocationDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(120).optional(),
        category: z.enum(CATEGORIES).optional(),
        isPublic: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const { userId } = await currentRoles(supabase);
    if (!userId) return { ok: false, error: "Sessione scaduta: accedi di nuovo." };
    const patch: { title?: string; category?: LocationDocumentCategory; is_public?: boolean } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.category !== undefined) patch.category = data.category;
    if (data.isPublic !== undefined) patch.is_public = data.isPublic;
    if (data.category === "template_overlay") patch.is_public = false;
    const { error } = await supabase.from("location_documents").update(patch).eq("id", data.id);
    if (error) return { ok: false, error: dbError(error.message) };
    await supabase.from("audit_log").insert({
      actor_id: userId,
      action: "update_location_document",
      entity: "location_document",
      entity_id: data.id,
      detail: patch,
    });
    return { ok: true };
  });

export const reorderLocationDocuments = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ locationId: z.string().uuid(), orderedIds: z.array(z.string().uuid()).max(200) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    for (let i = 0; i < data.orderedIds.length; i++) {
      const { error } = await supabase
        .from("location_documents")
        .update({ sort_order: i })
        .eq("id", data.orderedIds[i])
        .eq("location_id", data.locationId);
      if (error) return { ok: false, error: dbError(error.message) };
    }
    return { ok: true };
  });

// Elimina file e riga nella stessa operazione: prima il file (se fallisce ci
// si ferma, così non restano orfani nel bucket), poi la riga.
export const deleteLocationDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const { userId, roles } = await currentRoles(supabase);
    if (!userId || !roles.includes("admin")) {
      return { ok: false, error: "Operazione non consentita: serve il ruolo admin." };
    }
    const { data: doc } = await supabase
      .from("location_documents")
      .select("id, storage_path, location_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) return { ok: false, error: "Documento non trovato." };

    const { error: storageError } = await supabase.storage
      .from(LOCATION_DOCS_BUCKET)
      .remove([doc.storage_path]);
    if (storageError) {
      return {
        ok: false,
        error: `File non rimosso dallo storage (${storageError.message}): il documento non è stato eliminato. Riprova.`,
      };
    }
    const { error } = await supabase.from("location_documents").delete().eq("id", doc.id);
    if (error) {
      return {
        ok: false,
        error: "File rimosso ma riga non eliminata: riprova l'eliminazione per completare.",
      };
    }
    await supabase.from("audit_log").insert({
      actor_id: userId,
      action: "delete_location_document",
      entity: "location_document",
      entity_id: doc.id,
      detail: { location_id: doc.location_id, storage_path: doc.storage_path },
    });
    return { ok: true };
  });

// Download: primo filtro applicativo. Pubblico (anche anonimo) solo se il
// documento è pubblico, la sede è pubblicata e non è un template_overlay;
// altrimenti admin, o staff in sola lettura (mai i template). L'URL firmato
// viene creato con la sessione corrente (anche anonima): se le policy storage
// non ammettono la lettura, la firma fallisce.
export const getLocationDocumentUrl = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<Result<{ url: string; fileName: string }>> => {
    const supabase = getSupabaseServerClient();
    const { roles } = await currentRoles(supabase);
    const isAdmin = roles.includes("admin");
    const isStaff = roles.includes("staff");

    // Le RLS filtrano già per il chiamante (pubblico: solo pubblici di sedi
    // pubblicate); le condizioni vengono comunque ricontrollate qui.
    const { data: doc } = await supabase
      .from("location_documents")
      .select("id, storage_path, file_name, category, is_public, locations!inner ( status )")
      .eq("id", data.id)
      .maybeSingle<{
        id: string;
        storage_path: string;
        file_name: string;
        category: LocationDocumentCategory;
        is_public: boolean;
        locations: { status: string } | null;
      }>();
    if (!doc) return { ok: false, error: "Documento non trovato o non accessibile." };

    const published = doc.locations?.status === "pubblicata";
    const publicOk = doc.is_public && published && doc.category !== "template_overlay";
    const allowed = isAdmin || publicOk || (isStaff && doc.category !== "template_overlay");
    if (!allowed) return { ok: false, error: "Documento non accessibile." };

    const { data: signed, error } = await supabase.storage
      .from(LOCATION_DOCS_BUCKET)
      .createSignedUrl(doc.storage_path, 60, { download: doc.file_name });
    if (error || !signed) {
      console.error("getLocationDocumentUrl:", error?.message);
      return { ok: false, error: "Impossibile generare il link di download. Riprova." };
    }
    return { ok: true, url: signed.signedUrl, fileName: doc.file_name };
  });
