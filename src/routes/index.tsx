import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroGameSection } from "@/components/site/HeroGameSection";
import { AdventureCard } from "@/components/site/AdventureCard";
import { LevelStep } from "@/components/site/LevelStep";
import {
  Sun, BookOpen, School, Dumbbell,
  MapPin, UserPlus, FileCheck2, CheckCircle2, Rocket,
  Smile, Users, Activity, Trophy,
  Heart, MessageCircle, FolderLock, ShieldCheck, ListChecks,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sportivissimo A.S.D. — Centri estivi, doposcuola e avventure educative" },
      { name: "description", content: "Portale gestionale e iscrizioni online di Sportivissimo A.S.D.: centri estivi, doposcuola, corsi e progetti per scuole nel Veneto." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <HeroGameSection />

        {/* Avventure */}
        <section className="container mx-auto px-4 py-16">
          <SectionTitle pill="Scegli la tua avventura" title={<>Quattro mondi, <span className="text-magic">una sola squadra</span></>} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            <AdventureCard variant="sun"   icon={Sun}      title="Centri Estivi"        description="Sport, giochi, piscina, gite e tante risate ogni settimana." badge="Estate" to="/centri-estivi" />
            <AdventureCard variant="grass" icon={BookOpen} title="Doposcuola"           description="Compiti seguiti, sport e laboratori dopo la campanella."        badge="Anno" to="/centri-estivi" />
            <AdventureCard variant="royal" icon={School}   title="Progetti per Scuole"  description="Progetti motori ed educativi su misura per istituti."           badge="Scuole" to="/centri-estivi" />
            <AdventureCard variant="magic" icon={Dumbbell} title="Corsi e Attività"     description="Corsi per bambini e adulti, dal fitness al gioco-sport."        badge="Tutto l'anno" to="/centri-estivi" />
          </div>
        </section>

        {/* Come funziona */}
        <section className="bg-gradient-sky border-y-[3px] border-foreground/90 py-16">
          <div className="container mx-auto px-4">
            <SectionTitle pill="Come funziona" title={<>Iscrizione in <span className="text-flame">5 livelli</span></>} subtitle="Un percorso semplice e gamificato. Ogni passo sblocca il successivo." />
            <div className="grid md:grid-cols-2 gap-5 mt-10 max-w-5xl mx-auto">
              <LevelStep level={1} color="royal" icon={MapPin}      title="Scegli la sede"            description="Trova il centro più vicino e la settimana giusta." />
              <LevelStep level={2} color="magic" icon={UserPlus}    title="Aggiungi i dati del bambino" description="Profilo del bambino con allergie e preferenze." />
              <LevelStep level={3} color="sun"   icon={FileCheck2}  title="Carica documenti e consensi" description="Tutto in un click, sempre disponibile in area genitori." />
              <LevelStep level={4} color="flame" icon={CheckCircle2} title="Conferma l'iscrizione"      description="Pagamento sicuro e ricevuta automatica via email." />
              <div className="md:col-span-2">
                <LevelStep level={5} color="grass" icon={Rocket} title="Vivi l'avventura!" description="La squadra ti aspetta. Ogni giorno una piccola conquista." />
              </div>
            </div>
            <div className="text-center mt-10">
              <Link to="/come-funziona" className="inline-flex items-center gap-2 bg-white text-foreground border-[3px] border-foreground/90 rounded-2xl px-6 py-3 font-display font-bold shadow-pop hover:-translate-y-0.5 transition-transform">
                Scopri tutti i passaggi
              </Link>
            </div>
          </div>
        </section>

        {/* Perché piace ai bambini */}
        <section className="container mx-auto px-4 py-16">
          <SectionTitle pill="Perché piace ai bambini" title={<>Quattro <span className="text-grass">superpoteri</span> ogni giorno</>} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {[
              { icon: Smile,    title: "Divertimento",     color: "bg-gradient-sun text-sun-foreground", txt: "Giornate piene di giochi, risate e sorprese." },
              { icon: Users,    title: "Squadra",          color: "bg-gradient-grass text-grass-foreground", txt: "Si fanno amici veri e si impara a collaborare." },
              { icon: Activity, title: "Movimento",        color: "bg-gradient-royal text-primary-foreground", txt: "Sport, all'aperto, sempre in azione." },
              { icon: Trophy,   title: "Piccole conquiste", color: "bg-gradient-magic text-magic-foreground", txt: "Ogni traguardo è un nuovo livello sbloccato." },
            ].map((b) => (
              <div key={b.title} className="rounded-3xl border-[3px] border-foreground/90 bg-white shadow-pop overflow-hidden">
                <div className={`${b.color} p-5 grid place-items-center`}>
                  <div className="w-16 h-16 rounded-2xl bg-white/95 grid place-items-center border-[3px] border-foreground/90 shadow-sticker">
                    <b.icon className="w-8 h-8 text-foreground" />
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-display text-xl font-bold">{b.title}</h3>
                  <p className="text-sm text-foreground/75 mt-1">{b.txt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Perché piace ai genitori */}
        <section className="bg-secondary border-y-[3px] border-foreground/90 py-16">
          <div className="container mx-auto px-4">
            <SectionTitle pill="Perché piace ai genitori" title={<>Tutto quello che ti serve, <span className="text-magic">nessuno stress</span></>} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {[
                { icon: Heart,         title: "Iscrizione semplice",    txt: "In pochi minuti dal telefono, ovunque tu sia." },
                { icon: MessageCircle, title: "Comunicazioni chiare",   txt: "Avvisi, foto e novità sempre al posto giusto." },
                { icon: FolderLock,    title: "Documenti al sicuro",    txt: "Modulistica e ricevute disponibili 24/7." },
                { icon: ShieldCheck,   title: "Sicurezza prima di tutto", txt: "Staff qualificato, deleghe ritiro, allergie tracciate." },
                { icon: ListChecks,    title: "Organizzazione trasparente", txt: "Stati iscrizione, pagamenti e presenze in tempo reale." },
                { icon: Trophy,        title: "Esperienza vera",        txt: "12 anni accanto alle famiglie del Veneto." },
              ].map((p) => (
                <div key={p.title} className="rounded-3xl border-[3px] border-foreground/90 bg-white shadow-card p-5 flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-royal text-primary-foreground grid place-items-center border-2 border-foreground/90 shrink-0">
                    <p.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold">{p.title}</div>
                    <p className="text-sm text-foreground/75">{p.txt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA finale */}
        <section className="container mx-auto px-4 py-20">
          <div className="rounded-[2rem] border-[4px] border-foreground/90 bg-gradient-magic text-magic-foreground p-10 md:p-14 shadow-pop relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-3xl bg-sun border-[3px] border-foreground/90 grid place-items-center text-sun-foreground rotate-12 shadow-sticker">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold max-w-2xl">
              Pronto per una <span className="text-stroke text-sun">nuova avventura?</span>
            </h2>
            <p className="mt-3 max-w-xl text-magic-foreground/90">La squadra ti aspetta. Iscrivi tuo figlio in pochi minuti.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/area-genitori" className="bg-sun text-sun-foreground border-[3px] border-foreground/90 rounded-2xl px-6 py-3 font-display font-bold shadow-pop hover:-translate-y-1 transition-transform">
                Iscriviti ora
              </Link>
              <Link to="/centri-estivi" className="bg-white text-foreground border-[3px] border-foreground/90 rounded-2xl px-6 py-3 font-display font-bold shadow-pop hover:-translate-y-1 transition-transform">
                Esplora i centri estivi
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SectionTitle({ pill, title, subtitle }: { pill: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <span className="inline-flex items-center bg-white border-[3px] border-foreground/90 rounded-full px-3 py-1 font-pixel text-[10px] shadow-sticker">
        {pill}
      </span>
      <h2 className="font-display text-3xl md:text-5xl font-bold mt-4 leading-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-foreground/75">{subtitle}</p>}
    </div>
  );
}
