import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin, type ServerSupabase } from "@/lib/registry/registry-server";
import { canDelete, deletionDbError, type DeletionPreview } from "@/lib/admin/deletion";
import { findDuplicateGroups, type ChildCandidate } from "./duplicates";

// Figli duplicati (M11.3b), solo admin. Si elimina soltanto una scheda che fa
// davvero parte di un gruppo di duplicati e che non ha iscrizioni; il trigger
// di guardia nel database ripete il controllo sulle iscrizioni. Unire due
// schede che hanno entrambe iscrizioni non fa parte di questo task.
// Dati minimi: niente allergie, note mediche o bisogni speciali.

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export type DuplicateChild = ChildCandidate & {
  enrollments: { id: string; code: string; locationSlug: string; status: string }[];
};

export type DuplicateGroup = {
  parent: { id: string; name: string; email: string };
  children: DuplicateChild[];
};

type ChildRow = {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  fiscal_code: string | null;
  created_at: string;
  profiles: { first_name: string; last_name: string; email: string } | null;
  enrollments: { id: string; code: string; location_slug: string; status: string }[] | null;
};

async function loadChildren(supabase: ServerSupabase, parentId?: string): Promise<ChildRow[]> {
  let query = supabase
    .from("children")
    .select(
      "id, parent_id, first_name, last_name, birth_date, fiscal_code, created_at, profiles ( first_name, last_name, email ), enrollments ( id, code, location_slug, status )",
    );
  if (parentId) query = query.eq("parent_id", parentId);
  const { data, error } = await query.returns<ChildRow[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

function toCandidate(row: ChildRow): DuplicateChild {
  return {
    id: row.id,
    parentId: row.parent_id,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    fiscalCode: row.fiscal_code,
    createdAt: row.created_at,
    enrollments: (row.enrollments ?? []).map((e) => ({
      id: e.id,
      code: e.code,
      locationSlug: e.location_slug,
      status: e.status,
    })),
  };
}

export const listDuplicateChildren = createServerFn({ method: "GET" }).handler(
  async (): Promise<Result<{ groups: DuplicateGroup[] }>> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    let rows: ChildRow[];
    try {
      rows = await loadChildren(supabase);
    } catch (e) {
      console.error("figli duplicati:", (e as Error).message);
      return { ok: false, error: "Impossibile caricare le schede dei figli." };
    }
    const profileById = new Map(rows.map((r) => [r.parent_id, r.profiles]));
    const groups = findDuplicateGroups(rows.map(toCandidate)).map((children) => {
      const p = profileById.get(children[0].parentId);
      return {
        parent: {
          id: children[0].parentId,
          name: `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() || "—",
          email: p?.email ?? "",
        },
        children,
      };
    });
    groups.sort((a, b) => a.parent.name.localeCompare(b.parent.name, "it"));
    return { ok: true, groups };
  },
);

async function loadForDeletion(supabase: ServerSupabase, childId: string) {
  const { data: target } = await supabase
    .from("children")
    .select("id, parent_id")
    .eq("id", childId)
    .maybeSingle<{ id: string; parent_id: string }>();
  if (!target) return null;

  const siblings = (await loadChildren(supabase, target.parent_id)).map(toCandidate);
  const group = findDuplicateGroups(siblings).find((g) => g.some((c) => c.id === childId));
  const child = siblings.find((c) => c.id === childId)!;
  const name = `${child.firstName} ${child.lastName}`.trim();

  const preview: DeletionPreview = {
    subject: `la scheda di ${name}, data di nascita ${child.birthDate.split("-").reverse().join("/")}`,
    blockers: [{ label: "Iscrizioni collegate a questa scheda", count: child.enrollments.length }],
    removes: [],
    alternative:
      "Elimina invece la scheda doppia che non ha iscrizioni. Se entrambe ne hanno, vanno unite: operazione non ancora disponibile.",
  };
  return { child, group, preview };
}

export const getDuplicateChildDeletionPreview = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data }): Promise<Result<{ preview: DeletionPreview }>> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;
    const loaded = await loadForDeletion(supabase, data.id);
    if (!loaded) return { ok: false, error: "Scheda non trovata." };
    if (!loaded.group) {
      return {
        ok: false,
        error: "Questa scheda non risulta più un duplicato: non si elimina da qui.",
      };
    }
    return { ok: true, preview: loaded.preview };
  });

export const deleteDuplicateChild = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabaseServerClient();
    const admin = await requireAdmin(supabase);
    if (!admin.ok) return admin;

    const loaded = await loadForDeletion(supabase, data.id);
    if (!loaded) return { ok: false, error: "Scheda non trovata." };
    // Da qui si eliminano solo duplicati veri: mai l'unica scheda di un figlio.
    if (!loaded.group) {
      return {
        ok: false,
        error: "Questa scheda non risulta più un duplicato: non si elimina da qui.",
      };
    }
    if (!canDelete(loaded.preview)) {
      return { ok: false, error: "La scheda ha iscrizioni: non si può eliminare." };
    }

    const { error } = await supabase.from("children").delete().eq("id", data.id);
    if (error) {
      const known = deletionDbError(error.message);
      if (!known) console.error("eliminazione figlio duplicato:", error.message);
      return { ok: false, error: known ?? "Eliminazione non riuscita. Riprova." };
    }

    // Solo riferimenti: nessun dato sanitario nel registro delle azioni.
    await supabase.from("audit_log").insert({
      actor_id: admin.userId,
      action: "delete_duplicate_child",
      entity: "child",
      entity_id: data.id,
      detail: {
        parent_id: loaded.child.parentId,
        first_name: loaded.child.firstName,
        last_name: loaded.child.lastName,
        birth_date: loaded.child.birthDate,
        kept_children: loaded.group.filter((c) => c.id !== data.id).map((c) => c.id),
      },
    });
    return { ok: true };
  });
