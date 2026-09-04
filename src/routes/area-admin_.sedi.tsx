import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { requireRole } from "@/lib/supabase/auth";
import { listLocations } from "@/lib/locations/server-fns";
import { LOCATION_TYPE_LABELS } from "@/lib/locations/validation";
import { locationCapacity, type Location } from "@/data/locations";
import { ArrowLeft, Plus, Pencil, ExternalLink, MapPin } from "lucide-react";

// Elenco sedi per l'admin: tutte, comprese le bozze (RLS).
export const Route = createFileRoute("/area-admin_/sedi")({
  beforeLoad: ({ context, location }) => ({
    auth: requireRole(context.auth, "admin", location.href),
  }),
  loader: () => listLocations(),
  head: () => ({ meta: [{ title: "Sedi — Area Admin Sportivissimo" }] }),
  component: SediPage,
});

function SediPage() {
  const locations: Location[] = Route.useLoaderData();

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
                  <tr key={l.id} className="border-b border-border last:border-0">
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
                      <span
                        className={`font-pixel rounded-lg border px-2 py-0.5 ${
                          l.status === "pubblicata"
                            ? "bg-grass/15 text-grass border-grass/30"
                            : "bg-sun/20 text-sun-foreground border-sun/40"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3">{l.weeks.length}</td>
                    <td className="py-3 pr-3">
                      {cap.available}/{cap.capacity}
                    </td>
                    <td className="py-3 pr-3 text-right whitespace-nowrap">
                      <Link
                        to="/centri-estivi/$slug"
                        params={{ slug: l.slug }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border border-border hover:bg-secondary mr-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Pagina
                      </Link>
                      <Link
                        to="/area-admin/sedi/$id"
                        params={{ id: l.id }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border border-border hover:bg-secondary"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Modifica
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {locations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nessuna sede: creane una con "Nuova sede".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
