import type { ReactNode } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LevelStep } from "@/components/site/LevelStep";
import { getLocationBySlug, type Location } from "@/data/locations";
import {
  MapPin,
  Calendar,
  Clock,
  Wallet,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Sun,
  Trophy,
  UtensilsCrossed,
  Palette,
  Users2,
  Heart,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/centri-estivi_/$slug")({
  head: ({ params }) => {
    const loc = getLocationBySlug(params.slug);
    const title = loc
      ? `${loc.name} — Centro Estivo Sportivissimo`
      : "Centro estivo — Sportivissimo";
    const desc = loc?.tagline ?? "Scopri il centro estivo Sportivissimo.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  loader: ({ params }) => {
    const loc = getLocationBySlug(params.slug);
    if (!loc) throw notFound();
    return loc;
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-bold mb-3">Sede non trovata</h1>
        <p className="text-muted-foreground mb-6">Questa sede non esiste o è stata spostata.</p>
        <Link
          to="/centri-estivi"
          className="inline-flex items-center gap-2 bg-gradient-royal text-primary-foreground rounded-xl px-5 py-3 font-display font-bold shadow-sticker"
        >
          Torna alle sedi
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-3">Ops, qualcosa è andato storto</h1>
        <p className="text-muted-foreground mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="bg-gradient-royal text-primary-foreground rounded-xl px-5 py-3 font-display font-bold shadow-sticker"
        >
          Riprova
        </button>
      </main>
      <SiteFooter />
    </div>
  ),
  component: LocationDetailPage,
});

const tagStyle: Record<string, string> = {
  sun: "bg-sun/15 text-sun-foreground border-sun/30",
  grass: "bg-grass/15 text-grass border-grass/30",
  magic: "bg-magic/15 text-magic border-magic/30",
  flame: "bg-flame/15 text-flame border-flame/30",
  royal: "bg-primary/15 text-primary border-primary/30",
};

const iconForDayBlock = {
  sun: Sun,
  ball: Trophy,
  lunch: UtensilsCrossed,
  art: Palette,
  team: Users2,
  hug: Heart,
} as const;

function LocationDetailPage() {
  const loc = Route.useLoaderData() as Location;
  const available = Math.max(loc.totalSpots - loc.bookedSpots, 0);
  const pct = Math.round((loc.bookedSpots / loc.totalSpots) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-hero text-foreground relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-magic/25 blur-[110px]" />
            <div className="absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-flame/20 blur-[100px]" />
          </div>
          <div className="container mx-auto px-4 py-14 relative">
            <Link
              to="/centri-estivi"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-semibold mb-4"
            >
              ← Tutte le sedi
            </Link>
            <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end">
              <div>
                <span className="inline-flex items-center bg-primary/10 border border-primary/20 rounded-xl px-3 py-1 font-pixel text-primary mb-3">
                  Centro Estivo 2026
                </span>
                <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight text-foreground">
                  {loc.name}
                </h1>
                <p className="text-muted-foreground mt-2 inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> {loc.comune} · {loc.address}
                </p>
                <p className="text-lg text-foreground/80 mt-3 max-w-2xl">{loc.tagline}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="bg-secondary border border-border text-foreground font-pixel rounded-lg px-3 py-1">
                    {loc.age}
                  </span>
                  {loc.badges.map((b) => (
                    <span
                      key={b.label}
                      className={`font-pixel rounded-lg px-3 py-1 border ${tagStyle[b.color]}`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability sticker */}
              <div className="rounded-2xl bg-white/95 text-foreground p-5 shadow-pop min-w-[260px]">
                <div className="font-pixel text-muted-foreground mb-1">Posti disponibili</div>
                <div className="font-display text-4xl font-bold text-grass">
                  {available}
                  <span className="text-muted-foreground text-lg font-bold">/{loc.totalSpots}</span>
                </div>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 80 ? "bg-gradient-flame" : "bg-gradient-grass"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1.5 text-xs font-semibold text-muted-foreground text-right">
                  {pct}% prenotato
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                to="/centri-estivi/$slug/iscrizione"
                params={{ slug: loc.slug }}
                className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-6 py-3.5 font-display font-bold shadow-sticker hover:scale-105 transition-transform"
              >
                Iscrivi tuo figlio <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`mailto:${loc.contacts.email}?subject=${encodeURIComponent("Info " + loc.name)}`}
                className="inline-flex items-center gap-2 bg-white border border-border text-foreground rounded-xl px-6 py-3.5 font-display font-bold hover:bg-secondary transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Richiedi informazioni
              </a>
            </div>
          </div>
        </section>

        {/* Quick info cards */}
        <section className="container mx-auto px-4 py-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoStat
            gradient="bg-gradient-grass"
            icon={<Calendar className="w-5 h-5" />}
            label="Settimane disponibili"
            value={`${loc.weeks.length}`}
          />
          <InfoStat
            gradient="bg-gradient-sun"
            icon={<Clock className="w-5 h-5" />}
            label="Orari"
            value={loc.timeSlots.length + " fasce"}
          />
          <InfoStat
            gradient="bg-gradient-royal"
            icon={<Wallet className="w-5 h-5" />}
            label="Prezzo settimanale"
            value={`da € ${loc.pricing.residentFullDay}`}
          />
          <InfoStat
            gradient="bg-gradient-magic"
            icon={<Users className="w-5 h-5" />}
            label="Fascia età"
            value={loc.age}
          />
        </section>

        {/* Description + daily routine */}
        <section className="container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-border shadow-pop p-6">
            <h2 className="font-display text-2xl font-bold mb-3">Una giornata da campioni</h2>
            <p className="text-muted-foreground mb-6">{loc.description}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {loc.dayPlan.map((d, i) => {
                const Icon = iconForDayBlock[d.icon];
                return (
                  <div key={i}>
                    <div className="font-pixel text-muted-foreground mb-1">{d.time}</div>
                    <LevelStep
                      level={i + 1}
                      title={d.title}
                      description={d.description}
                      icon={Icon}
                      color={d.color}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-border shadow-pop p-5">
              <h3 className="font-display text-xl font-bold mb-3">Attività principali</h3>
              <div className="flex flex-wrap gap-2">
                {loc.activities.map((a) => (
                  <span
                    key={a}
                    className="bg-secondary text-foreground rounded-lg px-3 py-1.5 text-sm font-semibold"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-border shadow-pop p-5">
              <h3 className="font-display text-xl font-bold mb-3">Settimane disponibili</h3>
              <ul className="space-y-2">
                {loc.weeks.map((w) => (
                  <li key={w.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      Sett. {w.number} · {w.label}
                    </span>
                    <span
                      className={`font-pixel rounded-lg px-2 py-0.5 border ${w.spots <= 5 ? "bg-flame/10 text-flame border-flame/30" : "bg-grass/10 text-grass border-grass/30"}`}
                    >
                      {w.spots} posti
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white border border-border shadow-pop p-5">
              <h3 className="font-display text-xl font-bold mb-3">Orari</h3>
              <ul className="space-y-1.5 text-sm font-semibold">
                {loc.timeSlots.map((t) => (
                  <li key={t} className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-magic" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="container mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-gradient-grass text-grass-foreground p-6 shadow-pop">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-display text-2xl font-bold">Servizi inclusi</h3>
            </div>
            <ul className="space-y-2">
              {loc.includedServices.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white border border-border shadow-pop p-6">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-flame" />
              <h3 className="font-display text-2xl font-bold">Servizi extra</h3>
            </div>
            <ul className="space-y-2">
              {loc.extraServices.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between border-b border-dashed border-border last:border-0 pb-2 last:pb-0"
                >
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="font-pixel bg-flame/10 text-flame border border-flame/30 rounded-lg px-2 py-0.5">
                    + € {s.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Docs + contacts */}
        <section className="container mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-border shadow-pop p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-magic" />
              <h3 className="font-display text-2xl font-bold">Documenti necessari</h3>
            </div>
            <ul className="space-y-2">
              {loc.requiredDocuments.map((d) => (
                <li
                  key={d}
                  className="flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-magic" /> {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white border border-border shadow-pop p-6">
            <h3 className="font-display text-2xl font-bold mb-3">Hai una domanda?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Lo staff Sportivissimo risponde entro 24 ore.
            </p>
            <ul className="space-y-2 text-sm font-semibold">
              <li className="inline-flex items-center gap-2">
                <Phone className="w-4 h-4 text-grass" /> {loc.contacts.phone}
              </li>
              <li className="inline-flex items-center gap-2">
                <Mail className="w-4 h-4 text-magic" /> {loc.contacts.email}
              </li>
              <li className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-flame" /> {loc.address}
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-10">
          <h2 className="font-display text-3xl font-bold mb-4">Domande frequenti</h2>
          <div className="rounded-2xl bg-white border border-border shadow-pop p-4">
            <Accordion type="single" collapsible className="w-full">
              {loc.faq.map((f, i) => (
                <AccordionItem key={i} value={`f${i}`}>
                  <AccordionTrigger className="text-left font-display text-base">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 pb-16">
          <div className="rounded-2xl bg-gradient-hero text-foreground p-8 shadow-pop relative overflow-hidden border border-border">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-flame/30 blur-[60px] pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display text-3xl font-bold">Pronto a partire?</h2>
                <p className="text-muted-foreground">
                  Un'estate di sport, amici e nuove avventure ti aspetta a {loc.name}.
                </p>
              </div>
              <Link
                to="/centri-estivi/$slug/iscrizione"
                params={{ slug: loc.slug }}
                className="inline-flex items-center gap-2 bg-gradient-flame text-flame-foreground rounded-xl px-6 py-3.5 font-display font-bold shadow-sticker hover:scale-105 transition-transform"
              >
                Iscrivi tuo figlio <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function InfoStat({
  gradient,
  icon,
  label,
  value,
}: {
  gradient: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-border shadow-card overflow-hidden flex">
      <div className={`${gradient} grid place-items-center w-14 shrink-0 text-white`}>{icon}</div>
      <div className="p-3">
        <div className="font-pixel text-muted-foreground">{label}</div>
        <div className="font-display text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}
