import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, type ServerSupabase } from "@/lib/registry/registry-server";
import { canDelete, deletionDbError, type DeletionPreview } from "@/lib/admin/deletion";
import { LOCATION_DOCS_BUCKET } from "./documents";
import { LOGO_BUCKET } from "./queries";

// Ciclo di vita di una sede (M11.3b). Una sede con storico si archivia: torna
// in bozza (quindi sparisce da sito, wizard e area staff) e riceve la data di
// archiviazione; il database impedisce di pubblicarla finché resta archiviata.
// L'eliminazione definitiva è ammessa solo senza iscrizioni né storico di
// cassa e presenze, e la ricontrolla il trigger di guardia nel database.

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const idSchema = z.object({ id: z.string().uuid() }).strict();

function dbError(message: string): string {
  const known = deletionDbError(message);
  if (known) return known;
  console.error("ciclo di vita sede:", message);
  return "Operazione non riuscita. Riprova.";
}

async function audit(
  supabase: ServerSupabase,
  actorId: string,
  action: string,
  locationId: string,
  detail: Record<string, unknown>,
) {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: actorId,
    action,
    entity: "location",
    entity_id: locationId,
    detail: JSON.parse(JSON.stringify(detail)),
  });
  if (error) console.error("audit sede:", error.message);
}

async function loadLocation(supabase: ServerSupabase, id: string) {
  const { data } = await supabase
    .from("locations")
    .select("id, slug, name, status, archived_at, logo_path")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      slug: string;
      name: string;
      status: "bozza" | "pubblicata";
      archived_at: string | null;
      logo_path: string | null;
    }>();
  return data;
}

async function count(query: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count: n } = await query;
  return n ?? 0;
}

export const archiveLocation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const location = await loadLocation(supabase, data.id);
    if (!location) return { ok: false, error: "Sede non trovata." };
    if (location.archived_at) return { ok: true };

    const { error } = await supabase
      .from("locations")
      .update({ status: "bozza", archived_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) return { ok: false, error: dbError(error.message) };

    await audit(supabase, admin.userId, "archive_location", data.id, {
      slug: location.slug,
      name: location.name,
      previous_status: location.status,
    });
    return { ok: true };
  });

// Il ripristino lascia la sede in bozza: va ripubblicata esplicitamente.
export const restoreLocation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const location = await loadLocation(supabase, data.id);
    if (!location) return { ok: false, error: "Sede non trovata." };
    if (!location.archived_at) return { ok: true };

    const { error } = await supabase
      .from("locations")
      .update({ archived_at: null })
      .eq("id", data.id);
    if (error) return { ok: false, error: dbError(error.message) };

    await audit(supabase, admin.userId, "restore_location", data.id, {
      slug: location.slug,
      name: location.name,
      archived_at: location.archived_at,
    });
    return { ok: true };
  });

async function buildPreview(
  supabase: ServerSupabase,
  location: NonNullable<Awaited<ReturnType<typeof loadLocation>>>,
): Promise<{ preview: DeletionPreview; documentPaths: string[] }> {
  const id = location.id;
  const [enrollments, cash, staffAttendance, meals, weeks, extras, fields, codes, docs] =
    await Promise.all([
      count(
        supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .eq("location_slug", location.slug),
      ),
      count(
        supabase
          .from("cash_movements")
          .select("id", { count: "exact", head: true })
          .eq("location_id", id),
      ),
      count(
        supabase
          .from("staff_attendance")
          .select("id", { count: "exact", head: true })
          .eq("location_id", id),
      ),
      count(
        supabase
          .from("daily_meals")
          .select("id", { count: "exact", head: true })
          .eq("location_id", id),
      ),
      count(
        supabase
          .from("location_weeks")
          .select("id", { count: "exact", head: true })
          .eq("location_id", id),
      ),
      count(
        supabase
          .from("location_extras")
          .select("id", { count: "exact", head: true })
          .eq("location_id", id),
      ),
      count(
        supabase
          .from("location_custom_fields")
          .select("id", { count: "exact", head: true })
          .eq("location_id", id),
      ),
      count(
        supabase
          .from("location_frequency_codes")
          .select("id", { count: "exact", head: true })
          .eq("location_id", id),
      ),
      supabase.from("location_documents").select("storage_path").eq("location_id", id),
    ]);

  const documentPaths = (docs.data ?? []).map((d) => d.storage_path);
  return {
    documentPaths,
    preview: {
      subject: `la sede ${location.name}`,
      blockers: [
        { label: "Iscrizioni", count: enrollments },
        { label: "Movimenti di cassa", count: cash },
        { label: "Presenze dello staff", count: staffAttendance },
        { label: "Giorni con pasti registrati", count: meals },
      ],
      removes: [
        { label: "Settimane", count: weeks },
        { label: "Servizi extra", count: extras },
        { label: "Documenti della sede, con i file", count: documentPaths.length },
        { label: "Campi personalizzati", count: fields },
        { label: "Codici di frequenza", count: codes },
        { label: "Logo del comune", count: location.logo_path ? 1 : 0 },
      ],
      alternative: location.archived_at
        ? "La sede è già archiviata: resta fuori dagli elenchi operativi e il suo storico è conservato."
        : "Archiviala: sparisce da sito, wizard e area staff, ma iscrizioni, pagamenti e presenze restano consultabili ed esportabili.",
    },
  };
}

export const getLocationDeletionPreview = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<Result<{ preview: DeletionPreview }>> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const location = await loadLocation(supabase, data.id);
    if (!location) return { ok: false, error: "Sede non trovata." };
    const { preview } = await buildPreview(supabase, location);
    return { ok: true, preview };
  });

export const deleteLocation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const location = await loadLocation(supabase, data.id);
    if (!location) return { ok: false, error: "Sede non trovata." };

    // Anteprima ricalcolata al momento dell'eliminazione, non quella del dialogo.
    const { preview, documentPaths } = await buildPreview(supabase, location);
    if (!canDelete(preview)) {
      return {
        ok: false,
        error: "La sede ha dati da conservare: si può solo archiviare.",
      };
    }

    // Prima i file (bucket privati), poi la riga: se i file non si rimuovono
    // ci si ferma, così non restano file senza sede.
    if (documentPaths.length > 0) {
      const { error } = await supabase.storage.from(LOCATION_DOCS_BUCKET).remove(documentPaths);
      if (error) {
        console.error("rimozione documenti sede:", error.message);
        return { ok: false, error: "Rimozione dei file dei documenti non riuscita. Riprova." };
      }
    }
    if (location.logo_path) {
      const { error } = await supabase.storage.from(LOGO_BUCKET).remove([location.logo_path]);
      if (error) {
        console.error("rimozione logo sede:", error.message);
        return { ok: false, error: "Rimozione del logo non riuscita. Riprova." };
      }
    }

    const { error } = await supabase.from("locations").delete().eq("id", data.id);
    if (error) return { ok: false, error: dbError(error.message) };

    await audit(supabase, admin.userId, "delete_location", data.id, {
      slug: location.slug,
      name: location.name,
      status: location.status,
      archived_at: location.archived_at,
      removed: Object.fromEntries(preview.removes.map((r) => [r.label, r.count])),
    });
    return { ok: true };
  });
