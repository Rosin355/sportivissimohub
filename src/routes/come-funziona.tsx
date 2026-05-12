import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LevelStep } from "@/components/site/LevelStep";
import { MapPin, UserPlus, FileCheck2, CheckCircle2, Rocket } from "lucide-react";

export const Route = createFileRoute("/come-funziona")({
  head: () => ({
    meta: [
      { title: "Come funziona — Iscrizione online | Sportivissimo" },
      { name: "description", content: "Iscrivi tuo figlio in 5 livelli: scegli la sede, aggiungi i dati, carica i documenti, conferma e vivi l'avventura." },
    ],
  }),
  component: ComeFunzionaPage,
});

function ComeFunzionaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block bg-white border-[3px] border-foreground/90 rounded-full px-3 py-1 font-pixel text-[10px] shadow-sticker">COME FUNZIONA</span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-4">Iscrizione in <span className="text-flame">5 livelli</span></h1>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          <LevelStep level={1} color="royal" icon={MapPin}       title="Scegli la sede"              description="Esplora le 9 sedi e seleziona settimana e fascia oraria." />
          <LevelStep level={2} color="magic" icon={UserPlus}     title="Aggiungi i dati del bambino" description="Profilo, allergie, preferenze e contatti d'emergenza." />
          <LevelStep level={3} color="sun"   icon={FileCheck2}   title="Carica documenti e consensi" description="Carta d'identità, patto educativo, consensi privacy e foto." />
          <LevelStep level={4} color="flame" icon={CheckCircle2} title="Conferma l'iscrizione"        description="Pagamento sicuro, ricevuta automatica e badge sbloccato." />
          <div className="md:col-span-2">
            <LevelStep level={5} color="grass" icon={Rocket} title="Vivi l'avventura!" description="Check-in giornaliero, comunicazioni in tempo reale, foto e novità." />
          </div>
        </div>
        <div className="text-center mt-10">
          <Link to="/area-genitori" className="inline-flex bg-gradient-sun text-sun-foreground border-[3px] border-foreground/90 rounded-2xl px-6 py-3 font-display font-bold shadow-pop">
            Inizia l'iscrizione
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
