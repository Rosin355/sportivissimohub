import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/non-autorizzato")({
  head: () => ({
    meta: [
      { title: "Non autorizzato — Sportivissimo" },
      { name: "description", content: "Non hai i permessi per accedere a questa area." },
    ],
  }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="w-16 h-16 rounded-2xl bg-flame/10 text-flame grid place-items-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="font-display text-4xl font-bold mb-3">Area riservata</h1>
        <p className="text-muted-foreground mb-8">
          Il tuo account non ha i permessi per accedere a questa sezione. Se pensi sia un errore,
          contatta la segreteria Sportivissimo.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-royal text-primary-foreground rounded-xl px-6 py-3 font-display font-bold shadow-sticker hover:scale-105 transition-transform"
          >
            Torna alla home
          </Link>
          <Link
            to="/area-genitori"
            className="inline-flex items-center gap-2 bg-white border border-border text-foreground rounded-xl px-6 py-3 font-display font-bold hover:bg-secondary transition-colors"
          >
            Vai all'area genitori
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
