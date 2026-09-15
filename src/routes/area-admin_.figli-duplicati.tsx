import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Trash2, UserX } from "lucide-react";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ConfirmDeletionDialog } from "@/components/site/ConfirmDeletionDialog";
import { requireRole } from "@/lib/supabase/auth";
import {
  deleteDuplicateChild,
  getDuplicateChildDeletionPreview,
  listDuplicateChildren,
  type DuplicateChild,
  type DuplicateGroup,
} from "@/lib/enrollments/duplicates-fns";

// Figli duplicati (M11.3b), solo admin: schede dello stesso genitore con lo
// stesso codice fiscale, oppure stesso nome, cognome e data di nascita. Si
// elimina solo la scheda senza iscrizioni; l'ultima scheda di un gruppo non si
// elimina mai da qui.
export const Route = createFileRoute("/area-admin_/figli-duplicati")({
  beforeLoad: ({ context, location }) => ({
    auth: requireRole(context.auth, "admin", location.href),
  }),
  loader: async (): Promise<DuplicateGroup[]> => {
    const res = await listDuplicateChildren();
    if (!res.ok) throw new Error(res.error);
    return res.groups;
  },
  head: () => ({ meta: [{ title: "Figli duplicati — Area Admin Sportivissimo" }] }),
  component: FigliDuplicatiPage,
});

function formatDate(iso: string): string {
  return iso.slice(0, 10).split("-").reverse().join("/");
}

function FigliDuplicatiPage() {
  const groups: DuplicateGroup[] = Route.useLoaderData();
  const router = useRouter();
  const [deleting, setDeleting] = useState<DuplicateChild | null>(null);

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
        <div className="mt-3 mb-6">
          <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1 font-pixel mb-3">
            Pulizia dati
          </span>
          <h1 className="font-display text-4xl font-bold">Figli duplicati</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Schede dello stesso genitore che sembrano la stessa persona: stesso codice fiscale,
            oppure stesso nome, cognome e data di nascita. Si può eliminare la scheda doppia che non
            ha iscrizioni; se tutte ne hanno, vanno unite, operazione non ancora disponibile.
          </p>
        </div>

        {groups.length === 0 ? (
          <section className="rounded-2xl border border-border bg-white shadow-pop p-10 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto text-grass mb-3" />
            <p className="font-display text-xl font-bold">Nessun duplicato trovato</p>
          </section>
        ) : (
          <div className="space-y-4">
            {groups.map((g) => (
              <section
                key={g.children[0].id}
                className="rounded-2xl border border-border bg-white shadow-pop p-5 overflow-x-auto"
              >
                <div className="flex items-center gap-2 mb-3">
                  <UserX className="w-5 h-5 text-flame" />
                  <h2 className="font-display text-lg font-bold">{g.parent.name}</h2>
                  {g.parent.email && (
                    <span className="text-sm text-muted-foreground">{g.parent.email}</span>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left font-pixel text-muted-foreground border-b border-border">
                      <th className="py-2 pr-3">Figlio/a</th>
                      <th className="py-2 pr-3">Nascita</th>
                      <th className="py-2 pr-3">Codice fiscale</th>
                      <th className="py-2 pr-3">Scheda creata</th>
                      <th className="py-2 pr-3">Iscrizioni</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {g.children.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 font-semibold">
                          {c.firstName} {c.lastName}
                        </td>
                        <td className="py-2 pr-3">{formatDate(c.birthDate)}</td>
                        <td className="py-2 pr-3 font-pixel text-xs">{c.fiscalCode || "—"}</td>
                        <td className="py-2 pr-3">{formatDate(c.createdAt)}</td>
                        <td className="py-2 pr-3">
                          {c.enrollments.length === 0 ? (
                            <span className="text-muted-foreground">nessuna</span>
                          ) : (
                            <span className="text-xs">
                              {c.enrollments.map((e) => `${e.code} (${e.status})`).join(", ")}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {c.enrollments.length === 0 && (
                            <button
                              type="button"
                              onClick={() => setDeleting(c)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border border-flame/40 text-flame hover:bg-flame/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Elimina scheda
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        )}

        <ConfirmDeletionDialog
          open={deleting !== null}
          onOpenChange={(open) => !open && setDeleting(null)}
          loadPreview={() => getDuplicateChildDeletionPreview({ data: { id: deleting!.id } })}
          onConfirm={async () => {
            const res = await deleteDuplicateChild({ data: { id: deleting!.id } });
            if (!res.ok) {
              toast.error(res.error);
              return false;
            }
            toast.success("Scheda duplicata eliminata.");
            await router.invalidate();
            return true;
          }}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
