import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LocationCard } from "@/components/site/LocationCard";
import { LOCATIONS, locationCardSummary } from "@/data/locations";

export const Route = createFileRoute("/centri-estivi")({
  head: () => ({
    meta: [
      { title: "Centri Estivi 2026 — Sportivissimo A.S.D." },
      { name: "description", content: "Scopri tutte le sedi dei centri estivi Sportivissimo nel Veneto. Iscrizioni online aperte." },
    ],
  }),
  component: CentriEstiviPage,
});

const locations = LOCATIONS.map(locationCardSummary);

function CentriEstiviPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">
        {/* Page hero */}
        <section className="bg-gradient-sky border-b border-border py-16">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1 font-pixel mb-4">
              Centri Estivi 2026
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mt-2">
              Scegli la tua <span className="text-flame">sede</span>
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              9 sedi nel Veneto, attività ogni settimana, posti aggiornati in tempo reale.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {locations.map((l) => <LocationCard key={l.slug} loc={l} />)}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
