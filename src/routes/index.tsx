import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroGameSection } from "@/components/site/HeroGameSection";
import {
  Sun, BookOpen, School, Dumbbell,
  MapPin, UserPlus, FileCheck2, CheckCircle2, Rocket,
  Smile, Users, Activity, Trophy,
  Heart, MessageCircle, FolderLock, ShieldCheck, ListChecks, Award,
  ArrowRight,
} from "lucide-react";
import cardCentri from "@/assets/card-centri-estivi.png";
import cardDopo from "@/assets/card-doposcuola.png";
import cardScuole from "@/assets/card-progetti-scuole.png";
import cardCorsi from "@/assets/card-corsi-attivita.png";
import benefitDivertimento from "@/assets/benefit-divertimento.png";
import benefitSquadra from "@/assets/benefit-squadra.png";
import benefitMovimento from "@/assets/benefit-movimento.png";
import benefitConquiste from "@/assets/benefit-piccole-conquiste.png";
import ctaBoy from "@/assets/cta-boy.png";
import ctaGirl from "@/assets/cta-girl.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sportivissimo A.S.D. — Centri estivi, doposcuola e avventure educative" },
      { name: "description", content: "Portale gestionale e iscrizioni online di Sportivissimo A.S.D.: centri estivi, doposcuola, corsi e progetti per scuole nel Veneto." },
    ],
  }),
  component: HomePage,
});

const services = [
  { icon: Sun,      color: "primary",  wave: "bg-primary/10",  img: cardCentri,  to: "/centri-estivi", title: "Centri Estivi",       desc: "Giornate di sport, giochi, laboratori e uscite alla scoperta di nuove passioni." },
  { icon: BookOpen, color: "grass",    wave: "bg-grass/10",    img: cardDopo,    to: "/centri-estivi", title: "Doposcuola",          desc: "Supporto allo studio e attività sportive per crescere insieme, ogni pomeriggio." },
  { icon: School,   color: "sun",      wave: "bg-sun/15",      img: cardScuole,  to: "/centri-estivi", title: "Progetti per le Scuole", desc: "Percorsi educativi e sportivi su misura per scuole di ogni ordine e grado." },
  { icon: Dumbbell, color: "flame",    wave: "bg-flame/10",    img: cardCorsi,   to: "/centri-estivi", title: "Corsi e Attività",    desc: "Corsi sportivi e attività educative durante tutto l'anno per ogni età." },
];

const steps = [
  { num: 1, color: "primary", icon: MapPin,       title: "Scegli la sede",            desc: "Seleziona il centro più comodo per te." },
  { num: 2, color: "magic",   icon: UserPlus,     title: "Aggiungi i dati del bambino", desc: "Inserisci le informazioni richieste." },
  { num: 3, color: "sun",     icon: FileCheck2,   title: "Carica documenti e consensi", desc: "Allega i documenti necessari in modo semplice e sicuro." },
  { num: 4, color: "grass",   icon: CheckCircle2, title: "Conferma l'iscrizione",       desc: "Verifica i dati e completa l'iscrizione online." },
  { num: 5, color: "flame",   icon: Rocket,       title: "Vivi l'avventura",            desc: "Il tuo bambino è pronto per iniziare!" },
];

const benefits = [
  { icon: Smile,    color: "bg-primary text-primary-foreground",   img: benefitDivertimento, title: "Divertimento",      desc: "Giochi, sport e attività creative ogni giorno." },
  { icon: Users,    color: "bg-grass text-grass-foreground",       img: benefitSquadra,      title: "Squadra",           desc: "Nuove amicizie e spirito di gruppo." },
  { icon: Activity, color: "bg-flame text-flame-foreground",       img: benefitMovimento,    title: "Movimento",         desc: "Sport e attività all'aria aperta per stare bene e crescere." },
  { icon: Trophy,   color: "bg-sun text-sun-foreground",           img: benefitConquiste,    title: "Piccole conquiste", desc: "Ogni giorno un passo in avanti, insieme." },
];

const parentFeatures = [
  { icon: CheckCircle2, title: "Iscrizione semplice",       desc: "Pochi passaggi per iscrivere tuo figlio in pochi minuti." },
  { icon: MessageCircle, title: "Comunicazioni chiare",     desc: "Aggiornamenti costanti e informazioni sempre a portata di mano." },
  { icon: FolderLock,   title: "Documenti al sicuro",       desc: "Tutti i documenti archiviati in modo digitale, protetti e accessibili." },
  { icon: ShieldCheck,  title: "Sicurezza prima di tutto",  desc: "Staff qualificato e ambienti sicuri per ogni attività." },
  { icon: ListChecks,   title: "Organizzazione trasparente", desc: "Programmi chiari, costi trasparenti, nessuna sorpresa." },
  { icon: Award,        title: "Esperienza vera",           desc: "12 anni di esperienza al fianco di famiglie e scuole." },
];

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1">
        <HeroGameSection />

        {/* Service cards */}
        <section className="container mx-auto px-4 py-16 lg:py-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s) => (
              <Link
                key={s.title}
                to={s.to}
                className="group relative rounded-3xl bg-white border border-border shadow-card overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-pop transition-all"
              >
                <div className="p-6 pb-3 flex-1">
                  <div className={`w-12 h-12 rounded-2xl grid place-items-center mb-4 bg-${s.color}/15 text-${s.color}`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  <ArrowRight className={`w-4 h-4 mt-4 text-${s.color} group-hover:translate-x-1 transition-transform`} />
                </div>
                <div className={`relative h-40 ${s.wave} mt-2`}>
                  <svg className="absolute top-0 left-0 right-0 w-full h-8 -translate-y-1/2" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 20 Q 100 0, 200 20 T 400 20 L 400 40 L 0 40 Z" fill="currentColor" className="text-white" />
                  </svg>
                  <img src={s.img} alt={s.title} loading="lazy" className="absolute bottom-0 left-1/2 -translate-x-1/2 h-36 w-auto object-contain" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Come funziona */}
        <section className="border-y border-border bg-secondary/40 py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">Come funziona</h2>
            <div className="relative">
              <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] border-t-2 border-dashed border-border" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 relative">
                {steps.map((s) => (
                  <div key={s.num} className="text-center flex flex-col items-center">
                    <div className={`relative w-14 h-14 rounded-full bg-${s.color} text-${s.color}-foreground grid place-items-center font-display font-bold text-lg shadow-pop`}>
                      {s.num}
                    </div>
                    <div className="mt-3 w-10 h-10 rounded-xl bg-white border border-border grid place-items-center shadow-card">
                      <s.icon className={`w-5 h-5 text-${s.color}`} />
                    </div>
                    <h3 className="font-display text-base font-bold mt-4">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 max-w-[180px]">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Perché piace ai bambini */}
        <section className="container mx-auto px-4 py-16 lg:py-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">Perché piace ai bambini</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-3xl bg-white border border-border shadow-card overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-pop transition-all">
                <div className="p-6 pb-3 flex-1">
                  <div className={`w-14 h-14 rounded-full grid place-items-center mb-4 ${b.color} shadow-sticker`}>
                    <b.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-1.5">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
                <div className="relative h-36 bg-secondary/40">
                  <svg className="absolute top-0 left-0 right-0 w-full h-8 -translate-y-1/2" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M0 20 Q 100 0, 200 20 T 400 20 L 400 40 L 0 40 Z" fill="currentColor" className="text-white" />
                  </svg>
                  <img src={b.img} alt={b.title} loading="lazy" className="absolute bottom-0 left-1/2 -translate-x-1/2 h-32 w-auto object-contain" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Perché piace ai genitori */}
        <section className="border-y border-border bg-secondary/40 py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">Perché piace ai genitori</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {parentFeatures.map((f, i) => (
                <div key={f.title} className={`flex flex-col items-start gap-3 px-2 ${i > 0 ? "xl:border-l xl:border-border xl:pl-6" : ""}`}>
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm">{f.title}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="container mx-auto px-4 py-16">
          <div className="relative rounded-3xl bg-gradient-hero text-white px-6 py-10 md:py-12 md:px-10 shadow-pop overflow-hidden">
            {/* confetti */}
            <div className="absolute inset-0 pointer-events-none">
              {[
                { l: "8%", t: "15%", c: "bg-sun" },
                { l: "20%", t: "70%", c: "bg-flame" },
                { l: "85%", t: "20%", c: "bg-grass" },
                { l: "75%", t: "75%", c: "bg-sun" },
                { l: "92%", t: "50%", c: "bg-coral" },
                { l: "15%", t: "40%", c: "bg-magic" },
              ].map((d, i) => (
                <span key={i} className={`absolute w-2 h-2 rounded-full ${d.c} opacity-80`} style={{ left: d.l, top: d.t }} />
              ))}
            </div>
            <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center relative">
              <img src={ctaBoy} alt="" loading="lazy" className="hidden md:block h-40 lg:h-48 w-auto" />
              <div className="text-center">
                <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold">
                  Pronto per una nuova avventura?
                </h2>
                <p className="mt-2 text-white/70 max-w-xl mx-auto">
                  Iscrivilo ora e regala a tuo figlio un'estate (o un doposcuola) indimenticabile.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <Link
                    to="/centri-estivi"
                    className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-full px-6 py-3 font-display font-bold shadow-pop hover:scale-105 transition-transform"
                  >
                    Iscrivi tuo figlio <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/centri-estivi"
                    className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white rounded-full px-6 py-3 font-display font-bold hover:bg-white/20 transition-colors"
                  >
                    <MapPin className="w-4 h-4" /> Scopri i centri
                  </Link>
                </div>
              </div>
              <img src={ctaGirl} alt="" loading="lazy" className="hidden md:block h-40 lg:h-48 w-auto justify-self-end" />
            </div>
          </div>
        </section>

        {/* visually-hidden anchors to keep dynamic class names in JIT */}
        <div className="hidden bg-primary bg-grass bg-sun bg-flame bg-magic bg-coral text-primary text-grass text-sun text-flame text-magic text-coral bg-primary/15 bg-grass/15 bg-sun/15 bg-flame/15 bg-magic/15 bg-primary/10 bg-grass/10 bg-sun/10 bg-flame/10 bg-magic/10 text-primary-foreground text-grass-foreground text-sun-foreground text-flame-foreground text-magic-foreground" />
      </main>
      <SiteFooter />
    </div>
  );
}
