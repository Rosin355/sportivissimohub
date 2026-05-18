import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LocationCard, type Location } from "@/components/site/LocationCard";

export const Route = createFileRoute("/centri-estivi")({
  head: () => ({
    meta: [
      { title: "Centri Estivi 2026 — Sportivissimo A.S.D." },
      { name: "description", content: "Scopri tutte le sedi dei centri estivi Sportivissimo nel Veneto. Iscrizioni online aperte." },
    ],
  }),
  component: CentriEstiviPage,
});

const locations: Location[] = [
  { name: "Galzignano Terme",         age: "6-13 anni", weeks: 8, spots: 14, total: 60, tags: [{ label: "Sport", color: "flame" }, { label: "Piscina", color: "royal" }, { label: "Natura", color: "grass" }] },
  { name: "Castegnero Champions Camp", age: "8-14 anni", weeks: 6, spots: 22, total: 50, tags: [{ label: "Calcio", color: "grass" }, { label: "Squadra", color: "magic" }] },
  { name: "S. Pietro Viminario",      age: "5-11 anni", weeks: 7, spots: 9,  total: 45, tags: [{ label: "Creatività", color: "magic" }, { label: "Giochi", color: "sun" }] },
  { name: "Vo' Euganeo",              age: "6-12 anni", weeks: 5, spots: 18, total: 40, tags: [{ label: "Natura", color: "grass" }, { label: "Avventura", color: "flame" }] },
  { name: "Asigliano Veneto",         age: "5-11 anni", weeks: 4, spots: 12, total: 35, tags: [{ label: "Sport", color: "flame" }, { label: "Creatività", color: "magic" }] },
  { name: "Sossano",                  age: "6-13 anni", weeks: 6, spots: 7,  total: 40, tags: [{ label: "Piscina", color: "royal" }, { label: "Giochi di squadra", color: "sun" }] },
  { name: "Orgiano",                  age: "5-12 anni", weeks: 5, spots: 16, total: 38, tags: [{ label: "Sport", color: "flame" }, { label: "Natura", color: "grass" }] },
  { name: "Noventa Vicentina",        age: "6-13 anni", weeks: 7, spots: 20, total: 55, tags: [{ label: "Multisport", color: "magic" }, { label: "Piscina", color: "royal" }] },
  { name: "Bastia / Frassanelle",     age: "7-14 anni", weeks: 5, spots: 11, total: 45, tags: [{ label: "Avventura", color: "flame" }, { label: "Natura", color: "grass" }] },
];

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
            {locations.map((l) => <LocationCard key={l.name} loc={l} />)}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
