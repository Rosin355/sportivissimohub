import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { HeroGameSection } from "@/components/site/HeroGameSection";
import serviceCentriEstivi from "@/assets/service-centri-estivi.png";
import serviceDoposcuola from "@/assets/service-doposcuola.png";
import serviceProgettiScuole from "@/assets/service-progetti-scuole.png";
import serviceCorsiAttivita from "@/assets/service-corsi-attivita.png";
import {
  ArrowRight, MapPin, Sun, BookOpen, School, Medal,
  Users, Activity,
  FileText, Check, PartyPopper,
  Smile, Laugh, Handshake, Footprints, Star, Trophy,
  MessageCircle, FolderLock, ShieldCheck, ClipboardList, Award,
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
  const services = [
    { icon: Sun,      title: "Centri Estivi",          desc: "Giornate di sport, giochi, laboratori e uscite alla scoperta di nuove passioni.", accent: "text-blue-500",   tile: "bg-blue-50/50",   img: serviceCentriEstivi,   to: "/centri-estivi" },
    { icon: BookOpen, title: "Doposcuola",             desc: "Supporto allo studio e attività sportive per crescere insieme, ogni pomeriggio.", accent: "text-green-500",  tile: "bg-green-50/50",  img: serviceDoposcuola,     to: "/centri-estivi" },
    { icon: School,   title: "Progetti per le Scuole", desc: "Percorsi educativi e sportivi su misura per scuole di ogni ordine e grado.",     accent: "text-yellow-500", tile: "bg-yellow-50/50", img: serviceProgettiScuole, to: "/centri-estivi" },
    { icon: Medal,    title: "Corsi e Attività",       desc: "Corsi sportivi e attività educative durante tutto l'anno per ogni età.",         accent: "text-orange-500", tile: "bg-orange-50/50", img: serviceCorsiAttivita,  to: "/centri-estivi" },
  ] as const;

  const steps = [
    { n: 1, icon: MapPin,      title: "Scegli la sede",                  desc: "Seleziona il centro più comodo per te." },
    { n: 2, icon: null,        title: "Aggiungi i dati\ndel bambino",    desc: "Inserisci le informazioni richieste." },
    { n: 3, icon: FileText,    title: "Carica documenti\ne consensi",    desc: "Allega i documenti necessari in modo semplice e sicuro." },
    { n: 4, icon: Check,       title: "Conferma\nl'iscrizione",          desc: "Verifica i dati e completa l'iscrizione online." },
    { n: 5, icon: PartyPopper, title: "Vivi l'avventura",                desc: "Il tuo bambino è pronto per iniziare!" },
  ] as const;

  const kidsBenefits = [
    { icon: Smile,      title: "Divertimento",      desc: "Giochi, sport e attività creative ogni giorno.",            ring: "bg-blue-600",   bgIcon: Laugh,     bgColor: "text-blue-50" },
    { icon: Users,      title: "Squadra",           desc: "Nuove amicizie e spirito di gruppo.",                       ring: "bg-green-500",  bgIcon: Handshake, bgColor: "text-green-50" },
    { icon: Footprints, title: "Movimento",         desc: "Sport e attività all'aria aperta per stare bene e crescere.", ring: "bg-orange-500", bgIcon: Activity,  bgColor: "text-orange-50" },
    { icon: Star,       title: "Piccole conquiste", desc: "Ogni giorno un passo in avanti, insieme.",                  ring: "bg-yellow-400", bgIcon: Trophy,    bgColor: "text-yellow-50" },
  ] as const;

  const parentBenefits = [
    { icon: Check,         title: "Iscrizione semplice",         desc: "Pochi passaggi per iscrivere tuo figlio in pochi minuti." },
    { icon: MessageCircle, title: "Comunicazioni chiare",        desc: "Aggiornamenti costanti e informazioni sempre a portata di mano." },
    { icon: FolderLock,    title: "Documenti al sicuro",         desc: "Tutti i documenti archiviati in modo digitale, protetti e accessibili." },
    { icon: ShieldCheck,   title: "Sicurezza prima di tutto",    desc: "Staff qualificato e ambienti sicuri per ogni attività." },
    { icon: ClipboardList, title: "Organizzazione trasparente",  desc: "Programmi chiari, costi trasparenti, nessuna sorpresa." },
    { icon: Award,         title: "Esperienza vera",             desc: "12 anni di esperienza al fianco di famiglie e scuole." },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 antialiased overflow-x-hidden">
      <SiteNav />
      <main className="flex-1">
        {/* Hero + Stats banner */}
        <HeroGameSection />

        {/* Services */}
        <section className="py-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <Link
                key={s.title}
                to={s.to}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full"
              >
                <div className="p-8 pb-0 flex-1">
                  <div className={`flex items-center gap-3 mb-4 ${s.accent}`}>
                    <s.icon className="w-8 h-8" strokeWidth={1.5} />
                    <h3 className="font-display text-2xl tracking-tight text-slate-900 leading-none">{s.title}</h3>
                  </div>
                  <p className="text-lg text-slate-600 font-medium leading-snug">{s.desc}</p>
                  <div className={`mt-6 ${s.accent} opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300`}>
                    <ArrowRight className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                </div>
                <div className={`h-40 ${s.tile} mt-4 relative overflow-hidden`}>
                  <img
                    src={s.img}
                    alt={s.title}
                    className="absolute inset-0 w-full h-full object-fill"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Come funziona */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <h2 className="font-display text-4xl tracking-tight text-slate-900 text-center mb-16">Come funziona</h2>
          <div className="relative">
            <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0 border-t-2 border-dashed border-slate-300 z-0" />
            <div className="grid md:grid-cols-5 gap-8 relative z-10">
              {steps.map((step) => (
                <div key={step.n} className="text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-display text-2xl mb-4 shadow-md ring-4 ring-white relative">
                    {step.n}
                    {step.icon && (
                      <div className="absolute -top-12 text-blue-400 opacity-50">
                        <step.icon className="w-8 h-8" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <h4 className="font-display text-xl tracking-tight text-slate-900 mb-2 whitespace-pre-line">{step.title}</h4>
                  <p className="text-base text-slate-600 font-medium leading-snug">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Perché piace ai bambini */}
        <section className="py-16 px-6 lg:px-12 max-w-[1400px] mx-auto">
          <h2 className="font-display text-4xl tracking-tight text-slate-900 text-center mb-12">Perché piace ai bambini</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kidsBenefits.map((b) => (
              <div key={b.title} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col relative overflow-hidden h-64">
                <div className="flex gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-full ${b.ring} text-white flex items-center justify-center shrink-0`}>
                    <b.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-display text-xl tracking-tight text-slate-900">{b.title}</h4>
                    <p className="text-base text-slate-600 font-medium leading-snug mt-1">{b.desc}</p>
                  </div>
                </div>
                <b.bgIcon className={`absolute -bottom-4 -right-4 w-40 h-40 ${b.bgColor} opacity-50`} strokeWidth={1.5} />
              </div>
            ))}
          </div>
        </section>

        {/* Perché piace ai genitori */}
        <section className="py-16 px-6 lg:px-12 max-w-[1400px] mx-auto bg-slate-50/50 rounded-[3rem] my-8">
          <h2 className="font-display text-4xl tracking-tight text-slate-900 text-center mb-12">Perché piace ai genitori</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 max-w-5xl mx-auto">
            {parentBenefits.map((p) => (
              <div key={p.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="font-display text-lg tracking-tight text-slate-900">{p.title}</h4>
                  <p className="text-base text-slate-600 font-medium leading-snug mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-12 px-6 lg:px-12 max-w-[1400px] mx-auto">
          <div className="bg-[#0A2540] rounded-[2.5rem] relative overflow-hidden py-16 px-6 text-center shadow-2xl">
            <div className="absolute -left-10 bottom-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -right-10 top-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
            <Star className="absolute top-10 left-1/4 text-yellow-400 w-8 h-8 opacity-50 animate-pulse" strokeWidth={1.5} />
            <Star className="absolute bottom-10 right-1/4 text-yellow-400 w-6 h-6 opacity-50 animate-pulse" strokeWidth={1.5} />

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="font-display text-4xl md:text-5xl tracking-tight text-white mb-4">Pronto per una nuova avventura?</h2>
              <p className="text-xl text-blue-100 font-medium mb-10">
                Iscrivilo ora e regala a tuo figlio un'estate (o un doposcuola) indimenticabile.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/area-genitori"
                  className="inline-flex items-center justify-center rounded-full bg-orange-500 text-white px-8 py-4 text-xl font-medium hover:bg-orange-600 transition-all shadow-[0_4px_14px_0_rgba(249,115,22,0.39)]"
                >
                  Iscrivi tuo figlio <ArrowRight className="ml-2 w-5 h-5" strokeWidth={1.5} />
                </Link>
                <Link
                  to="/centri-estivi"
                  className="inline-flex items-center justify-center rounded-full bg-transparent border-2 border-slate-600 text-white px-8 py-4 text-xl font-medium hover:bg-slate-800 transition-all"
                >
                  Scopri i centri <MapPin className="ml-2 w-5 h-5" strokeWidth={1.5} />
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
