import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, type ServerSupabase } from "@/lib/registry/registry-server";
import { canDelete, deletionDbError, type DeletionPreview } from "@/lib/admin/deletion";

// Eliminazione definitiva di un'iscrizione (M11.3b). Lo strumento normale resta
// lo stato "annullata". Si elimina solo un'iscrizione senza pagamenti, presenze
// né firme elettroniche (evidenze da conservare); il trigger di guardia nel
// database ripete il controllo. Vengono rimossi i documenti caricati (file
// compresi), i delegati al ritiro, le caselle del registro e gli addebiti extra.

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const DOCUMENTS_BUCKET = "documents";

const idSchema = z.object({ id: z.string().uuid() }).strict();

async function headCount(query: PromiseLike<{ count: number | null }>) {
  const { count } = await query;
  return count ?? 0;
}

async function loadForDeletion(supabase: ServerSupabase, id: string) {
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, code, status, location_slug, parent_id, children ( first_name, last_name )")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      code: string;
      status: string;
      location_slug: string;
      parent_id: string;
      children: { first_name: string; last_name: string } | null;
    }>();
  if (!enrollment) return null;

  const byEnrollment = <T extends string>(table: T) =>
    supabase
      .from(table as "payments")
      .select("id", { count: "exact", head: true })
      .eq("enrollment_id", id);

  const [payments, attendance, signatures, delegates, cells, extras, docs] = await Promise.all([
    headCount(byEnrollment("payments")),
    headCount(byEnrollment("attendance")),
    headCount(byEnrollment("enrollment_signatures")),
    headCount(byEnrollment("pickup_delegates")),
    headCount(byEnrollment("enrollment_week_codes")),
    headCount(byEnrollment("extra_charges")),
    supabase.from("enrollment_documents").select("storage_path").eq("enrollment_id", id),
  ]);

  const documentPaths = (docs.data ?? []).map((d) => d.storage_path);
  const childName =
    `${enrollment.children?.first_name ?? ""} ${enrollment.children?.last_name ?? ""}`.trim();

  const preview: DeletionPreview = {
    subject: `l'iscrizione ${enrollment.code}${childName ? ` di ${childName}` : ""}`,
    blockers: [
      { label: "Pagamenti registrati", count: payments },
      { label: "Presenze registrate", count: attendance },
      { label: "Firme elettroniche", count: signatures },
    ],
    removes: [
      { label: "Documenti caricati, con i file", count: documentPaths.length },
      { label: "Delegati al ritiro", count: delegates },
      { label: "Caselle del registro", count: cells },
      { label: "Addebiti extra (gita)", count: extras },
    ],
    alternative:
      enrollment.status === "annullata"
        ? "L'iscrizione è già annullata: resta come storico e non compare nel registro."
        : 'Imposta lo stato "annullata": l\'iscrizione esce dal registro ma pagamenti, presenze e firme restano consultabili.',
  };
  return { enrollment, childName, documentPaths, preview };
}

export const getEnrollmentDeletionPreview = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<Result<{ preview: DeletionPreview }>> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;
    const loaded = await loadForDeletion(supabase, data.id);
    if (!loaded) return { ok: false, error: "Iscrizione non trovata." };
    return { ok: true, preview: loaded.preview };
  });

export const deleteEnrollment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const loaded = await loadForDeletion(supabase, data.id);
    if (!loaded) return { ok: false, error: "Iscrizione non trovata." };
    if (!canDelete(loaded.preview)) {
      return { ok: false, error: "L'iscrizione ha dati da conservare: si può solo annullare." };
    }

    // Prima i file (dati di minori in un bucket privato), poi la riga: se i
    // file non si rimuovono ci si ferma, così non restano documenti orfani.
    if (loaded.documentPaths.length > 0) {
      const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(loaded.documentPaths);
      if (error) {
        console.error("rimozione documenti iscrizione:", error.message);
        return { ok: false, error: "Rimozione dei documenti caricati non riuscita. Riprova." };
      }
    }

    const { error } = await supabase.from("enrollments").delete().eq("id", data.id);
    if (error) {
      const known = deletionDbError(error.message);
      if (!known) console.error("eliminazione iscrizione:", error.message);
      return { ok: false, error: known ?? "Eliminazione non riuscita. Riprova." };
    }

    // Nessun dato sanitario nel registro delle azioni: solo riferimenti.
    await supabase.from("audit_log").insert({
      actor_id: admin.userId,
      action: "delete_enrollment",
      entity: "enrollment",
      entity_id: data.id,
      detail: {
        code: loaded.enrollment.code,
        status: loaded.enrollment.status,
        location_slug: loaded.enrollment.location_slug,
        parent_id: loaded.enrollment.parent_id,
        child_name: loaded.childName,
        removed: Object.fromEntries(loaded.preview.removes.map((r) => [r.label, r.count])),
      },
    });
    return { ok: true };
  });
