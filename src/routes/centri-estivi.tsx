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
        <section className="bg-gradient-hero py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-magic/20 blur-[100px]" />
            <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-flame/15 blur-[80px]" />
          </div>
          <div className="container mx-auto px-4 text-center relative">
            <span className="inline-flex items-center bg-white/15 border border-white/20 rounded-xl px-3 py-1 font-pixel text-white mb-4">
              Centri Estivi 2026
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mt-2">
              Scegli la tua <span className="text-flame">sede</span>
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-white/65">
              9 sedi nel Veneto, attività ogni settimana, posti aggiornati in tempo reale.
            </p>
          </div>
          <div className="h-6 bg-gradient-to-b from-transparent to-background mt-8" />
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
