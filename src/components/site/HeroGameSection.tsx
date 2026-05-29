import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-sportivissimo.jpg";
import type { LucideIcon } from "lucide-react";
import { Sun, MapPin, Users, Star } from "lucide-react";

type StatVariant = "primary" | "grass" | "sun";

const statCls: Record<StatVariant, string> = {
  primary: "bg-primary/10 text-primary",
  grass:   "bg-grass/15 text-grass",
  sun:     "bg-sun/20 text-sun-foreground",
};

function StatBadge({ icon: Icon, variant, label }: { icon: LucideIcon; variant: StatVariant; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${statCls[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-display font-bold text-foreground text-base leading-tight">{label}</span>
    </div>
  );
}

export function HeroGameSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="container mx-auto px-4 pt-14 pb-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[460px]">

          {/* Left: copy */}
          <div className="animate-pop py-8">
            {/* Season pill */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Sun className="w-3.5 h-3.5 text-flame" />
              <span className="text-sm font-semibold">Stagione 2026 aperta!</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-foreground">
              Dove gioco, sport e crescita diventano{" "}
              <span className="text-flame relative inline-block">
                avventura
                {/* Wavy yellow underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-sun"
                  preserveAspectRatio="none"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 8 Q25 2 50 8 Q75 12 100 6 Q125 0 150 8 Q175 12 200 6"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-8 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Centri estivi, doposcuola e attività educative per bambini e ragazzi
              in un ambiente sicuro, professionale e pieno di entusiasmo.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/area-genitori"
                className="inline-flex items-center gap-2 bg-foreground text-background rounded-xl px-6 py-3.5 font-display text-lg font-bold shadow-pop hover:scale-105 transition-transform"
              >
                Iscrivi tuo figlio →
              </Link>
              <Link
                to="/centri-estivi"
                className="inline-flex items-center gap-2 border-2 border-foreground/20 text-foreground rounded-xl px-6 py-3.5 font-display text-lg font-bold hover:border-foreground/40 transition-colors"
              >
                <MapPin className="w-5 h-5 text-flame" /> Scopri i centri
              </Link>
            </div>
          </div>

          {/* Right: hero illustration */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-pop">
              <img
                src={heroImg}
                alt="Bambini che giocano a sport all'aperto"
                width={1536}
                height={1024}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Floating stats card — overlaps the section bottom */}
        <div className="relative z-10 -mb-10">
          <div className="bg-white rounded-2xl shadow-pop border border-border px-8 py-5 flex flex-wrap gap-8 justify-around max-w-2xl mx-auto">
            <StatBadge icon={Users}  variant="primary" label="1.200+ famiglie" />
            <StatBadge icon={MapPin} variant="grass"   label="10 sedi nel Veneto" />
            <StatBadge icon={Star}   variant="sun"     label="12 anni di esperienza" />
          </div>
        </div>
      </div>
    </section>
  );
}
