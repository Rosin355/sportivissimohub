import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ConfirmDeletionDialog } from "@/components/site/ConfirmDeletionDialog";
import { requireRole } from "@/lib/supabase/auth";
import { listLocations } from "@/lib/locations/server-fns";
import {
  archiveLocation,
  deleteLocation,
  getLocationDeletionPreview,
  restoreLocation,
} from "@/lib/locations/lifecycle-fns";
import { LOCATION_TYPE_LABELS } from "@/lib/locations/validation";
import { locationCapacity, type Location } from "@/data/locations";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";

// Elenco sedi per l'admin: tutte, comprese le bozze (RLS). Le sedi archiviate
// (M11.3b) stanno in una sezione separata: fuori dagli elenchi operativi, ma
// con registro, cassa e storico consultabili.
export const Route = createFileRoute("/area-admin_/sedi")({
  beforeLoad: ({ context, location }) => ({
    auth: requireRole(context.auth, "admin", location.href),
  }),
  loader: () => listLocations(),
  head: () => ({ meta: [{ title: "Sedi — Area Admin Sportivissimo" }] }),
  component: SediPage,
});

const btnRow =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border border-border hover:bg-secondary disabled:opacity-50";

function SediPage() {
  const locations: Location[] = Route.useLoaderData();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleting, setDeleting] = useState<Location | null>(null);

  const active = locations.filter((l) => !l.archivedAt);
  const archived = locations.filter((l) => l.archivedAt);

  async function run(
    id: string,
    op: () => Promise<{ ok: true } | { ok: false; error: string }>,
    msg: string,
  ) {
    setBusyId(id);
    try {
      const res = await op();
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      toast.success(msg);
      await router.invalidate();
      return true;
    } finally {
      setBusyId(null);
    }
  }

  function archive(l: Location) {
    const msg =
      l.status === "pubblicata"
        ? `Archiviare "${l.name}"? Verrà tolta dal sito, dal wizard e dall'area staff. Iscrizioni, pagamenti e presenze restano consultabili.`
        : `Archiviare "${l.name}"? Iscrizioni, pagamenti e presenze restano consultabili.`;
    if (!window.confirm(msg)) return;
    void run(l.id, () => archiveLocation({ data: { id: l.id } }), "Sede archiviata.");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-10">
        <Link
          to="/area-admin"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard admin
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-4 mt-3 mb-8">
          <div>
            <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1 font-pixel mb-3">
              Sedi
            </span>
            <h1 className="font-display text-4xl font-bold">Gestione sedi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Le sedi pubblicate compaiono nel sito e nel wizard; le bozze le vedi solo tu.
            </p>
          </div>
          <Link
            to="/area-admin/sedi/$id"
            params={{ id: "nuova" }}
            className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-5 py-3 font-display font-bold shadow-sticker hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-4 h-4" /> Nuova sede
          </Link>
        </div>

        <LocationsTable
          locations={active}
          busyId={busyId}
          emptyText='Nessuna sede attiva: creane una con "Nuova sede".'
          actions={(l) => (
            <>
              <button
                type="button"
                className={`${btnRow} mr-2`}
                disabled={busyId === l.id}
                onClick={() => archive(l)}
              >
                <Archive className="w-3.5 h-3.5" /> Archivia
              </button>
            </>
          )}
        />

        <section className="mt-8">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="inline-flex items-center gap-1.5 font-display text-xl font-bold"
          >
            {showArchived ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            Sedi archiviate ({archived.length})
          </button>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Fuori da sito, wizard e area staff. Registro, cassa e iscrizioni restano consultabili.
            Una sede si elimina definitivamente solo se non ha iscrizioni né storico.
          </p>
          {showArchived && (
            <LocationsTable
              locations={archived}
              busyId={busyId}
              emptyText="Nessuna sede archiviata."
              actions={(l) => (
                <>
                  <button
                    type="button"
                    className={`${btnRow} mr-2`}
                    disabled={busyId === l.id}
                    onClick={() =>
                      run(
                        l.id,
                        () => restoreLocation({ data: { id: l.id } }),
                        "Sede ripristinata come bozza: ripubblicala dalla scheda quando serve.",
                      )
                    }
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" /> Ripristina
                  </button>
                  <button
                    type="button"
                    className={`${btnRow} mr-2 text-flame`}
                    disabled={busyId === l.id}
                    onClick={() => setDeleting(l)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Elimina
                  </button>
                </>
              )}
            />
          )}
        </section>

        <ConfirmDeletionDialog
          open={deleting !== null}
          onOpenChange={(open) => !open && setDeleting(null)}
          loadPreview={() => getLocationDeletionPreview({ data: { id: deleting!.id } })}
          onConfirm={() =>
            run(
              deleting!.id,
              () => deleteLocation({ data: { id: deleting!.id } }),
              "Sede eliminata definitivamente.",
            )
          }
        />
      </main>
      <SiteFooter />
    </div>
  );
}

function LocationsTable({
  locations,
  busyId,
  emptyText,
  actions,
}: {
  locations: Location[];
  busyId: string | null;
  emptyText: string;
  actions: (l: Location) => React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white shadow-pop p-5 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-pixel text-muted-foreground border-b border-border">
            <th className="py-2 pr-3">Sede</th>
            <th className="py-2 pr-3">Tipo</th>
            <th className="py-2 pr-3">Stato</th>
            <th className="py-2 pr-3">Settimane</th>
            <th className="py-2 pr-3">Posti liberi</th>
            <th className="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody>
          {locations.map((l) => {
            const cap = locationCapacity(l);
            return (
              <tr
                key={l.id}
                className={`border-b border-border last:border-0 ${busyId === l.id ? "opacity-60" : ""}`}
              >
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary grid place-items-center overflow-hidden shrink-0">
                      {l.logoUrl ? (
                        <img src={l.logoUrl} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{l.name}</div>
                      <div className="font-pixel text-xs text-muted-foreground">
                        /{l.slug} · {l.comune}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-3">{LOCATION_TYPE_LABELS[l.type]}</td>
                <td className="py-3 pr-3">
                  {l.archivedAt ? (
                    <span className="font-pixel rounded-lg border px-2 py-0.5 bg-secondary text-muted-foreground border-border">
                      archiviata il {new Date(l.archivedAt).toLocaleDateString("it-IT")}
                    </span>
                  ) : (
                    <span
                      className={`font-pixel rounded-lg border px-2 py-0.5 ${
                        l.status === "pubblicata"
                          ? "bg-grass/15 text-grass border-grass/30"
                          : "bg-sun/20 text-sun-foreground border-sun/40"
                      }`}
                    >
                      {l.status}
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3">{l.weeks.length}</td>
                <td className="py-3 pr-3">
                  {cap.available}/{cap.capacity}
                </td>
                <td className="py-3 pr-3 text-right whitespace-nowrap">
                  {actions(l)}
                  {!l.archivedAt && l.status === "pubblicata" && (
                    <Link
                      to="/centri-estivi/$slug"
                      params={{ slug: l.slug }}
                      className={`${btnRow} mr-2`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Pagina
                    </Link>
                  )}
                  <Link
                    to="/area-admin/sedi/$slug/registro"
                    params={{ slug: l.slug }}
                    className={`${btnRow} mr-2`}
                  >
                    <Table2 className="w-3.5 h-3.5" /> Registro
                  </Link>
                  <Link to="/area-admin/sedi/$id" params={{ id: l.id }} className={btnRow}>
                    <Pencil className="w-3.5 h-3.5" /> Modifica
                  </Link>
                </td>
              </tr>
            );
          })}
          {locations.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
