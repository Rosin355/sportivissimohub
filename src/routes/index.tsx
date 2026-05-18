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
        <section className="container mx-auto px-4 py-20">
          <SectionTitle
            pill="Scegli la tua avventura"
            title={<>Quattro mondi, <span className="text-primary">una sola squadra</span></>}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            <AdventureCard variant="sun"   icon={Sun}      title="Centri Estivi"       description="Sport, giochi, piscina, gite e tante risate ogni settimana." badge="Estate"      to="/centri-estivi" />
            <AdventureCard variant="grass" icon={BookOpen} title="Doposcuola"          description="Compiti seguiti, sport e laboratori dopo la campanella."       badge="Anno"        to="/centri-estivi" />
            <AdventureCard variant="royal" icon={School}   title="Progetti per Scuole" description="Progetti motori ed educativi su misura per istituti."          badge="Scuole"      to="/centri-estivi" />
            <AdventureCard variant="magic" icon={Dumbbell} title="Corsi e Attività"    description="Corsi per bambini e adulti, dal fitness al gioco-sport."       badge="Tutto l'anno" to="/centri-estivi" />
          </div>
        </section>

        {/* Come funziona */}
        <section className="bg-gradient-sky border-y border-border py-20">
          <div className="container mx-auto px-4">
            <SectionTitle
              pill="Come funziona"
              title={<>Iscrizione in <span className="text-flame">5 livelli</span></>}
              subtitle="Un percorso semplice e gamificato. Ogni passo sblocca il successivo."
            />
            <div className="grid md:grid-cols-2 gap-5 mt-10 max-w-5xl mx-auto">
              <LevelStep level={1} color="royal" icon={MapPin}       title="Scegli la sede"              description="Trova il centro più vicino e la settimana giusta." />
              <LevelStep level={2} color="magic" icon={UserPlus}     title="Aggiungi i dati del bambino" description="Profilo del bambino con allergie e preferenze." />
              <LevelStep level={3} color="sun"   icon={FileCheck2}   title="Carica documenti e consensi" description="Tutto in un click, sempre disponibile in area genitori." />
              <LevelStep level={4} color="flame" icon={CheckCircle2} title="Conferma l'iscrizione"       description="Pagamento sicuro e ricevuta automatica via email." />
              <div className="md:col-span-2">
                <LevelStep level={5} color="grass" icon={Rocket} title="Vivi l'avventura!" description="La squadra ti aspetta. Ogni giorno una piccola conquista." />
              </div>
            </div>
            <div className="text-center mt-10">
              <Link
                to="/come-funziona"
                className="inline-flex items-center gap-2 bg-white text-foreground border border-border rounded-xl px-6 py-3 font-display font-bold shadow-card hover:-translate-y-0.5 transition-transform"
              >
                Scopri tutti i passaggi
              </Link>
            </div>
          </div>
        </section>

        {/* Perché piace ai bambini */}
        <section className="container mx-auto px-4 py-20">
          <SectionTitle
            pill="Perché piace ai bambini"
            title={<>Quattro <span className="text-grass">superpoteri</span> ogni giorno</>}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {[
              { icon: Smile,    title: "Divertimento",      color: "bg-gradient-sun text-sun-foreground",           txt: "Giornate piene di giochi, risate e sorprese." },
              { icon: Users,    title: "Squadra",           color: "bg-gradient-grass text-grass-foreground",       txt: "Si fanno amici veri e si impara a collaborare." },
              { icon: Activity, title: "Movimento",         color: "bg-gradient-royal text-primary-foreground",     txt: "Sport, all'aperto, sempre in azione." },
              { icon: Trophy,   title: "Piccole conquiste", color: "bg-gradient-magic text-magic-foreground",       txt: "Ogni traguardo è un nuovo livello sbloccato." },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl bg-white shadow-card border border-border overflow-hidden hover:-translate-y-1 transition-transform">
                <div className={`${b.color} p-5 flex justify-center`}>
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm grid place-items-center">
                    <b.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-display text-xl font-bold">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{b.txt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Perché piace ai genitori */}
        <section className="bg-secondary border-y border-border py-20">
          <div className="container mx-auto px-4">
            <SectionTitle
              pill="Perché piace ai genitori"
              title={<>Tutto quello che ti serve, <span className="text-primary">nessuno stress</span></>}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
              {[
                { icon: Heart,         title: "Iscrizione semplice",       txt: "In pochi minuti dal telefono, ovunque tu sia." },
                { icon: MessageCircle, title: "Comunicazioni chiare",      txt: "Avvisi, foto e novità sempre al posto giusto." },
                { icon: FolderLock,    title: "Documenti al sicuro",       txt: "Modulistica e ricevute disponibili 24/7." },
                { icon: ShieldCheck,   title: "Sicurezza prima di tutto",  txt: "Staff qualificato, deleghe ritiro, allergie tracciate." },
                { icon: ListChecks,    title: "Organizzazione trasparente", txt: "Stati iscrizione, pagamenti e presenze in tempo reale." },
                { icon: Trophy,        title: "Esperienza vera",           txt: "12 anni accanto alle famiglie del Veneto." },
              ].map((p) => (
                <div key={p.title} className="rounded-2xl bg-white shadow-card border border-border p-5 flex gap-4 items-start hover:shadow-pop transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-gradient-royal text-primary-foreground grid place-items-center shrink-0">
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold">{p.title}</div>
                    <p className="text-sm text-muted-foreground">{p.txt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA finale */}
        <section className="container mx-auto px-4 py-24">
          <div className="rounded-2xl bg-gradient-hero text-white p-10 md:p-14 shadow-pop relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-magic/25 blur-[80px]" />
              <div className="absolute -bottom-10 left-1/4 w-64 h-64 rounded-full bg-flame/20 blur-[80px]" />
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-xl px-3 py-1 font-pixel text-white mb-4">
                <Trophy className="w-3.5 h-3.5 text-sun" /> Inizia subito
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-bold max-w-2xl">
                Pronto per una <span className="text-sun">nuova avventura?</span>
              </h2>
              <p className="mt-3 max-w-xl text-white/65">La squadra ti aspetta. Iscrivi tuo figlio in pochi minuti.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/area-genitori"
                  className="bg-gradient-flame text-flame-foreground rounded-xl px-6 py-3 font-display font-bold shadow-pop hover:scale-105 transition-transform"
                >
                  Iscriviti ora
                </Link>
                <Link
                  to="/centri-estivi"
                  className="bg-white/10 backdrop-blur-sm border border-white/25 text-white rounded-xl px-6 py-3 font-display font-bold hover:bg-white/20 transition-colors"
                >
                  Esplora i centri estivi
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SectionTitle({
  pill,
  title,
  subtitle,
}: {
  pill: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <span className="inline-flex items-center bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1 font-pixel">
        {pill}
      </span>
      <h2 className="font-display text-3xl md:text-5xl font-bold mt-4 leading-tight">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
