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
      <main className="flex-1">
        {/* Page hero */}
        <section className="bg-gradient-hero py-16 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-magic/20 blur-[90px]" />
          </div>
          <div className="container mx-auto px-4 text-center relative">
            <span className="inline-flex items-center bg-white/15 border border-white/20 rounded-xl px-3 py-1 font-pixel text-white mb-4">
              Come funziona
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white mt-2">
              Iscrizione in <span className="text-flame">5 livelli</span>
            </h1>
            <p className="mt-3 max-w-xl mx-auto text-white/65">
              Un percorso semplice e guidato. Ogni passo sblocca il successivo.
            </p>
          </div>
          <div className="h-6 bg-gradient-to-b from-transparent to-background mt-8" />
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            <LevelStep level={1} color="royal" icon={MapPin}       title="Scegli la sede"              description="Esplora le 9 sedi e seleziona settimana e fascia oraria." />
            <LevelStep level={2} color="magic" icon={UserPlus}     title="Aggiungi i dati del bambino" description="Profilo, allergie, preferenze e contatti d'emergenza." />
            <LevelStep level={3} color="sun"   icon={FileCheck2}   title="Carica documenti e consensi" description="Carta d'identità, patto educativo, consensi privacy e foto." />
            <LevelStep level={4} color="flame" icon={CheckCircle2} title="Conferma l'iscrizione"       description="Pagamento sicuro, ricevuta automatica e badge sbloccato." />
            <div className="md:col-span-2">
              <LevelStep level={5} color="grass" icon={Rocket} title="Vivi l'avventura!" description="Check-in giornaliero, comunicazioni in tempo reale, foto e novità." />
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/area-genitori"
              className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-6 py-3.5 font-display font-bold shadow-pop hover:scale-105 transition-transform"
            >
              <Rocket className="w-5 h-5" /> Inizia l'iscrizione
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
