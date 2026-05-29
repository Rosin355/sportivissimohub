import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroGameSection } from "@/components/site/HeroGameSection";
import { AdventureCard } from "@/components/site/AdventureCard";
import { HorizontalStepper } from "@/components/site/HorizontalStepper";
import {
  Sun, BookOpen, School, Dumbbell,
  MapPin, UserPlus, FileCheck2, CheckCircle2, Rocket,
  Smile, Users, Activity, Trophy,
  Heart, MessageCircle, FolderLock, ShieldCheck, ListChecks,
} from "lucide-react";

// ── Illustration assets ──────────────────────────────────────────────────────
// Drop these PNG files in src/assets/ — see plan for filenames.
// @ts-expect-error — image asset (added by user)
import cardCentriEstivi       from "@/assets/card-centri-estivi.png";
// @ts-expect-error — image asset (added by user)
import cardDoposcuola         from "@/assets/card-doposcuola.png";
// @ts-expect-error — image asset (added by user)
import cardProgettiScuole     from "@/assets/card-progetti-scuole.png";
// @ts-expect-error — image asset (added by user)
import cardCorsiAttivita      from "@/assets/card-corsi-attivita.png";
// @ts-expect-error — image asset (added by user)
import benefitDivertimento    from "@/assets/benefit-divertimento.png";
// @ts-expect-error — image asset (added by user)
import benefitSquadra         from "@/assets/benefit-squadra.png";
// @ts-expect-error — image asset (added by user)
import benefitMovimento       from "@/assets/benefit-movimento.png";
// @ts-expect-error — image asset (added by user)
import benefitPiccoleConquiste from "@/assets/benefit-piccole-conquiste.png";
// @ts-expect-error — image asset (added by user)
import ctaBoy                 from "@/assets/cta-boy.png";
// @ts-expect-error — image asset (added by user)
import ctaGirl                from "@/assets/cta-girl.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sportivissimo A.S.D. — Centri estivi, doposcuola e avventure educative" },
      { name: "description", content: "Portale gestionale e iscrizioni online di Sportivissimo A.S.D.: centri estivi, doposcuola, corsi e progetti per scuole nel Veneto." },
    ],
  }),
  component: HomePage,
});

// Shared variant → colour maps used by both service and benefit cards
const iconBgMap: Record<string, string> = {
  sun:   "bg-flame",
  grass: "bg-grass",
  royal: "bg-primary",
  magic: "bg-magic",
};
const bottomBgMap: Record<string, string> = {
  sun:   "bg-flame/10",
  grass: "bg-grass/10",
  royal: "bg-primary/10",
  magic: "bg-magic/10",
};

// Wavy divider between text and illustration areas
function WaveTop() {
  return (
    <svg
      className="absolute top-0 left-0 w-full"
      viewBox="0 0 400 24"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 24 Q100 0 200 12 Q300 24 400 8 L400 24 Z" className="fill-white" />
    </svg>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">
        {/* 1 ── Hero (stats card overlaps, hence pt-20 on next section) */}
        <HeroGameSection />

        {/* 2 ── Service cards */}
        <section className="container mx-auto px-4 pt-20 pb-16">
          <SectionTitle
            pill="I nostri servizi"
            title={<>Quattro percorsi, <span className="text-primary">una sola squadra</span></>}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            <AdventureCard variant="sun"   icon={Sun}      image={cardCentriEstivi}    title="Centri Estivi"       description="Giornate di sport, giochi, laboratori e uscite alla scoperta di nuove passioni."        badge="Estate"       to="/centri-estivi" />
            <AdventureCard variant="grass" icon={BookOpen} image={cardDoposcuola}      title="Doposcuola"          description="Supporto allo studio e attività sportive per crescere insieme, ogni pomeriggio."         badge="Anno"         to="/centri-estivi" />
            <AdventureCard variant="royal" icon={School}   image={cardProgettiScuole}  title="Progetti per Scuole" description="Percorsi educativi e sportivi su misura per scuole di ogni ordine e grado."            badge="Scuole"       to="/centri-estivi" />
            <AdventureCard variant="magic" icon={Dumbbell} image={cardCorsiAttivita}   title="Corsi e Attività"    description="Corsi sportivi e attività educative durante tutto l'anno per ogni età."                 badge="Tutto l'anno" to="/centri-estivi" />
          </div>
        </section>

        {/* 3 ── Come funziona (horizontal stepper) */}
        <section className="bg-gradient-sky border-y border-border py-20">
          <div className="container mx-auto px-4">
            <SectionTitle
              pill="Come funziona"
              title="Come funziona"
              subtitle="Un percorso semplice e guidato. Ogni passo sblocca il successivo."
            />
            <div className="mt-12">
              <HorizontalStepper
                steps={[
                  { number: 1, icon: MapPin,       title: "Scegli la sede",       description: "Seleziona il centro più comodo per te." },
                  { number: 2, icon: UserPlus,     title: "Dati del bambino",     description: "Inserisci le informazioni richieste." },
                  { number: 3, icon: FileCheck2,   title: "Carica documenti",     description: "Allega i documenti necessari in modo semplice e sicuro." },
                  { number: 4, icon: CheckCircle2, title: "Conferma iscrizione",  description: "Verifica i dati e completa l'iscrizione online." },
                  { number: 5, icon: Rocket,       title: "Vivi l'avventura!",    description: "Il tuo bambino è pronto per iniziare!" },
                ]}
              />
            </div>
            <div className="text-center mt-12">
              <Link
                to="/come-funziona"
                className="inline-flex items-center gap-2 bg-white text-foreground border border-border rounded-xl px-6 py-3 font-display font-bold shadow-card hover:-translate-y-0.5 transition-transform"
              >
                Scopri tutti i passaggi
              </Link>
            </div>
          </div>
        </section>

        {/* 4 ── Perché piace ai bambini */}
        <section className="container mx-auto px-4 py-20">
          <SectionTitle
            pill="Perché piace ai bambini"
            title={<>Quattro <span className="text-grass">superpoteri</span> ogni giorno</>}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {(
              [
                { icon: Smile,    title: "Divertimento",     variant: "sun",   image: benefitDivertimento,     txt: "Giochi, sport e attività creative ogni giorno." },
                { icon: Users,    title: "Squadra",          variant: "grass", image: benefitSquadra,          txt: "Nuove amicizie e spirito di gruppo." },
                { icon: Activity, title: "Movimento",        variant: "royal", image: benefitMovimento,        txt: "Sport e attività all'aria aperta per stare bene e crescere." },
                { icon: Trophy,   title: "Piccole conquiste", variant: "magic", image: benefitPiccoleConquiste, txt: "Ogni giorno un passo in avanti, insieme." },
              ] as const
            ).map((b) => (
              <div
                key={b.title}
                className="flex flex-col rounded-2xl bg-white shadow-card border border-border overflow-hidden hover:-translate-y-1 transition-transform"
              >
                {/* Text */}
                <div className="p-5 flex-1">
                  <div className={`w-11 h-11 rounded-xl grid place-items-center mb-3 ${iconBgMap[b.variant]}`}>
                    <b.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{b.txt}</p>
                </div>
                {/* Illustration */}
                <div className={`relative h-36 overflow-hidden ${bottomBgMap[b.variant]}`}>
                  <WaveTop />
                  <img
                    src={b.image}
                    alt={b.title}
                    className="absolute bottom-0 right-4 h-[88%] w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5 ── Perché piace ai genitori */}
        <section className="bg-gradient-sky border-y border-border py-20">
          <div className="container mx-auto px-4">
            <SectionTitle
              pill="Perché piace ai genitori"
              title={<>Tutto quello che ti serve, <span className="text-primary">nessuno stress</span></>}
            />
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 divide-y divide-x divide-border border border-border rounded-2xl overflow-hidden bg-white shadow-card">
              {[
                { icon: Heart,         title: "Iscrizione semplice",        txt: "Pochi passaggi per iscrivere tuo figlio in pochi minuti." },
                { icon: MessageCircle, title: "Comunicazioni chiare",       txt: "Aggiornamenti costanti e informazioni sempre a portata di mano." },
                { icon: FolderLock,    title: "Documenti al sicuro",        txt: "Tutti i documenti archiviati in modo digitale, protetti e accessibili." },
                { icon: ShieldCheck,   title: "Sicurezza prima di tutto",   txt: "Staff qualificato e ambienti sicuri per ogni attività." },
                { icon: ListChecks,    title: "Organizzazione trasparente", txt: "Programmi chiari, costi trasparenti, nessuna sorpresa." },
                { icon: Trophy,        title: "Esperienza vera",            txt: "12 anni di esperienza al fianco di famiglie e scuole." },
              ].map((p) => (
                <div key={p.title} className="p-6 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center shrink-0">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-foreground">{p.title}</div>
                    <p className="text-sm text-muted-foreground">{p.txt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 ── CTA Banner */}
        <section className="container mx-auto px-4 py-24">
          <div className="rounded-3xl bg-gradient-cta-banner relative overflow-hidden shadow-pop px-8 md:px-16 py-14">
            {/* Confetti dots */}
            <span className="absolute top-6  left-[20%] w-2.5 h-2.5 rounded-full bg-flame/60 pointer-events-none" />
            <span className="absolute top-14 right-[28%] w-3   h-3   rounded-full bg-sun/60  pointer-events-none" />
            <span className="absolute top-8  right-[18%] w-2   h-2   rounded-full bg-grass/60 pointer-events-none" />
            <span className="absolute bottom-10 left-[28%] w-2 h-2   rounded-full bg-magic/50 pointer-events-none" />
            <span className="absolute bottom-6  right-[22%] w-3 h-3  rounded-full bg-flame/40 pointer-events-none" />
            <span className="absolute top-20 left-[35%] w-2 h-2      rounded-full bg-sun/50  pointer-events-none" />

            <div className="flex items-end justify-between gap-6">
              {/* Left character */}
              <img
                src={ctaBoy}
                alt="Bambino con zaino"
                className="hidden lg:block w-36 xl:w-44 object-contain self-end shrink-0"
              />

              {/* Center content */}
              <div className="flex-1 text-center text-white max-w-xl mx-auto">
                <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-xl px-3 py-1 font-pixel text-white mb-4">
                  <Trophy className="w-3.5 h-3.5 text-sun" /> Inizia subito
                </span>
                <h2 className="font-display text-4xl md:text-5xl font-bold">
                  Pronto per una <span className="text-sun">nuova avventura?</span>
                </h2>
                <p className="mt-3 text-white/65 max-w-md mx-auto">
                  Iscrivilo ora e regala a tuo figlio un'estate (o un doposcuola) indimenticabile.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/area-genitori"
                    className="inline-flex items-center gap-2 bg-flame text-white rounded-xl px-6 py-3 font-display font-bold shadow-pop hover:scale-105 transition-transform"
                  >
                    Iscrivi tuo figlio →
                  </Link>
                  <Link
                    to="/centri-estivi"
                    className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white rounded-xl px-6 py-3 font-display font-bold hover:bg-white/25 transition-colors"
                  >
                    <MapPin className="w-4 h-4" /> Scopri i centri
                  </Link>
                </div>
              </div>

              {/* Right character */}
              <img
                src={ctaGirl}
                alt="Bambina con pallone"
                className="hidden lg:block w-36 xl:w-44 object-contain self-end shrink-0"
              />
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
