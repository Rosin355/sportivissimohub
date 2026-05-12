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
  { name: "Galzignano Terme",        age: "6-13 anni", weeks: 8, spots: 14, total: 60, tags: [{label:"Sport",color:"flame"},{label:"Piscina",color:"royal"},{label:"Natura",color:"grass"}] },
  { name: "Castegnero Champions Camp", age: "8-14 anni", weeks: 6, spots: 22, total: 50, tags: [{label:"Calcio",color:"grass"},{label:"Squadra",color:"magic"}] },
  { name: "S. Pietro Viminario",     age: "5-11 anni", weeks: 7, spots: 9,  total: 45, tags: [{label:"Creatività",color:"magic"},{label:"Giochi",color:"sun"}] },
  { name: "Vo' Euganeo",             age: "6-12 anni", weeks: 5, spots: 18, total: 40, tags: [{label:"Natura",color:"grass"},{label:"Avventura",color:"flame"}] },
  { name: "Asigliano Veneto",        age: "5-11 anni", weeks: 4, spots: 12, total: 35, tags: [{label:"Sport",color:"flame"},{label:"Creatività",color:"magic"}] },
  { name: "Sossano",                 age: "6-13 anni", weeks: 6, spots: 7,  total: 40, tags: [{label:"Piscina",color:"royal"},{label:"Giochi di squadra",color:"sun"}] },
  { name: "Orgiano",                 age: "5-12 anni", weeks: 5, spots: 16, total: 38, tags: [{label:"Sport",color:"flame"},{label:"Natura",color:"grass"}] },
  { name: "Noventa Vicentina",       age: "6-13 anni", weeks: 7, spots: 20, total: 55, tags: [{label:"Multisport",color:"magic"},{label:"Piscina",color:"royal"}] },
  { name: "Bastia / Frassanelle",    age: "7-14 anni", weeks: 5, spots: 11, total: 45, tags: [{label:"Avventura",color:"flame"},{label:"Natura",color:"grass"}] },
];

function CentriEstiviPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <section className="bg-gradient-sky border-b-[3px] border-foreground/90 py-12">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block bg-white border-[3px] border-foreground/90 rounded-full px-3 py-1 font-pixel text-[10px] shadow-sticker">CENTRI ESTIVI 2026</span>
            <h1 className="font-display text-4xl md:text-6xl font-bold mt-4">Scegli la tua <span className="text-flame">sede</span></h1>
            <p className="mt-3 max-w-2xl mx-auto text-foreground/80">9 sedi nel Veneto, attività ogni settimana, posti aggiornati in tempo reale.</p>
          </div>
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
